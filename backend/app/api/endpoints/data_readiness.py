from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.material import CPSEMaterial
from app.models.user import User
from app.models.enums import RoleName

router = APIRouter(prefix="/data-readiness", tags=["Data Readiness"])

_REVIEW_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value, RoleName.VIEWER.value, RoleName.REVIEWER.value)


@router.get("/dashboard", response_model=Dict[str, Any])
def get_readiness_dashboard(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    total_materials = db.query(CPSEMaterial).count()
    if total_materials == 0:
        return {
            "total_materials": 0,
            "average_readiness_score": 0,
            "materials_by_readiness_tier": {
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "missing_fields": {}
        }
    
    avg_score = db.query(func.avg(CPSEMaterial.readiness_score)).scalar() or 0
    
    high = db.query(CPSEMaterial).filter(CPSEMaterial.readiness_score >= 80).count()
    medium = db.query(CPSEMaterial).filter(CPSEMaterial.readiness_score >= 50, CPSEMaterial.readiness_score < 80).count()
    low = db.query(CPSEMaterial).filter(CPSEMaterial.readiness_score < 50).count()
    
    missing_uom = db.query(CPSEMaterial).filter(CPSEMaterial.uom.is_(None)).count()
    missing_class = db.query(CPSEMaterial).filter(CPSEMaterial.classification.is_(None)).count()
    missing_spec = db.query(CPSEMaterial).filter(CPSEMaterial.technical_specification.is_(None)).count()
    missing_mpn = db.query(CPSEMaterial).filter(CPSEMaterial.manufacturer_part_number.is_(None)).count()
    
    return {
        "total_materials": total_materials,
        "average_readiness_score": round(avg_score, 2),
        "materials_by_readiness_tier": {
            "high": high,
            "medium": medium,
            "low": low
        },
        "missing_fields": {
            "uom": missing_uom,
            "classification": missing_class,
            "technical_specification": missing_spec,
            "manufacturer_part_number": missing_mpn
        }
    }
