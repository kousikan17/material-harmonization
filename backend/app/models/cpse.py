from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.base_class import Base, TimestampMixin, UUIDMixin
from app.models.enums import SynchronizationStatus


class AdministrativeMinistry(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "administrative_ministries"
    
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    cpses: Mapped[list["CPSE"]] = relationship(back_populates="administrative_ministry_ref")


class Sector(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sectors"
    
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    cognate_groups: Mapped[list["CognateGroup"]] = relationship(back_populates="sector")


class CognateGroup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cognate_groups"
    
    sector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sectors.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    sector: Mapped["Sector"] = relationship(back_populates="cognate_groups")
    cpses: Mapped[list["CPSE"]] = relationship(back_populates="cognate_group")


class CPSE(Base, UUIDMixin, TimestampMixin):
    """A Central Public Sector Enterprise participating in the national
    material master. The CPSE always remains the owner of its own original
    material master - this row never holds material data itself, only
    identity/sector/sync-health (spec section 5.1)."""

    __tablename__ = "cpses"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    cognate_group_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("cognate_groups.id"), nullable=True, index=True)
    administrative_ministry_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("administrative_ministries.id"), nullable=True, index=True)
    
    cognate_group: Mapped[Optional["CognateGroup"]] = relationship(back_populates="cpses")
    administrative_ministry_ref: Mapped[Optional["AdministrativeMinistry"]] = relationship(back_populates="cpses")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    material_database_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    synchronization_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=SynchronizationStatus.NEVER_SYNCED.value
    )

    users: Mapped[list["User"]] = relationship(back_populates="cpse")
    materials: Mapped[list["CPSEMaterial"]] = relationship(back_populates="cpse")
    source_connections: Mapped[list["SourceConnection"]] = relationship(back_populates="cpse")
