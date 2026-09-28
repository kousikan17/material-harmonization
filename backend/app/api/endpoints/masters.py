import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.cpse import Sector, CognateGroup, AdministrativeMinistry

router = APIRouter(prefix="/masters", tags=["Masters"])


class AdministrativeMinistryOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_active: bool

    class Config:
        from_attributes = True


class CognateGroupOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_active: bool

    class Config:
        from_attributes = True


class SectorOut(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_active: bool
    cognate_groups: list[CognateGroupOut] = []

    class Config:
        from_attributes = True


@router.get("/hierarchy", response_model=list[SectorOut])
def get_hierarchy(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get the complete DPE hierarchy of Sectors and their corresponding Cognate Groups.
    """
    from sqlalchemy.orm import selectinload
    sectors = db.query(Sector).options(selectinload(Sector.cognate_groups)).filter(Sector.is_active == True).order_by(Sector.name).all()
    
    # Ensure cognate groups are sorted
    for sector in sectors:
        sector.cognate_groups.sort(key=lambda cg: cg.name)
        
    return sectors


@router.get("/administrative-ministries", response_model=list[AdministrativeMinistryOut])
def get_administrative_ministries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get the list of active Administrative Ministries.
    """
    return db.query(AdministrativeMinistry).filter(AdministrativeMinistry.is_active == True).order_by(AdministrativeMinistry.name).all()
