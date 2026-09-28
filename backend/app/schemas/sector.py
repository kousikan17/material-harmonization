import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SectorCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "🏢"

class SectorOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SectorStats(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    company_count: int
