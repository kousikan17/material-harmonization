import io
import csv
import uuid
from datetime import datetime, timezone
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.cpse import CPSE
from app.models.cpse_import_batch import CPSEImportBatch

ALLOWED_CPSE_SECTORS = [
    "Agriculture",
    "Mining & Exploration",
    "Manufacturing, Processing & Generation",
    "Services"
]
from app.services.csv_import_service import _parse_rows, CsvImportError
from app.schemas.cpse import CPSEBulkRowResult, CPSEBulkValidationResponse, CPSEBulkImportResponse
from app.services.audit_service import log_action

REQUIRED_CPSE_COLUMNS = (
    "CPSE Code",
    "CPSE Name",
    "Sector",
    "Industry / Sub-sector",
    "Description",
    "Material Database Available",
    "Status"
)

def build_cpse_upload_template_csv() -> str:
    """A blank column-header template for CPSE Bulk Upload."""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=REQUIRED_CPSE_COLUMNS)
    writer.writeheader()
    return buffer.getvalue()


def validate_cpse_file(
    db: Session,
    *,
    filename: str,
    raw_bytes: bytes,
) -> CPSEBulkValidationResponse:
    """
    Parses and validates the CPSE upload file.
    Returns a validation response for the frontend preview.
    """
    if not raw_bytes.strip():
        raise CsvImportError("File is empty.")

    fieldnames, raw_rows = _parse_rows(filename, raw_bytes)
    
    # Check for missing required columns (case insensitive, space trimmed)
    fieldnames_clean = [f.strip().lower() for f in fieldnames]
    missing = []
    for req in REQUIRED_CPSE_COLUMNS:
        if req.strip().lower() not in fieldnames_clean:
            missing.append(req)
            
    if missing:
        raise CsvImportError(f"File is missing required column(s): {', '.join(missing)}")

    # Fetch existing CPSE codes to check for duplicates
    existing_cpse_codes = {c.code.upper() for c in db.query(CPSE).all()}
    
    # Track codes inside the file to catch duplicates in the same file
    seen_in_file = set()

    rows: list[CPSEBulkRowResult] = []
    
    # To map clean field names back to the original header used in dicts
    # Dicts from _parse_rows use the original header strings as keys.
    header_map = {orig.strip().lower(): orig for orig in fieldnames}

    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for index, raw_row in enumerate(raw_rows):
        line_number = index + 2
        
        # Extract values
        code_key = header_map.get("cpse code".lower())
        name_key = header_map.get("cpse name".lower())
        sector_key = header_map.get("sector".lower())
        
        code = str(raw_row.get(code_key, "")).strip()
        name = str(raw_row.get(name_key, "")).strip()
        sector = str(raw_row.get(sector_key, "")).strip()

        errors = []
        is_duplicate = False

        if not code:
            errors.append("CPSE Code is required")
        if not name:
            errors.append("CPSE Name is required")
        if not sector:
            errors.append("Sector is required")
        elif sector not in ALLOWED_CPSE_SECTORS:
            errors.append(f"Invalid sector. Allowed: {', '.join(ALLOWED_CPSE_SECTORS)}")

        if code:
            code_upper = code.upper()
            if code_upper in existing_cpse_codes:
                errors.append(f"Duplicate CPSE code: '{code}' already exists in database")
                is_duplicate = True
            elif code_upper in seen_in_file:
                errors.append(f"Duplicate CPSE code: '{code}' appears multiple times in this file")
                is_duplicate = True
            else:
                seen_in_file.add(code_upper)

        is_valid = len(errors) == 0
        
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1
            if is_duplicate:
                duplicate_count += 1

        rows.append(CPSEBulkRowResult(
            row_number=line_number,
            raw_data=raw_row,
            errors=errors,
            is_valid=is_valid,
            is_duplicate=is_duplicate,
            cpse_code=code,
            sector=sector
        ))

    return CPSEBulkValidationResponse(
        filename=filename,
        total_rows=len(rows),
        valid_count=valid_count,
        invalid_count=invalid_count,
        duplicate_count=duplicate_count,
        rows=rows
    )


def import_valid_cpses(
    db: Session,
    *,
    validation: CPSEBulkValidationResponse,
    actor_id: uuid.UUID,
    actor_name: str,
) -> CPSEBulkImportResponse:
    """
    Actually performs the database insertions.
    """
    now = datetime.now(timezone.utc)

    # 1. Create the Batch record
    batch = CPSEImportBatch(
        filename=validation.filename,
        uploaded_by=actor_id,
        upload_date=now.date(),
        upload_time=now.time(),
        status="PROCESSING",
        total_records=validation.total_rows,
        invalid_count=validation.invalid_count,
        duplicate_count=validation.duplicate_count
    )
    db.add(batch)
    db.flush()

    created_count = 0
    failed_count = 0

    header_map = None

    for row in validation.rows:
        if not row.is_valid:
            continue
            
        if header_map is None:
            fieldnames = list(row.raw_data.keys())
            header_map = {orig.strip().lower(): orig for orig in fieldnames}

        try:
            # Extract values
            code_key = header_map.get("cpse code".lower())
            name_key = header_map.get("cpse name".lower())
            sector_key = header_map.get("sector".lower())
            industry_key = header_map.get("industry / sub-sector".lower())
            desc_key = header_map.get("description".lower())
            db_avail_key = header_map.get("material database available".lower())
            status_key = header_map.get("status".lower())

            code = str(row.raw_data.get(code_key, "")).strip()
            name = str(row.raw_data.get(name_key, "")).strip()
            sector = str(row.raw_data.get(sector_key, "")).strip()
            industry = str(row.raw_data.get(industry_key, "")).strip()
            desc = str(row.raw_data.get(desc_key, "")).strip()
            db_avail_str = str(row.raw_data.get(db_avail_key, "")).strip().lower()
            status_str = str(row.raw_data.get(status_key, "")).strip().upper()

            db_avail = db_avail_str in ("yes", "true", "1", "y")
            is_active = status_str not in ("INACTIVE", "FALSE", "0", "N")

            cpse = CPSE(
                code=code,
                name=name,
                sector=sector,
                industry=industry if industry else None,
                description=desc if desc else None,
                material_database_available=db_avail,
                is_active=is_active,
                synchronization_status="PENDING",
            )
            db.add(cpse)
            created_count += 1
        except Exception as e:
            failed_count += 1

    batch.created_count = created_count
    batch.failed_count = failed_count
    batch.status = "COMPLETED"
    batch.completed_at = datetime.now(timezone.utc)

    db.commit()

    log_action(
        db,
        action="CPSE_BULK_IMPORTED",
        entity_type="CPSEImportBatch",
        entity_id=batch.id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_type="USER",
        details={
            "filename": validation.filename,
            "total_rows": validation.total_rows,
            "created": created_count,
            "failed": failed_count,
        }
    )

    return CPSEBulkImportResponse(
        batch_id=batch.id,
        filename=batch.filename,
        total_rows=batch.total_rows,
        created=created_count,
        failed=failed_count
    )
