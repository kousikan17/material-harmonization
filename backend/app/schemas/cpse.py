import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CPSECreate(BaseModel):
    code: str
    name: str
    cognate_group_id: uuid.UUID
    administrative_ministry_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    material_database_available: bool = True


class CPSEUpdate(BaseModel):
    name: Optional[str] = None
    cognate_group_id: Optional[uuid.UUID] = None
    administrative_ministry_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    material_database_available: Optional[bool] = None


class CPSEStatusUpdate(BaseModel):
    is_active: bool


class CPSEOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    cognate_group_id: Optional[uuid.UUID] = None
    administrative_ministry_id: Optional[uuid.UUID] = None
    administrative_ministry: Optional[str] = None
    sector_name: Optional[str] = None
    cognate_group_name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    material_database_available: bool
    last_sync_at: Optional[datetime] = None
    synchronization_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CPSEStats(CPSEOut):
    total_materials: int = 0
    active_materials: int = 0
    inactive_materials: int = 0
    new_materials: int = 0
    common_materials: int = 0
    unique_materials: int = 0
    duplicates: int = 0
    near_duplicates: int = 0
    functional_equivalents: int = 0
    pending_mappings: int = 0
    legacy_codes: int = 0


class CPSEBulkRowResult(BaseModel):
    row_number: int
    raw_data: dict
    errors: list[str]
    is_valid: bool
    is_duplicate: bool
    cpse_code: str
    cognate_group_name: str


class CPSEBulkValidationResponse(BaseModel):
    filename: str
    total_rows: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    rows: list[CPSEBulkRowResult]


class CPSEBulkImportResponse(BaseModel):
    batch_id: uuid.UUID
    filename: str
    total_rows: int
    created: int
    failed: int
