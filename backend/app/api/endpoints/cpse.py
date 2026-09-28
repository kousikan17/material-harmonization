import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status, Query, UploadFile, File, BackgroundTasks
from sqlalchemy import func, delete, update, select
from sqlalchemy.orm import Session

from app.api.deps import assert_cpse_access, get_current_user, require_roles
from app.db.session import get_db
from app.models.cpse import CPSE, Sector, CognateGroup
from pydantic import BaseModel

from app.models.enums import MappingDecisionStatus, MappingType, RoleName
from app.models.harmonization import CommonMaterialMapping
from app.models.material import CPSEMaterial
from app.models.import_batch import ImportBatch
from app.models.user import User
from app.schemas.cpse import (
    CPSECreate,
    CPSEOut,
    CPSEStats,
    CPSEStatusUpdate,
    CPSEUpdate,
    CPSEBulkValidationResponse,
    CPSEBulkImportResponse,
)
from app.services.cpse_import_service import (
    build_cpse_upload_template_csv,
    import_valid_cpses,
    validate_cpse_file,
)
from app.services.csv_import_service import CsvImportError

router = APIRouter(prefix="/cpse", tags=["CPSE Network"])



_NON_REJECTED = CommonMaterialMapping.decision_status != MappingDecisionStatus.REJECTED.value
_PENDING_STATUSES = (
    MappingDecisionStatus.AI_RECOMMENDED.value,
    MappingDecisionStatus.PENDING_VALIDATION.value,
    MappingDecisionStatus.MANUAL_REVIEW.value,
)


def _stats_for(db: Session, cpse: CPSE) -> CPSEStats:
    total = db.query(func.count(CPSEMaterial.id)).filter(CPSEMaterial.cpse_id == cpse.id).scalar() or 0
    active = db.query(func.count(CPSEMaterial.id)).filter(CPSEMaterial.cpse_id == cpse.id, CPSEMaterial.is_active == True).scalar() or 0
    inactive = total - active
    
    from app.models.enums import MaterialStatus
    new_mats = db.query(func.count(CPSEMaterial.id)).filter(CPSEMaterial.cpse_id == cpse.id, CPSEMaterial.status == MaterialStatus.PENDING.value).scalar() or 0

    mapping_rows = (
        db.query(CommonMaterialMapping.mapping_type, CommonMaterialMapping.decision_status)
        .join(CPSEMaterial, CommonMaterialMapping.cpse_material_id == CPSEMaterial.id)
        .filter(CPSEMaterial.cpse_id == cpse.id, _NON_REJECTED)
        .all()
    )
    common_materials = len(mapping_rows)
    duplicates = sum(1 for mt, _ in mapping_rows if mt in (MappingType.IDENTICAL.value, MappingType.DUPLICATE.value))
    near_duplicates = sum(1 for mt, _ in mapping_rows if mt == MappingType.NEAR_DUPLICATE.value)
    functional_equivalents = sum(1 for mt, _ in mapping_rows if mt == MappingType.FUNCTIONALLY_EQUIVALENT.value)
    pending_mappings = sum(1 for _, ds in mapping_rows if ds in _PENDING_STATUSES)
    unique_materials = total - common_materials

    legacy_codes = (
        db.query(func.count(func.distinct(CPSEMaterial.original_material_code)))
        .filter(CPSEMaterial.cpse_id == cpse.id, CPSEMaterial.is_active.is_(False))
        .scalar()
        or 0
    )

    return CPSEStats(
        id=cpse.id,
        code=cpse.code,
        name=cpse.name,
        sector_name=cpse.cognate_group.sector.name if cpse.cognate_group else None,
        cognate_group_name=cpse.cognate_group.name if cpse.cognate_group else None,
        cognate_group_id=cpse.cognate_group_id,
        administrative_ministry_id=cpse.administrative_ministry_id,
        administrative_ministry=cpse.administrative_ministry_ref.name if cpse.administrative_ministry_ref else None,
        description=cpse.description,
        logo_url=cpse.logo_url,
        is_active=cpse.is_active,
        material_database_available=cpse.material_database_available,
        last_sync_at=cpse.last_sync_at,
        synchronization_status=cpse.synchronization_status,
        created_at=cpse.created_at,
        total_materials=total,
        active_materials=active,
        inactive_materials=inactive,
        new_materials=new_mats,
        common_materials=common_materials,
        unique_materials=max(unique_materials, 0),
        duplicates=duplicates,
        near_duplicates=near_duplicates,
        functional_equivalents=functional_equivalents,
        pending_mappings=pending_mappings,
        legacy_codes=legacy_codes,
    )


