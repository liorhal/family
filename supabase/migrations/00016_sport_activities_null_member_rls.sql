-- Allow family to see and complete sport activities with null member_id
DROP POLICY IF EXISTS "Family can view sport activities" ON sport_activities;
CREATE POLICY "Family can view sport activities"
  ON sport_activities FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR member_id IS NULL
  );

DROP POLICY IF EXISTS "Family can complete sport activities" ON sport_activities;
CREATE POLICY "Family can complete sport activities"
  ON sport_activities FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    OR member_id IS NULL
  );
