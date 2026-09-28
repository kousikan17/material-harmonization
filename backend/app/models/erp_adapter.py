from sqlalchemy import String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDMixin

class ERPAdapterConfig(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "erp_adapter_configs"

    adapter_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # e.g. CSV, REST, SAP_ODATA
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config_json: Mapped[dict] = mapped_column(JSONB, nullable=True) # connection string, API keys, etc. (securely masked when returning)