def _get_or_404(db: Session, cpse_id: uuid.UUID) -> CPSE:
    cpse = db.query(CPSE).filter(CPSE.id == cpse_id).first()
    if not cpse:
        raise HTTPException(status_code=404, detail="CPSE not found")
    return cpse


@router.get("", response_model=list[CPSEStats])
def list_cpse(
    sector: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """A company-scoped user only ever sees their own company's row here -
    "Each company should only be able to access its own material database"
    applies to the CPSE roster too, not just the materials underneath it."""
    query = db.query(CPSE)
    if current_user.cpse_id is not None:
        query = query.filter(CPSE.id == current_user.cpse_id)
    if sector:
        query = query.join(CPSE.cognate_group).join(CognateGroup.sector).filter(Sector.name == sector)
    cpses = query.order_by(CPSE.name).all()
    return [_stats_for(db, c) for c in cpses]



@router.get("/bulk/template")
def get_cpse_bulk_template():
    content = build_cpse_upload_template_csv()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="cpse_upload_template.csv"'}
    )


@router.post("/bulk/validate", response_model=CPSEBulkValidationResponse)
def validate_cpse_bulk(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        raw_bytes = file.file.read()
        return validate_cpse_file(db, filename=file.filename, raw_bytes=raw_bytes)
    except CsvImportError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bulk/confirm", response_model=CPSEBulkImportResponse)
def confirm_cpse_bulk(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        raw_bytes = file.file.read()
        validation = validate_cpse_file(db, filename=file.filename, raw_bytes=raw_bytes)
        if validation.invalid_count > 0:
            raise HTTPException(status_code=400, detail="Cannot import file with validation errors.")
        return import_valid_cpses(db, validation=validation, actor_id=current_user.id, actor_name=current_user.full_name)
    except CsvImportError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=CPSEOut, status_code=201)
def create_cpse(
    payload: CPSECreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN.value)),
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Create CPSE request received")
    
    from app.models.cpse import CognateGroup
    cg = db.query(CognateGroup).filter(CognateGroup.id == payload.cognate_group_id).first()
    if not cg:
        raise HTTPException(status_code=400, detail="Invalid Cognate Group ID.")

    if payload.administrative_ministry_id:
        from app.models.cpse import AdministrativeMinistry
        min = db.query(AdministrativeMinistry).filter(AdministrativeMinistry.id == payload.administrative_ministry_id).first()
        if not min:
            raise HTTPException(status_code=400, detail="Invalid Administrative Ministry ID.")

    if db.query(CPSE).filter(CPSE.code == payload.code.upper()).first():
        raise HTTPException(status_code=400, detail=f"CPSE code {payload.code.upper()} already exists.")

    logger.info("Creating CPSE:")
    cpse = CPSE(
        code=payload.code.upper(),
        name=payload.name,
        cognate_group_id=payload.cognate_group_id,
        administrative_ministry_id=payload.administrative_ministry_id,
        description=payload.description,
        material_database_available=payload.material_database_available,
    )
    
    try:
        db.add(cpse)
        db.commit()
        logger.info("Database commit successful")
        db.refresh(cpse)
        return cpse
    except Exception as e:
        db.rollback()
        logger.error(f"Database insertion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cpse_id}", response_model=CPSEStats)
