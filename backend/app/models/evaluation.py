import uuid
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDMixin

class EvaluationDataset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evaluation_datasets"
    
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)

class EvaluationLabel(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evaluation_labels"
    
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluation_datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    material_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cpse_materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    material_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cpse_materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expert_label: Mapped[str] = mapped_column(String(50), nullable=False)

class EvaluationRun(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "evaluation_runs"
    
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluation_datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    precision: Mapped[float] = mapped_column(Float, nullable=False)
    recall: Mapped[float] = mapped_column(Float, nullable=False)
    false_merge_rate: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
