"""add demand fields to cpse_materials

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-18 09:24:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("cpse_materials", sa.Column("annual_demand_quantity", sa.Float(), nullable=True))
    op.add_column("cpse_materials", sa.Column("current_stock_quantity", sa.Float(), nullable=True))
    op.add_column("cpse_materials", sa.Column("required_quantity", sa.Float(), nullable=True))
    op.add_column("cpse_materials", sa.Column("unit_price", sa.Float(), nullable=True))
    op.add_column("cpse_materials", sa.Column("currency", sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column("cpse_materials", "currency")
    op.drop_column("cpse_materials", "unit_price")
    op.drop_column("cpse_materials", "required_quantity")
    op.drop_column("cpse_materials", "current_stock_quantity")
    op.drop_column("cpse_materials", "annual_demand_quantity")