def get_cpse(cpse_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assert_cpse_access(current_user, cpse_id)
    return _stats_for(db, _get_or_404(db, cpse_id))


@router.put("/{cpse_id}", response_model=CPSEOut)
def update_cpse(
    cpse_id: uuid.UUID,
    payload: CPSEUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN.value)),
):
    cpse = _get_or_404(db, cpse_id)
    if payload.cognate_group_id is not None:
        from app.models.cpse import CognateGroup
        cg = db.query(CognateGroup).filter(CognateGroup.id == payload.cognate_group_id).first()
        if not cg:
            raise HTTPException(status_code=400, detail="Invalid Cognate Group ID.")
    
    if payload.administrative_ministry_id is not None:
        from app.models.cpse import AdministrativeMinistry
        min = db.query(AdministrativeMinistry).filter(AdministrativeMinistry.id == payload.administrative_ministry_id).first()
        if not min:
            raise HTTPException(status_code=400, detail="Invalid Administrative Ministry ID.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "administrative_ministry":
            continue
        setattr(cpse, field, value)
    db.commit()
    db.refresh(cpse)
    return cpse


@router.get("/{cpse_id}/imports")
def get_cpse_imports(cpse_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assert_cpse_access(current_user, cpse_id)
    _get_or_404(db, cpse_id)
    
    batches = db.query(ImportBatch).filter(ImportBatch.cpse_id == cpse_id).order_by(ImportBatch.created_at.desc()).limit(100).all()
    items = []
    for batch in batches:
        items.append({
            "id": batch.id,
            "cpse_id": batch.cpse_id,
            "cpse_name": batch.cpse.name if batch.cpse else "Unknown",
            "sector": batch.sector,
            "filename": batch.filename,
            "upload_date": batch.upload_date,
            "upload_time": batch.upload_time,
            "created_at": batch.created_at,
            "status": batch.status,
            "total_records": batch.total_records,
            "created_count": batch.created_count,
            "updated_count": batch.updated_count,
            "duplicate_count": batch.duplicate_count,
            "invalid_count": batch.invalid_count,
            "failed_count": batch.failed_count,
        })
    return {"total": len(items), "items": items}


@router.patch("/{cpse_id}/status", response_model=CPSEOut)
def set_cpse_status(
    cpse_id: uuid.UUID,
    payload: CPSEStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN.value)),
):
    cpse = _get_or_404(db, cpse_id)
    cpse.is_active = payload.is_active
    db.commit()
    db.refresh(cpse)
    return cpse


from pydantic import BaseModel
from app.models.matching import AnalysisJob
from app.db.session import SessionLocal
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class BulkAnalyzeRequest(BaseModel):
    company_ids: list[uuid.UUID]

def run_bulk_analysis(job_id: uuid.UUID):
    from app.ai.analyzer import analyze_material
    from app.models.enums import MaterialStatus
    
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return

        job.status = "processing"
        db.commit()

        company_ids = [uuid.UUID(cid) for cid in job.company_ids]

        materials = (
            db.query(CPSEMaterial.id)
            .filter(CPSEMaterial.cpse_id.in_(company_ids))
            .filter(CPSEMaterial.status == MaterialStatus.PENDING.value)
            .all()
        )

        for i, (mat_id,) in enumerate(materials):
            try:
                analyze_material(db, mat_id, target_company_ids=company_ids)
            except Exception as e:
                logger.error(f"Error analyzing material {mat_id}: {e}")
                
            if i % 10 == 0 or i == len(materials) - 1:
                job.processed_materials = i + 1
                db.commit()

        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        logger.error(f"Analysis job {job_id} failed: {e}")
        job.status = "failed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()

