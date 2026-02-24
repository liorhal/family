-- RLS updates for family-shared login: anyone in family can take/release/complete for any member

-- task_assignments: allow any family member to assign any family member
DROP POLICY IF EXISTS "Members can take tasks" ON task_assignments;
CREATE POLICY "Family can take tasks for any member"
  ON task_assignments FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
    AND EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignments.task_id 
      AND t.family_id = get_my_family_id()
      AND t.status = 'open'
    )
  );

-- task_assignments: allow any family member to update (complete) assignments
DROP POLICY IF EXISTS "Members can complete own assignments" ON task_assignments;
CREATE POLICY "Family can update task assignments"
  ON task_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignments.task_id 
      AND t.family_id = get_my_family_id()
    )
  );

-- task_assignments: allow any family member to delete (release)
CREATE POLICY "Family can delete task assignments"
  ON task_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignments.task_id 
      AND t.family_id = get_my_family_id()
    )
  );

-- sport_activities: family members see all family activities
DROP POLICY IF EXISTS "Members can view own sport activities" ON sport_activities;
CREATE POLICY "Family can view sport activities"
  ON sport_activities FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

-- sport_activities: family members can complete any family activity
DROP POLICY IF EXISTS "Members can complete own sport activities" ON sport_activities;
CREATE POLICY "Family can complete sport activities"
  ON sport_activities FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

-- school_tasks: family members see all family tasks
DROP POLICY IF EXISTS "Members can view own school tasks" ON school_tasks;
CREATE POLICY "Family can view school tasks"
  ON school_tasks FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

-- school_tasks: family members can complete any family task
DROP POLICY IF EXISTS "Members can complete own school tasks" ON school_tasks;
CREATE POLICY "Family can complete school tasks"
  ON school_tasks FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );
