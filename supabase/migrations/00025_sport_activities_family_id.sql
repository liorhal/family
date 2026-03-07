-- Add family_id to sport_activities for proper family scoping (fixes cross-family visibility when member_id is null)
ALTER TABLE sport_activities ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE CASCADE;

-- Backfill: set family_id from member for existing rows
UPDATE sport_activities sa
SET family_id = m.family_id
FROM members m
WHERE sa.member_id = m.id AND sa.family_id IS NULL;

-- RLS: only allow viewing activities where member is in family OR (member null AND family_id matches)
DROP POLICY IF EXISTS "Family can view sport activities" ON sport_activities;
CREATE POLICY "Family can view sport activities"
  ON sport_activities FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR (member_id IS NULL AND family_id = get_my_family_id())
  );

DROP POLICY IF EXISTS "Family can complete sport activities" ON sport_activities;
CREATE POLICY "Family can complete sport activities"
  ON sport_activities FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR (member_id IS NULL AND family_id = get_my_family_id())
  );