@router.post("/bulk-analyze")
def bulk_analyze_cpse(
    payload: BulkAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.enums import MaterialStatus

    if not payload.company_ids:
        raise HTTPException(status_code=400, detail="No companies provided")
        
    for cid in payload.company_ids:
        if current_user.cpse_id and current_user.cpse_id != cid:
            raise HTTPException(status_code=403, detail="Not authorized to analyze this CPSE")
        _get_or_404(db, cid)
        
    total_materials = (
        db.query(func.count(CPSEMaterial.id))
        .filter(CPSEMaterial.cpse_id.in_(payload.company_ids))
        .filter(CPSEMaterial.status == MaterialStatus.PENDING.value)
        .scalar() or 0
    )
    
    job = AnalysisJob(
        company_ids=[str(cid) for cid in payload.company_ids],
        total_materials=total_materials,
        processed_materials=0,
        status="queued"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(run_bulk_analysis, job.id)
            
    return {"job_id": job.id, "status": "queued", "company_ids": payload.company_ids}

@router.post("/{cpse_id}/analyze")
def analyze_single_cpse(
    cpse_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return bulk_analyze_cpse(BulkAnalyzeRequest(company_ids=[cpse_id]), background_tasks, db, current_user)

@router.get("/analysis/{job_id}")
def get_analysis_status(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job.id,
        "status": job.status,
        "total_materials": job.total_materials,
        "processed_materials": job.processed_materials,
        "company_ids": job.company_ids,
        "completed_at": job.completed_at
    }


@router.post("/{cpse_id}/materials/clear")
def clear_cpse_materials(
    cpse_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN.value)),
):
    cpse = _get_or_404(db, cpse_id)
    
    # 1. Safely nullify non-cascading FKs
    from app.models.harmonization import CommonMaterialMapping
    from app.models.matching import AIAnalysis
    
    mat_ids_query = select(CPSEMaterial.id).where(CPSEMaterial.cpse_id == cpse_id)
    
    db.execute(
        update(CommonMaterialMapping)
        .where(CommonMaterialMapping.matched_against_material_id.in_(mat_ids_query))
        .values(matched_against_material_id=None)
    )
    
    db.execute(
        update(AIAnalysis)
        .where(AIAnalysis.best_candidate_material_id.in_(mat_ids_query))
        .values(best_candidate_material_id=None)
    )
    
    # 2. Delete materials
    result = db.execute(delete(CPSEMaterial).where(CPSEMaterial.cpse_id == cpse_id))
    deleted_count = result.rowcount
    
    # 3. Create an ImportBatch audit record
    from app.models.import_batch import ImportBatch
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    batch = ImportBatch(
        cpse_id=cpse.id,
        sector=cpse.cognate_group.sector.name if cpse.cognate_group else "Uncategorized",
        filename="Admin Clear Materials",
        uploaded_by=current_user.id,
        upload_date=now.date(),
        upload_time=now.time(),
        total_records=deleted_count,
        status="CLEARED",
        completed_at=now
    )
    db.add(batch)
    
    # 4. Create AuditLog
    from app.models.audit import AuditLog
    log = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="CLEAR_MATERIALS",
        entity_type="CPSE",
        entity_id=cpse.id,
        reason=f"Cleared {deleted_count} materials for {cpse.code}",
        details={"deleted_count": deleted_count}
    )
    db.add(log)
    
    db.commit()
    
    return {
        "success": True,
        "cpse_code": cpse.code,
        "cpse_name": cpse.name,
        "deleted_material_count": deleted_count,
        "message": f"{deleted_count} materials cleared successfully"
    }


@router.post("/materials/clear-all")
def clear_all_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN.value)),
):
    from app.models.harmonization import CommonMaterialMapping
    from app.models.matching import AIAnalysis
    
    # 1. Nullify globally
    db.execute(update(CommonMaterialMapping).values(matched_against_material_id=None))
    db.execute(update(AIAnalysis).values(best_candidate_material_id=None))
    
    # 2. Delete all
    result = db.execute(delete(CPSEMaterial))
    deleted_count = result.rowcount
    
    # 3. Create AuditLog
    from app.models.audit import AuditLog
    log = AuditLog(
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="CLEAR_ALL_MATERIALS",
        entity_type="SYSTEM",
        reason=f"Globally cleared {deleted_count} materials from all CPSEs",
        details={"deleted_count": deleted_count}
    )
    db.add(log)
    
    db.commit()
    
    return {
        "success": True,
        "deleted_material_count": deleted_count,
        "message": f"All {deleted_count} materials cleared successfully across all CPSEs"
    }
