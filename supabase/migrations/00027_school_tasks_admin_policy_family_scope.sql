-- Admins can manage: scope to own family only (was allowing any admin to see all families' school tasks)
DROP POLICY IF EXISTS "Admins can manage school tasks" ON school_tasks;
CREATE POLICY "Admins can manage school tasks" ON school_tasks FOR ALL
  USING (
    is_family_admin()
    AND (
      member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
      OR (member_id IS NULL AND family_id = get_my_family_id())
    )
  );
