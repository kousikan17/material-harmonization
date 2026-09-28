import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.evaluation import EvaluationDataset, EvaluationLabel, EvaluationRun
from app.models.user import User
from app.models.enums import RoleName
from app.services import evaluation_service

router = APIRouter(prefix="/ai-evaluation", tags=["AI Evaluation"])

_REVIEW_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value, RoleName.VIEWER.value, RoleName.REVIEWER.value)
_ACT_ROLES = (RoleName.ADMIN.value, RoleName.MATERIAL_EXPERT.value)


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    
    class Config:
        from_attributes = True

class LabelCreate(BaseModel):
    material_a_id: uuid.UUID
    material_b_id: uuid.UUID
    expert_label: str

class LabelOut(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    material_a_id: uuid.UUID
    material_b_id: uuid.UUID
    expert_label: str
    
    class Config:
        from_attributes = True

class RunOut(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    precision: float
    recall: float
    false_merge_rate: float
    notes: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/datasets", response_model=List[DatasetOut])
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    return db.query(EvaluationDataset).all()

@router.post("/datasets", response_model=DatasetOut)
def create_dataset(payload: DatasetCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_ACT_ROLES))):
    return evaluation_service.create_dataset(db, payload.name, payload.description)

@router.get("/datasets/{dataset_id}/labels", response_model=List[LabelOut])
def list_labels(dataset_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    return db.query(EvaluationLabel).filter(EvaluationLabel.dataset_id == dataset_id).all()

@router.post("/datasets/{dataset_id}/labels", response_model=LabelOut)
def add_label(dataset_id: uuid.UUID, payload: LabelCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_ACT_ROLES))):
    return evaluation_service.add_label(db, dataset_id, payload.material_a_id, payload.material_b_id, payload.expert_label)

@router.post("/datasets/{dataset_id}/run", response_model=RunOut)
def run_evaluation(dataset_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_ACT_ROLES))):
    return evaluation_service.run_evaluation(db, dataset_id)

@router.get("/datasets/{dataset_id}/runs", response_model=List[RunOut])
def list_runs(dataset_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_REVIEW_ROLES))):
    return db.query(EvaluationRun).filter(EvaluationRun.dataset_id == dataset_id).order_by(EvaluationRun.created_at.desc()).all()
