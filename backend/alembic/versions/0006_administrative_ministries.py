"""Add administrative ministries

Revision ID: 123456789abc
Revises: 87b8190888f8
Create Date: 2026-09-19 17:30:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = '123456789abc'
down_revision: Union[str, None] = '87b8190888f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Ministries to seed
ministries_seed = [
    ("Ministry of Petroleum & Natural Gas", "MOPNG"),
    ("Ministry of Power", "MOP"),
    ("Ministry of Steel", "MOS"),
    ("Ministry of Coal", "MOC"),
    ("Ministry of Mines", "MOM"),
    ("Ministry of Defence", "MOD"),
    ("Ministry of Heavy Industries", "MHI"),
    ("Ministry of Fertilizers", "MOF"),
    ("Ministry of Textiles", "MOT"),
    ("Ministry of Railways", "MOR"),
    ("Ministry of Finance", "MOFIN"),
    ("Ministry of Communications", "MOCM"),
    ("Ministry of Agriculture & Farmers Welfare", "MOA"),
]

def upgrade() -> None:
    # 1. Create administrative_ministries table
    op.create_table('administrative_ministries',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_administrative_ministries_code'), 'administrative_ministries', ['code'], unique=True)
    op.create_index(op.f('ix_administrative_ministries_name'), 'administrative_ministries', ['name'], unique=True)

    # 2. Add administrative_ministry_id to cpses
    op.add_column('cpses', sa.Column('administrative_ministry_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_cpses_administrative_ministry_id'), 'cpses', ['administrative_ministry_id'], unique=False)
    op.create_foreign_key('fk_cpses_administrative_ministry', 'cpses', 'administrative_ministries', ['administrative_ministry_id'], ['id'])

    # 3. Seed administrative_ministries and migrate existing data
    conn = op.get_bind()
    
    ministry_map = {}
    for name, code in ministries_seed:
        m_id = uuid.uuid4()
        conn.execute(
            sa.text("INSERT INTO administrative_ministries (id, name, code, is_active, created_at, updated_at) VALUES (:id, :name, :code, true, now(), now())"),
            {"id": m_id, "name": name, "code": code}
        )
        ministry_map[name.lower().strip()] = m_id

    # Fetch existing cpses and map
    result = conn.execute(sa.text("SELECT id, administrative_ministry FROM cpses WHERE administrative_ministry IS NOT NULL"))
    for row in result:
        cpse_id, old_ministry = row
        old_ministry_clean = old_ministry.lower().strip()
        
        m_id = ministry_map.get(old_ministry_clean)
        if not m_id:
            # Create a new ministry record dynamically if it wasn't in our seed list
            m_id = uuid.uuid4()
            code = "".join([w[0].upper() for w in old_ministry.replace("&", "").split() if w.isalpha()])
            if len(code) < 2:
                code = old_ministry[:4].upper()
            
            # Ensure unique code
            code_unique = f"{code}_{str(uuid.uuid4())[:4]}"
            conn.execute(
                sa.text("INSERT INTO administrative_ministries (id, name, code, is_active, created_at, updated_at) VALUES (:id, :name, :code, true, now(), now())"),
                {"id": m_id, "name": old_ministry.strip(), "code": code_unique}
            )
            ministry_map[old_ministry_clean] = m_id
            print(f"Created unmapped ministry: {old_ministry.strip()}")

        conn.execute(
            sa.text("UPDATE cpses SET administrative_ministry_id = :m_id WHERE id = :cpse_id"),
            {"m_id": m_id, "cpse_id": cpse_id}
        )

    # 4. Drop the old column
    op.drop_column('cpses', 'administrative_ministry')


def downgrade() -> None:
    # 1. Add back the old column
    op.add_column('cpses', sa.Column('administrative_ministry', sa.String(length=255), nullable=True))
    
    # 2. Re-populate the old column
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT c.id, m.name FROM cpses c JOIN administrative_ministries m ON c.administrative_ministry_id = m.id"))
    for row in result:
        conn.execute(
            sa.text("UPDATE cpses SET administrative_ministry = :name WHERE id = :id"),
            {"name": row[1], "id": row[0]}
        )

    # 3. Drop foreign key and column
    op.drop_constraint('fk_cpses_administrative_ministry', 'cpses', type_='foreignkey')
    op.drop_index(op.f('ix_cpses_administrative_ministry_id'), table_name='cpses')
    op.drop_column('cpses', 'administrative_ministry_id')
    
    # 4. Drop the administrative_ministries table
    op.drop_index(op.f('ix_administrative_ministries_name'), table_name='administrative_ministries')
    op.drop_index(op.f('ix_administrative_ministries_code'), table_name='administrative_ministries')
    op.drop_table('administrative_ministries')
