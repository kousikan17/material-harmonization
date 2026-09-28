"""
Company self-service material master upload (real production data).

This is the OTHER half of app.services.csv_import_service - unlike
app.api.endpoints.demo_import (DEMO ONLY, admin-restricted, any onboarded
CPSE), this endpoint lets an authorized user belonging to a specific CPSE
upload their OWN company's real material master as CSV or Excel (.xlsx),
strictly scoped to their own CPSE. Every row is marked is_demo_data=False
and passes through the exact same canonical ingestion + AI pipeline every
other path (including the secure read-only database connectors) uses -
there is no separate upload-specific matching/scoring logic here.

A user with no cpse_id (a central/ADMIN account) may instead upload on
behalf of a specific CPSE by naming it explicitly - the same dual-audience
pattern app.api.endpoints.demo_import already uses for CPSE selection.
"""
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.cpse import CPSE
from app.models.import_batch import ImportBatch
from app.models.enums import RoleName
from app.models.user import User
from app.schemas.csv_import import (
    CsvImportHistoryItem,
    CsvImportHistoryResponse,
    CsvImportResponse,
    CsvImportRowResult,
    CsvRowIssue,
    CsvValidationResponse,
)
from app.schemas.manual_entry import ManualMaterialBatch
from app.services import csv_import_service as svc

router = APIRouter(prefix="/materials/upload", tags=["Material Upload"])

# VIEWER is deliberately excluded - a read-only account should not be able
# to introduce new material rows for its company.
_ALLOWED_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value, RoleName.REVIEWER.value)

MAX_FILE_SIZE_BYTES = svc.MAX_FILE_SIZE_BYTES
_ALLOWED_EXTENSIONS = (".csv", ".xlsx")


def _resolve_upload_cpse(current_user: User, requested_cpse_id: Optional[uuid.UUID], db: Session) -> Optional[CPSE]:
    """
    A company-scoped user (cpse_id set at registration) can only ever
    upload for their own CPSE - any requested_cpse_id is ignored if it
    matches, rejected outright if it doesn't. A central/ADMIN user with no
    CPSE affiliation must explicitly name which CPSE they are uploading on
    behalf of, unless it is a bulk upload (in which case requested_cpse_id is None).
    """
    if current_user.cpse_id is not None:
        if requested_cpse_id is not None and requested_cpse_id != current_user.cpse_id:
            raise HTTPException(status_code=403, detail="You can only upload materials for your own company.")
        cpse = db.query(CPSE).filter(CPSE.id == current_user.cpse_id).first()
        if cpse is None:
            raise HTTPException(status_code=404, detail="CPSE not found.")
        return cpse
    else:
        if requested_cpse_id is None:
            return None
        cpse = db.query(CPSE).filter(CPSE.id == requested_cpse_id).first()
        if cpse is None:
            raise HTTPException(status_code=404, detail="CPSE not found.")
        return cpse


def _read_upload_sync(file: UploadFile, allowed_ext: tuple[str, ...], max_size: int) -> tuple[str, bytes]:
    if not file.filename or not file.filename.lower().endswith(allowed_ext):
        raise HTTPException(status_code=422, detail=f"Only {', '.join(allowed_ext)} files are accepted.")
    filename = os.path.basename(file.filename)
    file.file.seek(0)
    raw_bytes = file.file.read()
    if len(raw_bytes) > max_size:
        raise HTTPException(status_code=413, detail=f"File exceeds the {max_size // (1024 * 1024)} MB limit.")
    return filename, raw_bytes


def _issue(row: "svc.RowResult") -> CsvRowIssue:
    return CsvRowIssue(
        row_number=row.row_number,
        errors=row.errors,
        cpse_code=row.raw.get("cpse_code"),
        original_material_code=row.raw.get("original_material_code"),
    )


