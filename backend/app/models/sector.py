from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

class Sector(Base, UUIDMixin, TimestampMixin):
    """A Sector containing multiple CPSE companies."""

    __tablename__ = "sectors"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(20), nullable=True, default="🏢")
    
    cpses: Mapped[list["CPSE"]] = relationship(back_populates="sector_rel")
