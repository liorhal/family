-- Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- families: users can only see their own family
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id = get_my_family_id());

CREATE POLICY "Admins can update own family"
  ON families FOR UPDATE
  USING (id = get_my_family_id() AND is_family_admin());

-- members: users can view members of their family
CREATE POLICY "Users can view family members"
  ON members FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Admins can manage family members"
  ON members FOR ALL
  USING (family_id = get_my_family_id() AND is_family_admin());

-- tasks: family members can view, admins can manage
CREATE POLICY "Family can view tasks"
  ON tasks FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  USING (family_id = get_my_family_id() AND is_family_admin());

-- task_assignments: family members can view; kids can take/complete their own
CREATE POLICY "Family can view task assignments"
  ON task_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignments.task_id 
      AND t.family_id = get_my_family_id()
    )
  );

CREATE POLICY "Members can take tasks"
  ON task_assignments FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_assignments.task_id 
      AND t.family_id = get_my_family_id()
      AND t.status = 'open'
    )
  );

CREATE POLICY "Members can complete own assignments"
  ON task_assignments FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- sport_activities: members see own, admins manage
CREATE POLICY "Members can view own sport activities"
  ON sport_activities FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_family_admin()
  );

CREATE POLICY "Admins can manage sport activities"
  ON sport_activities FOR ALL
  USING (is_family_admin());

CREATE POLICY "Members can add extra sport activities"
  ON sport_activities FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    AND type = 'extra'
  );

CREATE POLICY "Members can complete own sport activities"
  ON sport_activities FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- school_tasks: members see own, admins manage
CREATE POLICY "Members can view own school tasks"
  ON school_tasks FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_family_admin()
  );

CREATE POLICY "Admins can manage school tasks"
  ON school_tasks FOR ALL
  USING (is_family_admin());

CREATE POLICY "Members can add own school tasks"
  ON school_tasks FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Members can complete own school tasks"
  ON school_tasks FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- scores_log: read-only, family can view
CREATE POLICY "Family can view scores"
  ON scores_log FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

CREATE POLICY "Service role inserts scores"
  ON scores_log FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

-- streaks: family can view
CREATE POLICY "Family can view streaks"
  ON streaks FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

CREATE POLICY "Family can update streaks"
  ON streaks FOR ALL
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );
