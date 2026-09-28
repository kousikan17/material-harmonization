import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.import_batch import ImportBatch
from app.models.user import User

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.get("")
def list_imports(
    cpse_id: Optional[uuid.UUID] = None,
    sector: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ImportBatch)

    # Scoping for user
    if current_user.cpse_id:
        query = query.filter(ImportBatch.cpse_id == current_user.cpse_id)
    elif cpse_id:
        query = query.filter(ImportBatch.cpse_id == cpse_id)

    if sector:
        query = query.filter(ImportBatch.sector == sector)

    if status:
        query = query.filter(ImportBatch.status == status)

    if start_date:
        query = query.filter(ImportBatch.upload_date >= start_date)
    if end_date:
        query = query.filter(ImportBatch.upload_date <= end_date)

    total = query.count()
    batches = query.order_by(desc(ImportBatch.created_at)).offset(offset).limit(limit).all()

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
        
    return {"total": total, "items": items}

@router.get("/{batch_id}")
def get_import_batch(
    batch_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        return None
        
    if current_user.cpse_id and batch.cpse_id != current_user.cpse_id:
        return None

    return {
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
    }
