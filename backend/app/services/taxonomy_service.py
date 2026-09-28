import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.taxonomy import TaxonomyCategory, AttributeDefinition

def create_category(db: Session, name: str, description: Optional[str] = None, parent_id: Optional[uuid.UUID] = None) -> TaxonomyCategory:
    category = TaxonomyCategory(name=name, description=description, parent_id=parent_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def get_category(db: Session, category_id: uuid.UUID) -> Optional[TaxonomyCategory]:
    return db.query(TaxonomyCategory).filter(TaxonomyCategory.id == category_id).first()

def get_category_by_name(db: Session, name: str) -> Optional[TaxonomyCategory]:
    return db.query(TaxonomyCategory).filter(TaxonomyCategory.name == name).first()

def get_all_categories(db: Session) -> List[TaxonomyCategory]:
    return db.query(TaxonomyCategory).all()

def add_attribute_to_category(
    db: Session, 
    category_id: uuid.UUID, 
    name: str, 
    is_mandatory: bool = False, 
    data_type: str = "text", 
    allowed_values: Optional[List[str]] = None
) -> AttributeDefinition:
    attr = AttributeDefinition(
        category_id=category_id,
        name=name,
        is_mandatory=is_mandatory,
        data_type=data_type,
        allowed_values=allowed_values or []
    )
    db.add(attr)
    db.commit()
    db.refresh(attr)
    return attr

def get_attributes_for_category(db: Session, category_id: uuid.UUID) -> List[AttributeDefinition]:
    return db.query(AttributeDefinition).filter(AttributeDefinition.category_id == category_id).all()
