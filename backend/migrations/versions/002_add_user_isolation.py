"""Add user isolation to all tables

Revision ID: 002_add_user_isolation
Revises: e31bd55c3a5a
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_user_isolation'
down_revision: Union[str, Sequence[str], None] = '001_add_timestamps_to_source'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user_id columns to all tables for user isolation."""
    # Add user_id columns
    op.execute('ALTER TABLE sources ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE topics ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE raw_facts ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE code_blocks ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE comparison_tables ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')
    op.execute('ALTER TABLE note_versions ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;')

    # Add indexes for performance
    op.execute('CREATE INDEX idx_sources_user_id ON sources(user_id);')
    op.execute('CREATE INDEX idx_topics_user_id ON topics(user_id);')
    op.execute('CREATE INDEX idx_notes_user_id ON notes(user_id);')
    op.execute('CREATE INDEX idx_raw_facts_user_id ON raw_facts(user_id);')
    op.execute('CREATE INDEX idx_code_blocks_user_id ON code_blocks(user_id);')
    op.execute('CREATE INDEX idx_comparison_tables_user_id ON comparison_tables(user_id);')
    op.execute('CREATE INDEX idx_note_versions_user_id ON note_versions(user_id);')


def downgrade() -> None:
    """Remove user_id columns."""
    op.execute('DROP INDEX IF EXISTS idx_note_versions_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_comparison_tables_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_code_blocks_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_raw_facts_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_notes_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_topics_user_id;')
    op.execute('DROP INDEX IF EXISTS idx_sources_user_id;')

    op.execute('ALTER TABLE note_versions DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE comparison_tables DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE code_blocks DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE raw_facts DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE notes DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE topics DROP COLUMN IF EXISTS user_id;')
    op.execute('ALTER TABLE sources DROP COLUMN IF EXISTS user_id;')
