-- School tasks: support research activities (no default member)
-- member_id NULL = research activity, anyone in family can complete and assign credit
-- family_id scopes research tasks to a family

ALTER TABLE school_tasks ALTER COLUMN member_id DROP NOT NULL;

-- Add family_id for scoping (required for research tasks)
ALTER TABLE school_tasks ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;
-- Backfill: set family_id from member for existing rows
UPDATE school_tasks st SET family_id = m.family_id FROM members m WHERE st.member_id = m.id AND st.family_id IS NULL;
-- For research tasks (member_id null), family_id must be set on insert. Make NOT NULL after backfill.
-- We keep it nullable for now to avoid breaking existing rows; new inserts will set it.

ALTER TYPE school_task_type ADD VALUE IF NOT EXISTS 'research';

-- RLS: family can view/complete school tasks (by member or by family_id for research)
DROP POLICY IF EXISTS "Family can view school tasks" ON school_tasks;
CREATE POLICY "Family can view school tasks"
  ON school_tasks FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR (member_id IS NULL AND family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "Family can complete school tasks" ON school_tasks;
CREATE POLICY "Family can complete school tasks"
  ON school_tasks FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR (member_id IS NULL AND family_id = get_my_family_id())
  );