@router.post("/validate", response_model=CsvValidationResponse)
def validate_upload(
    file: UploadFile,
    cpse_id: Optional[uuid.UUID] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ALLOWED_ROLES)),
):
    """Preview-only: parses and fully validates the file without writing
    anything to the database."""
    cpse = _resolve_upload_cpse(current_user, cpse_id, db)
    allowed_ids = {cpse.id} if cpse else None
    filename, raw_bytes = _read_upload_sync(file, _ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES)
    try:
        result = svc.validate_material_file(
            db, filename=filename, raw_bytes=raw_bytes, is_demo_data=False, allowed_cpse_ids=allowed_ids
        )
    except svc.CsvImportError as exc:
        return CsvValidationResponse(
            filename=filename, total_rows=0, valid_count=0, invalid_count=0,
            is_importable=False, file_errors=[str(exc)], invalid_rows=[], preview=[],
        )

    return CsvValidationResponse(
        filename=result.filename,
        total_rows=result.total_rows,
        valid_count=len(result.valid_rows),
        invalid_count=len(result.invalid_rows),
        is_importable=result.is_importable,
        file_errors=result.file_errors,
        invalid_rows=[_issue(r) for r in result.invalid_rows],
        preview=[r.raw for r in result.valid_rows[: svc.PREVIEW_ROWS]],
        normalizations=result.normalizations,
        distribution=result.distribution,
    )


@router.post("/confirm", response_model=CsvImportResponse)
def confirm_upload(
    file: UploadFile,
    cpse_id: Optional[uuid.UUID] = Form(None),
    group_id: Optional[uuid.UUID] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ALLOWED_ROLES)),
):
    """
    Re-validates the uploaded file (never trusts a client-held validation
    token - the file is the source of truth) and, only for rows that pass
    every check, imports through the canonical ingestion pipeline as REAL
    (is_demo_data=False) material data for the resolved CPSE. Invalid rows
    are NEVER inserted, even partially.
    """
    cpse = _resolve_upload_cpse(current_user, cpse_id, db)
    allowed_ids = {cpse.id} if cpse else None
    filename, raw_bytes = _read_upload_sync(file, _ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES)
    try:
        validation = svc.validate_material_file(
            db, filename=filename, raw_bytes=raw_bytes, is_demo_data=False, allowed_cpse_ids=allowed_ids
        )
    except svc.CsvImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if not validation.is_importable:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No valid rows to import.",
                "file_errors": validation.file_errors,
                "invalid_rows": [_issue(r).model_dump() for r in validation.invalid_rows],
            },
        )

    try:
        summary = svc.import_valid_rows(
            db, validation, actor_id=current_user.id, actor_name=current_user.full_name,
            is_demo_data=False, source_label="COMPANY_MATERIAL_UPLOAD",
            batch_entity_type="material_upload_batch", batch_action="COMPANY_MATERIAL_UPLOAD_COMPLETED",
            row_created_action="MATERIAL_UPLOADED_CREATED", row_updated_action="MATERIAL_UPLOADED_UPDATED",
            batch_details_extra={
                "cpse_id": str(cpse.id) if cpse else None,
                "cpse_code": cpse.code if cpse else None,
                "group_id": str(group_id) if group_id else None
            },
        )
    except svc.CsvImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return CsvImportResponse(
        batch_id=summary.batch_id,
        filename=summary.filename,
        total_rows=summary.total_rows,
        valid_count=summary.valid_count,
        invalid_count=summary.invalid_count,
        created=summary.created,
        updated=summary.updated,
        skipped=summary.skipped,
        failed=summary.failed,
        invalid_rows=[_issue(r) for r in validation.invalid_rows],
        results=[
            CsvImportRowResult(
                row_number=r.row_number,
                cpse_code=r.cpse_code,
                original_material_code=r.original_material_code,
                outcome=r.outcome,
                common_material_code=r.common_material_code,
                mapping_type=r.mapping_type,
                decision_status=r.decision_status,
            )
            for r in summary.results
        ],
    )


@router.post("/manual/validate", response_model=CsvValidationResponse)
def validate_manual_upload(
    batch: ManualMaterialBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ALLOWED_ROLES)),
):
    """Preview-only: validates a manually entered batch without writing anything."""
    cpse = _resolve_upload_cpse(current_user, batch.cpse_id, db)
    
    # Convert ManualMaterialEntry list to dicts
    raw_rows = [entry.model_dump(exclude_none=True) for entry in batch.entries]
    
    result = svc.validate_material_rows(
        db, filename="manual_entry", raw_rows=raw_rows, is_demo_data=False, allowed_cpse_ids={cpse.id}
    )

    return CsvValidationResponse(
        filename=result.filename,
        total_rows=result.total_rows,
        valid_count=len(result.valid_rows),
        invalid_count=len(result.invalid_rows),
        is_importable=result.is_importable,
        file_errors=result.file_errors,
        invalid_rows=[_issue(r) for r in result.invalid_rows],
        preview=[r.raw for r in result.valid_rows[: svc.PREVIEW_ROWS]],
        normalizations=result.normalizations,
    )


