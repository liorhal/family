-- Admins can manage: scope to own family only (was allowing any admin to see all families' activities)
DROP POLICY IF EXISTS "Admins can manage sport activities" ON sport_activities;
CREATE POLICY "Admins can manage sport activities" ON sport_activities FOR ALL
  USING (
    is_family_admin()
    AND (
      member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
      OR (member_id IS NULL AND family_id = get_my_family_id())
    )
  );
