-- Family Productivity - Full Database Deploy
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- https://supabase.com/dashboard/project/jnigheoieybgeaqurvup/sql

-- ========== 00001_initial_schema.sql ==========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('admin', 'kid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('open', 'taken', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE sport_type AS ENUM ('weekly', 'extra');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE school_task_type AS ENUM ('homework', 'exam', 'project');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  CREATE TYPE score_source_type AS ENUM ('house', 'sport', 'school', 'streak_bonus');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'kid',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_family ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  default_assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'open',
  score_value INT NOT NULL DEFAULT 10 CHECK (score_value >= 0),
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_member ON task_assignments(member_id);

CREATE TABLE IF NOT EXISTS sport_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type sport_type NOT NULL DEFAULT 'weekly',
  scheduled_day SMALLINT CHECK (scheduled_day >= 0 AND scheduled_day <= 6),
  score_value INT NOT NULL DEFAULT 10 CHECK (score_value >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sport_activities_member ON sport_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_sport_activities_scheduled ON sport_activities(scheduled_day);

CREATE TABLE IF NOT EXISTS school_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type school_task_type NOT NULL DEFAULT 'homework',
  due_date DATE NOT NULL,
  score_value INT NOT NULL DEFAULT 10 CHECK (score_value >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_tasks_member ON school_tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_school_tasks_due ON school_tasks(due_date);

CREATE TABLE IF NOT EXISTS scores_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source_type score_source_type NOT NULL,
  source_id UUID,
  score_delta INT NOT NULL CHECK (score_delta >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_log_member ON scores_log(member_id);
CREATE INDEX IF NOT EXISTS idx_scores_log_created ON scores_log(created_at);

CREATE TABLE IF NOT EXISTS streaks (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE
);

CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_family_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ========== 00002_rls_policies.sql ==========
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own family" ON families;
CREATE POLICY "Users can view own family" ON families FOR SELECT
  USING (id = get_my_family_id());

DROP POLICY IF EXISTS "Admins can update own family" ON families;
CREATE POLICY "Admins can update own family" ON families FOR UPDATE
  USING (id = get_my_family_id() AND is_family_admin());

DROP POLICY IF EXISTS "Users can view family members" ON members;
CREATE POLICY "Users can view family members" ON members FOR SELECT
  USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "Admins can manage family members" ON members;
CREATE POLICY "Admins can manage family members" ON members FOR ALL
  USING (family_id = get_my_family_id() AND is_family_admin());

DROP POLICY IF EXISTS "Family can view tasks" ON tasks;
CREATE POLICY "Family can view tasks" ON tasks FOR SELECT
  USING (family_id = get_my_family_id());

DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL
  USING (family_id = get_my_family_id() AND is_family_admin());

DROP POLICY IF EXISTS "Family can view task assignments" ON task_assignments;
CREATE POLICY "Family can view task assignments" ON task_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_assignments.task_id AND t.family_id = get_my_family_id()));

DROP POLICY IF EXISTS "Members can take tasks" ON task_assignments;
CREATE POLICY "Members can take tasks" ON task_assignments FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_assignments.task_id AND t.family_id = get_my_family_id() AND t.status = 'open')
  );

DROP POLICY IF EXISTS "Members can complete own assignments" ON task_assignments;
CREATE POLICY "Members can complete own assignments" ON task_assignments FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can view own sport activities" ON sport_activities;
CREATE POLICY "Members can view own sport activities" ON sport_activities FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()) OR is_family_admin());

DROP POLICY IF EXISTS "Admins can manage sport activities" ON sport_activities;
CREATE POLICY "Admins can manage sport activities" ON sport_activities FOR ALL
  USING (is_family_admin());

DROP POLICY IF EXISTS "Members can add extra sport activities" ON sport_activities;
CREATE POLICY "Members can add extra sport activities" ON sport_activities FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()) AND type = 'extra');

DROP POLICY IF EXISTS "Members can complete own sport activities" ON sport_activities;
CREATE POLICY "Members can complete own sport activities" ON sport_activities FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can view own school tasks" ON school_tasks;
CREATE POLICY "Members can view own school tasks" ON school_tasks FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()) OR is_family_admin());

DROP POLICY IF EXISTS "Admins can manage school tasks" ON school_tasks;
CREATE POLICY "Admins can manage school tasks" ON school_tasks FOR ALL
  USING (is_family_admin());

DROP POLICY IF EXISTS "Members can add own school tasks" ON school_tasks;
CREATE POLICY "Members can add own school tasks" ON school_tasks FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can complete own school tasks" ON school_tasks;
CREATE POLICY "Members can complete own school tasks" ON school_tasks FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Family can view scores" ON scores_log;
CREATE POLICY "Family can view scores" ON scores_log FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));

DROP POLICY IF EXISTS "Service role inserts scores" ON scores_log;
CREATE POLICY "Service role inserts scores" ON scores_log FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));

DROP POLICY IF EXISTS "Family can delete scores" ON scores_log;
CREATE POLICY "Family can delete scores" ON scores_log FOR DELETE
  USING (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));

DROP POLICY IF EXISTS "Family can view streaks" ON streaks;
CREATE POLICY "Family can view streaks" ON streaks FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));

DROP POLICY IF EXISTS "Family can update streaks" ON streaks;
CREATE POLICY "Family can update streaks" ON streaks FOR ALL
  USING (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));

-- ========== 00004_onboarding_rls.sql ==========
DROP POLICY IF EXISTS "Authenticated users can create family" ON families;
CREATE POLICY "Authenticated users can create family" ON families FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can add themselves as member" ON members;
CREATE POLICY "Users can add themselves as member" ON members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid())
  );

-- ========== 00003_realtime.sql (run separately if this fails) ==========
-- ALTER PUBLICATION supabase_realtime ADD TABLE scores_log;
-- ALTER PUBLICATION supabase_realtime ADD TABLE streaks;
