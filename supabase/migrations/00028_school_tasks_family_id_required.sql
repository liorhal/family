-- Ensure all school tasks have family_id. Add column if missing (e.g. deploy-all path), backfill, require NOT NULL.
ALTER TABLE school_tasks ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;

-- Rows with member_id: backfill family_id from member
UPDATE school_tasks st
SET family_id = m.family_id
FROM members m
WHERE st.member_id = m.id AND st.family_id IS NULL;

-- Rows with member_id null and family_id null: orphaned, remove (cannot determine family)
DELETE FROM school_tasks WHERE member_id IS NULL AND family_id IS NULL;

-- Require family_id for all school tasks
ALTER TABLE school_tasks ALTER COLUMN family_id SET NOT NULL;
