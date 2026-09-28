from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from typing import Union, Sequence

# revision identifiers, used by Alembic.
revision = '7f34630ebc77'
down_revision: Union[str, None] = '0004_add_industry'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
