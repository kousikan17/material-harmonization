import uuid
from typing import Optional

from pydantic import BaseModel, Field


class ManualMaterialEntry(BaseModel):
    # Map 'material_code' to 'original_material_code' in the backend, or just use the same names as UI
    # We use the standard fields so it easily maps to csv_import_service
    cpse_code: str = Field(..., description="The CPSE code")
    original_material_code: str = Field(..., description="The material code")
    original_description: str = Field(..., description="The material description")
    material_type: str = Field(..., description="Material type")
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    technical_specification: Optional[str] = None
    uom: str = Field(..., description="Unit of measure")
    manufacturer: Optional[str] = None
    standard: Optional[str] = None
    function: Optional[str] = None
    classification: Optional[str] = None
    packaging: Optional[str] = None
    criticality: Optional[str] = None
    quantity: Optional[str] = None
    annual_demand_quantity: Optional[str] = None
    current_stock_quantity: Optional[str] = None
    required_quantity: Optional[str] = None
    unit_price: Optional[str] = None
    currency: Optional[str] = None

class ManualMaterialBatch(BaseModel):
    entries: list[ManualMaterialEntry] = Field(..., min_length=1)
    cpse_id: Optional[uuid.UUID] = None
    group_id: Optional[uuid.UUID] = None