@router.post("/manual/confirm", response_model=CsvImportResponse)
def confirm_manual_upload(
    batch: ManualMaterialBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ALLOWED_ROLES)),
):
    """Imports a manually entered batch as real data."""
    cpse = _resolve_upload_cpse(current_user, batch.cpse_id, db)
    
    raw_rows = [entry.model_dump(exclude_none=True) for entry in batch.entries]
    
    validation = svc.validate_material_rows(
        db, filename="manual_entry", raw_rows=raw_rows, is_demo_data=False, allowed_cpse_ids={cpse.id}
    )

    if not validation.is_importable:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No valid rows to import.",
                "file_errors": validation.file_errors,
                "invalid_rows": [_issue(r).model_dump() for r in validation.invalid_rows],
            },
        )

    summary = svc.import_valid_rows(
        db, validation, actor_id=current_user.id, actor_name=current_user.full_name,
        is_demo_data=False, source_label="COMPANY_MANUAL_ENTRY",
        batch_entity_type="material_upload_batch", batch_action="COMPANY_MATERIAL_UPLOAD_COMPLETED",
        row_created_action="MATERIAL_UPLOADED_CREATED", row_updated_action="MATERIAL_UPLOADED_UPDATED",
        batch_details_extra={
            "cpse_id": str(cpse.id),
            "cpse_code": cpse.code,
            "group_id": str(batch.group_id) if batch.group_id else None
        },
    )

    return CsvImportResponse(
        batch_id=summary.batch_id,
        filename=summary.filename,
        total_rows=summary.total_rows,
        valid_count=summary.valid_count,
        invalid_count=summary.invalid_count,
        created=summary.created,
        updated=summary.updated,
        skipped=summary.skipped,
        failed=summary.failed,
        invalid_rows=[_issue(r) for r in validation.invalid_rows],
        results=[
            CsvImportRowResult(
                row_number=r.row_number,
                cpse_code=r.cpse_code,
                original_material_code=r.original_material_code,
                outcome=r.outcome,
                common_material_code=r.common_material_code,
                mapping_type=r.mapping_type,
                decision_status=r.decision_status,
            )
            for r in summary.results
        ],
    )


@router.get("/history", response_model=CsvImportHistoryResponse)
def upload_history(
    cpse_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A company-scoped user only ever sees their own company's upload
    history; a central/ADMIN user (no cpse_id) sees every company's, or can filter by cpse_id."""
    query = db.query(ImportBatch)
    entries = query.order_by(ImportBatch.created_at.desc()).limit(100).all()

    if current_user.cpse_id is not None:
        entries = [e for e in entries if e.cpse_id == current_user.cpse_id]
    elif cpse_id is not None:
        entries = [e for e in entries if e.cpse_id == cpse_id]

    items = []
    for batch in entries:
        items.append(CsvImportHistoryItem(
            batch_id=batch.id,
            filename=batch.filename,
            filenames=[batch.filename],
            cpse_codes=[batch.cpse.code] if batch.cpse else [],
            file_count=1,
            imported_at=batch.created_at,
            actor_name=batch.user.full_name if batch.user else "Unknown",
            total_rows=batch.total_records,
            valid_count=batch.total_records - batch.invalid_count,
            invalid_count=batch.invalid_count,
            created=batch.created_count,
            updated=batch.updated_count,
            skipped=batch.duplicate_count,
            failed=batch.failed_count
        ))

    return CsvImportHistoryResponse(items=items, total=len(items))


@router.get("/template", response_class=PlainTextResponse)
def upload_template(mode: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """A blank column-header template (+ one example row) for a company's
    own material master export - see app.services.csv_import_service.build_upload_template_csv."""
    single_company = mode == "single"
    return PlainTextResponse(
        content=svc.build_upload_template_csv(single_company=single_company),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=material_upload_template.csv"},
    )
