"""Add Row Level Security policies

Revision ID: 004_add_rls_policies
Revises: 003_add_progress_tracking
Create Date: 2026-10-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '004_add_rls_policies'
down_revision: Union[str, Sequence[str], None] = '003_add_progress_tracking'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enable RLS and create policies for all tables."""
    # Enable RLS on all tables
    op.execute('ALTER TABLE sources ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE topics ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE notes ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE raw_facts ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE code_blocks ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE comparison_tables ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE progress ENABLE ROW LEVEL SECURITY;')

    # Revoke default grants
    op.execute('REVOKE ALL ON sources FROM anon, authenticated;')
    op.execute('REVOKE ALL ON topics FROM anon, authenticated;')
    op.execute('REVOKE ALL ON notes FROM anon, authenticated;')
    op.execute('REVOKE ALL ON raw_facts FROM anon, authenticated;')
    op.execute('REVOKE ALL ON code_blocks FROM anon, authenticated;')
    op.execute('REVOKE ALL ON comparison_tables FROM anon, authenticated;')
    op.execute('REVOKE ALL ON note_versions FROM anon, authenticated;')
    op.execute('REVOKE ALL ON progress FROM anon, authenticated;')

    # Grant specific operations to authenticated
    op.execute('GRANT SELECT, INSERT, UPDATE ON sources TO authenticated;')
    op.execute('GRANT SELECT, INSERT ON topics TO authenticated;')
    op.execute('GRANT SELECT, INSERT, UPDATE ON notes TO authenticated;')
    op.execute('GRANT SELECT, INSERT ON raw_facts TO authenticated;')
    op.execute('GRANT SELECT, INSERT ON code_blocks TO authenticated;')
    op.execute('GRANT SELECT, INSERT ON comparison_tables TO authenticated;')
    op.execute('GRANT SELECT, INSERT ON note_versions TO authenticated;')
    op.execute('GRANT SELECT, INSERT, UPDATE ON progress TO authenticated;')

    # Create RLS policies for sources
    op.execute('''
        CREATE POLICY "Users can view their own sources"
        ON sources FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own sources"
        ON sources FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can update their own sources"
        ON sources FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for topics
    op.execute('''
        CREATE POLICY "Users can view their own topics"
        ON topics FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own topics"
        ON topics FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for notes
    op.execute('''
        CREATE POLICY "Users can view their own notes"
        ON notes FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own notes"
        ON notes FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can update their own notes"
        ON notes FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for raw_facts
    op.execute('''
        CREATE POLICY "Users can view their own raw_facts"
        ON raw_facts FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own raw_facts"
        ON raw_facts FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for code_blocks
    op.execute('''
        CREATE POLICY "Users can view their own code_blocks"
        ON code_blocks FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own code_blocks"
        ON code_blocks FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for comparison_tables
    op.execute('''
        CREATE POLICY "Users can view their own comparison_tables"
        ON comparison_tables FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own comparison_tables"
        ON comparison_tables FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for note_versions
    op.execute('''
        CREATE POLICY "Users can view their own note_versions"
        ON note_versions FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own note_versions"
        ON note_versions FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    # Create RLS policies for progress
    op.execute('''
        CREATE POLICY "Users can view their own progress"
        ON progress FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can insert their own progress"
        ON progress FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    ''')

    op.execute('''
        CREATE POLICY "Users can update their own progress"
        ON progress FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    ''')


def downgrade() -> None:
    """Remove RLS policies and disable RLS."""
    # Drop policies
    op.execute('DROP POLICY IF EXISTS "Users can update their own progress" ON progress;')
    op.execute('DROP POLICY IF EXISTS "Users can insert their own progress" ON progress;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own progress" ON progress;')

    op.execute('DROP POLICY IF EXISTS "Users can insert their own note_versions" ON note_versions;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own note_versions" ON note_versions;')

    op.execute('DROP POLICY IF EXISTS "Users can insert their own comparison_tables" ON comparison_tables;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own comparison_tables" ON comparison_tables;')

    op.execute('DROP POLICY IF EXISTS "Users can insert their own code_blocks" ON code_blocks;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own code_blocks" ON code_blocks;')

    op.execute('DROP POLICY IF EXISTS "Users can insert their own raw_facts" ON raw_facts;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own raw_facts" ON raw_facts;')

    op.execute('DROP POLICY IF EXISTS "Users can update their own notes" ON notes;')
    op.execute('DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own notes" ON notes;')

    op.execute('DROP POLICY IF EXISTS "Users can insert their own topics" ON topics;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own topics" ON topics;')

    op.execute('DROP POLICY IF EXISTS "Users can update their own sources" ON sources;')
    op.execute('DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;')
    op.execute('DROP POLICY IF EXISTS "Users can view their own sources" ON sources;')

    # Disable RLS
    op.execute('ALTER TABLE progress DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE note_versions DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE comparison_tables DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE code_blocks DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE raw_facts DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE notes DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE topics DISABLE ROW LEVEL SECURITY;')
    op.execute('ALTER TABLE sources DISABLE ROW LEVEL SECURITY;')

    # Revoke grants
    op.execute('REVOKE SELECT, INSERT, UPDATE ON progress FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT ON note_versions FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT ON comparison_tables FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT ON code_blocks FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT ON raw_facts FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT, UPDATE ON notes FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT ON topics FROM authenticated;')
    op.execute('REVOKE SELECT, INSERT, UPDATE ON sources FROM authenticated;')
