import uuid
from datetime import datetime, date, time
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

class CPSEImportBatch(Base, UUIDMixin, TimestampMixin):
    """
    Tracks a CPSE bulk upload batch.
    """
    __tablename__ = "cpse_import_batches"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    upload_date: Mapped[date] = mapped_column(Date, nullable=False)
    upload_time: Mapped[time] = mapped_column(Time, nullable=False)

    total_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    invalid_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PROCESSING", index=True)
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
