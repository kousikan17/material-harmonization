"""sync import batch schema

Revision ID: c8a2b3c4d5e6
Revises: b7ea18ef2997
Create Date: 2026-09-29 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'c8a2b3c4d5e6'
down_revision = 'db48d22d8ca0'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # 1. Create import_batches if it doesn't exist
    if not inspector.has_table('import_batches'):
        op.create_table(
            'import_batches',
            sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('cpse_id', sa.UUID(as_uuid=True), nullable=False),
            sa.Column('sector', sa.String(length=100), nullable=True),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('uploaded_by', sa.UUID(as_uuid=True), nullable=False),
            sa.Column('upload_date', sa.Date(), nullable=False),
            sa.Column('upload_time', sa.Time(), nullable=False),
            sa.Column('total_records', sa.Integer(), nullable=False),
            sa.Column('created_count', sa.Integer(), nullable=False),
            sa.Column('updated_count', sa.Integer(), nullable=False),
            sa.Column('duplicate_count', sa.Integer(), nullable=False),
            sa.Column('invalid_count', sa.Integer(), nullable=False),
            sa.Column('failed_count', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['cpse_id'], ['cpses.id'], ),
            sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_import_batches_cpse_id'), 'import_batches', ['cpse_id'], unique=False)
        op.create_index(op.f('ix_import_batches_sector'), 'import_batches', ['sector'], unique=False)
        op.create_index(op.f('ix_import_batches_status'), 'import_batches', ['status'], unique=False)
        op.create_index(op.f('ix_import_batches_uploaded_by'), 'import_batches', ['uploaded_by'], unique=False)

    # 2. Create cpse_import_batches if it doesn't exist
    if not inspector.has_table('cpse_import_batches'):
        op.create_table(
            'cpse_import_batches',
            sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('uploaded_by', sa.UUID(as_uuid=True), nullable=False),
            sa.Column('upload_date', sa.Date(), nullable=False),
            sa.Column('upload_time', sa.Time(), nullable=False),
            sa.Column('total_records', sa.Integer(), nullable=False),
            sa.Column('created_count', sa.Integer(), nullable=False),
            sa.Column('duplicate_count', sa.Integer(), nullable=False),
            sa.Column('invalid_count', sa.Integer(), nullable=False),
            sa.Column('failed_count', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_cpse_import_batches_status'), 'cpse_import_batches', ['status'], unique=False)
        op.create_index(op.f('ix_cpse_import_batches_uploaded_by'), 'cpse_import_batches', ['uploaded_by'], unique=False)

    # 3. Handle cpse_materials.import_batch_id
    columns = [c['name'] for c in inspector.get_columns('cpse_materials')]
    if 'import_batch_id' not in columns:
        op.add_column('cpse_materials', sa.Column('import_batch_id', sa.UUID(as_uuid=True), nullable=True))
    
    # 4. Handle foreign key constraint for import_batch_id
    fks = inspector.get_foreign_keys('cpse_materials')
    fk_exists = any('import_batch_id' in fk['constrained_columns'] for fk in fks)
    if not fk_exists:
        op.create_foreign_key('fk_cpse_materials_import_batch_id', 'cpse_materials', 'import_batches', ['import_batch_id'], ['id'], ondelete='SET NULL')

    # 5. Handle index for import_batch_id
    indexes = inspector.get_indexes('cpse_materials')
    index_exists = any('import_batch_id' in idx['column_names'] for idx in indexes)
    if not index_exists:
        op.create_index(op.f('ix_cpse_materials_import_batch_id'), 'cpse_materials', ['import_batch_id'], unique=False)


def downgrade() -> None:
    pass
