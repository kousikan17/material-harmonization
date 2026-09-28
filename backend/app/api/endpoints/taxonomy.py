import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.taxonomy import TaxonomyCategory, AttributeDefinition
from app.models.user import User
from app.models.enums import RoleName

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])

_REVIEW_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value, RoleName.VIEWER.value, RoleName.REVIEWER.value)
_ACT_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value)

class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID] = None
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID]
    description: Optional[str]
    
    class Config:
        from_attributes = True

class AttributeCreate(BaseModel):
    category_id: uuid.UUID
    name: str
    description: Optional[str] = None
    data_type: str = "string"
    is_required: bool = False

class AttributeOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    description: Optional[str]
    data_type: str
    is_required: bool
    
    class Config:
        from_attributes = True


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    return db.query(TaxonomyCategory).all()

@router.post("/categories", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_ACT_ROLES))):
    cat = TaxonomyCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/categories/{category_id}/attributes", response_model=List[AttributeOut])
def list_attributes(category_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    return db.query(AttributeDefinition).filter(AttributeDefinition.category_id == category_id).all()

@router.post("/attributes", response_model=AttributeOut)
def create_attribute(payload: AttributeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_ACT_ROLES))):
    attr = AttributeDefinition(**payload.model_dump())
    db.add(attr)
    db.commit()
    db.refresh(attr)
    return attr
