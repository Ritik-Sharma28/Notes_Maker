"""Add progress tracking table

Revision ID: 003_add_progress_tracking
Revises: 002_add_user_isolation
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '003_add_progress_tracking'
down_revision: Union[str, Sequence[str], None] = '002_add_user_isolation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create progress tracking table."""
    op.create_table('progress',
    sa.Column('source_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('current_agent', sa.String(length=50), nullable=False),
    sa.Column('current_step', sa.String(length=100), nullable=True),
    sa.Column('percentage', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('message', sa.Text(), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('last_agent_state', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('user_role', sa.String(length=20), nullable=False, server_default='regular'),
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['auth.users'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # Add indexes
    op.execute('CREATE INDEX idx_progress_source_id ON progress(source_id);')
    op.execute('CREATE INDEX idx_progress_user_id ON progress(user_id);')


def downgrade() -> None:
    """Remove progress tracking table."""
    op.execute('DROP INDEX IF EXISTS idx_progress_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_progress_source_id;')
    op.drop_table('progress')
