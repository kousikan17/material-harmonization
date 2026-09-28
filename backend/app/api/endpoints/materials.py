import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import assert_cpse_access, get_current_user, scoped_cpse_id
from app.db.session import get_db
from app.models.enums import MappingDecisionStatus
from app.models.material import CPSEMaterial, MaterialAttribute, MaterialEmbedding
from app.models.user import User
from app.schemas.material import CPSEMaterialDetailOut, CPSEMaterialOut, MaterialListResponse, MaterialPrecheckRequest, MaterialPrecheckResponse, PrecheckCandidate
from app.services import normalization, readiness_service
from app.ai.analyzer import evaluate_candidates

router = APIRouter(prefix="/cpse-materials", tags=["CPSE Materials"])


def _material_to_detail(db: Session, material: CPSEMaterial) -> CPSEMaterialDetailOut:
    attrs = db.query(MaterialAttribute).filter(MaterialAttribute.material_id == material.id).all()
    has_embedding = (
        db.query(MaterialEmbedding).filter(MaterialEmbedding.material_id == material.id).first() is not None
    )
    active = next((m for m in material.mappings if m.decision_status != MappingDecisionStatus.REJECTED.value), None)

    out = CPSEMaterialDetailOut.model_validate(material)
    out.attributes = attrs
    out.has_embedding = has_embedding
    out.active_common_material = active.common_material if active else None
    return out


@router.get("/search", response_model=list[CPSEMaterialOut])
def search_materials(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Intelligent search (spec section 16): blends lexical matches (ILIKE
    across code/description/specification/classification/uom) with semantic
    pgvector similarity against the query text's own embedding.
    """
    from app.ai.text_embeddings import generate_text_embedding

    scope = scoped_cpse_id(current_user, None)

    like = f"%{q.strip()}%"
    lexical_query = db.query(CPSEMaterial).filter(
        or_(
            CPSEMaterial.original_material_code.ilike(like),
            CPSEMaterial.original_description.ilike(like),
            CPSEMaterial.technical_specification.ilike(like),
            CPSEMaterial.classification.ilike(like),
            CPSEMaterial.uom.ilike(like),
        )
    )
    if scope is not None:
        lexical_query = lexical_query.filter(CPSEMaterial.cpse_id == scope)
    lexical_matches = lexical_query.limit(50).all()

    query_vector, _ = generate_text_embedding(normalization.normalize_description(q))
    semantic_query = (
        db.query(CPSEMaterial)
        .join(MaterialEmbedding, MaterialEmbedding.material_id == CPSEMaterial.id)
        .filter(MaterialEmbedding.text_embedding.isnot(None))
    )
    if scope is not None:
        semantic_query = semantic_query.filter(CPSEMaterial.cpse_id == scope)
    semantic_matches = semantic_query.order_by(MaterialEmbedding.text_embedding.cosine_distance(query_vector)).limit(20).all()

    combined: dict[uuid.UUID, CPSEMaterial] = {m.id: m for m in [*lexical_matches, *semantic_matches]}
    return list(combined.values())[:30]


@router.get("", response_model=MaterialListResponse)
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cpse_id: uuid.UUID | None = None,
    classification: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    mapped_only: bool | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    query = db.query(CPSEMaterial)

    scope = scoped_cpse_id(current_user, cpse_id)
    if scope:
        query = query.filter(CPSEMaterial.cpse_id == scope)
    if classification:
        query = query.filter(CPSEMaterial.classification.ilike(f"%{classification}%"))
    if status_filter:
        query = query.filter(CPSEMaterial.status == status_filter)
    if mapped_only is not None:
        query = query.filter(CPSEMaterial.mappings.any() if mapped_only else ~CPSEMaterial.mappings.any())
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(CPSEMaterial.original_material_code.ilike(like), CPSEMaterial.original_description.ilike(like))
        )

    total = query.count()
    items = (
        query.order_by(CPSEMaterial.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return MaterialListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{material_id}", response_model=CPSEMaterialDetailOut)
def get_material(material_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(CPSEMaterial).filter(CPSEMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="CPSE material not found")
    assert_cpse_access(current_user, material.cpse_id)
    return _material_to_detail(db, material)


@router.get("/{material_id}/similar", response_model=list[CPSEMaterialOut])
def similar_materials(
    material_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.ai.similarity import find_candidate_materials

    if current_user.cpse_id is not None:
        # Cross-company similarity is exactly what a company-scoped user
        # must not see - it would leak another CPSE's material data through
        # the "candidates" list. Cross-company comparison is the central
        # approval workflow's job (see app.api.endpoints.harmonization).
        raise HTTPException(status_code=403, detail="Cross-company similarity search is only available to central/admin users.")

    material = db.query(CPSEMaterial).filter(CPSEMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="CPSE material not found")
    if not material.embedding:
        return []
    return find_candidate_materials(db, material, limit=limit)

@router.post("/precheck", response_model=MaterialPrecheckResponse)
def precheck_material(
    payload: MaterialPrecheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.ai.text_embeddings import generate_text_embedding
    
    # Score readiness
    material_dict = {
        "original_description": payload.description,
        "uom": payload.uom,
        "classification": payload.classification,
        "technical_specification": payload.specification,
        "manufacturer": payload.manufacturer,
        "manufacturer_part_number": payload.manufacturer_part_number,
        "attributes_json": payload.attributes_json
    }
    readiness_scores = readiness_service.score_material_readiness(material_dict)
    
    # We need a transient CPSEMaterial to pass into similarity/analyzer
    transient_material = CPSEMaterial(
        id=uuid.uuid4(),
        cpse_id=current_user.cpse_id,
        original_description=payload.description,
        normalized_description=normalization.normalize_description(payload.description),
        technical_specification=payload.specification,
        uom=payload.uom,
        classification=payload.classification,
        normalized_classification=normalization.normalize_classification(payload.classification) if payload.classification else None,
        manufacturer=payload.manufacturer,
        manufacturer_part_number=payload.manufacturer_part_number,
        criticality="UNSPECIFIED",
    )
    
    query_vector, _ = generate_text_embedding(transient_material.normalized_description)
    transient_material.embedding = MaterialEmbedding(text_embedding=query_vector)
    
    from app.ai.similarity import find_candidate_materials
    candidates = find_candidate_materials(db, transient_material, limit=5, target_company_ids=[current_user.cpse_id] if current_user.cpse_id else None)
    
    result_candidates = []
    if candidates:
        analysis_result = evaluate_candidates(db, transient_material, candidates)
        best_candidate = analysis_result.best_candidate
        
        for cand in candidates:
            # We don't have the exact score for all candidates from evaluate_candidates, just the best one,
            # but for precheck we can just return the best candidate
            pass
            
        if best_candidate:
            common_code = None
            if best_candidate.mappings:
                for mapping in best_candidate.mappings:
                    if mapping.decision_status in ("APPROVED", "EDITED_AND_APPROVED"):
                        common_code = mapping.common_material.common_code
                        break
                        
            result_candidates.append(PrecheckCandidate(
                material_id=best_candidate.id,
                common_code=common_code,
                description=best_candidate.original_description,
                score=analysis_result.final_score,
                decision=analysis_result.decision
            ))
            
    missing_critical = []
    if not payload.uom:
        missing_critical.append("uom")
    if not payload.classification:
        missing_critical.append("classification")
        
    return MaterialPrecheckResponse(
        readiness_score=readiness_scores.get("readiness_score", 0.0),
        missing_critical_fields=missing_critical,
        candidates=result_candidates
    )

