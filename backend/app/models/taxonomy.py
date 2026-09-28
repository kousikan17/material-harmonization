import uuid
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDMixin

class TaxonomyCategory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "taxonomy_categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("taxonomy_categories.id"), nullable=True, index=True
    )
    
    attributes: Mapped[list["AttributeDefinition"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )

class AttributeDefinition(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attribute_definitions"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("taxonomy_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_type: Mapped[str] = mapped_column(String(50), nullable=False, default="string")
    allowed_values: Mapped[list[str]] = mapped_column(JSONB, nullable=True)

    category: Mapped["TaxonomyCategory"] = relationship(back_populates="attributes")
