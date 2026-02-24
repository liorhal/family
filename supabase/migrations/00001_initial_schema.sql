-- Family Gamified Productivity App - Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE member_role AS ENUM ('admin', 'kid');
CREATE TYPE task_status AS ENUM ('open', 'taken', 'completed', 'expired');
CREATE TYPE sport_type AS ENUM ('weekly', 'extra');
CREATE TYPE school_task_type AS ENUM ('homework', 'exam', 'project');
CREATE TYPE score_source_type AS ENUM ('house', 'sport', 'school', 'streak_bonus');

-- 1. families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. members (links auth.users to families)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'kid',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX idx_members_family ON members(family_id);
CREATE INDEX idx_members_user ON members(user_id);

-- 3. tasks (house tasks)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- 4. task_assignments
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(task_id)
);

CREATE INDEX idx_task_assignments_member ON task_assignments(member_id);

-- 5. sport_activities
CREATE TABLE sport_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type sport_type NOT NULL DEFAULT 'weekly',
  scheduled_day SMALLINT CHECK (scheduled_day >= 0 AND scheduled_day <= 6),
  score_value INT NOT NULL DEFAULT 10 CHECK (score_value >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sport_activities_member ON sport_activities(member_id);
CREATE INDEX idx_sport_activities_scheduled ON sport_activities(scheduled_day);

-- 6. school_tasks
CREATE TABLE school_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type school_task_type NOT NULL DEFAULT 'homework',
  due_date DATE NOT NULL,
  score_value INT NOT NULL DEFAULT 10 CHECK (score_value >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_school_tasks_member ON school_tasks(member_id);
CREATE INDEX idx_school_tasks_due ON school_tasks(due_date);

-- 7. scores_log (immutable)
CREATE TABLE scores_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  source_type score_source_type NOT NULL,
  source_id UUID,
  score_delta INT NOT NULL CHECK (score_delta >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_log_member ON scores_log(member_id);
CREATE INDEX idx_scores_log_created ON scores_log(created_at);

-- 8. streaks
CREATE TABLE streaks (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE
);

-- Helper: get member's family_id from auth
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if user is admin of their family
CREATE OR REPLACE FUNCTION is_family_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
