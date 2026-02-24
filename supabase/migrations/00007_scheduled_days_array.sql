-- Support multiple week days for activities (0=Sun, 1=Mon, ..., 6=Sat)

-- sport_activities: add scheduled_days array, migrate from scheduled_day
ALTER TABLE sport_activities ADD COLUMN scheduled_days SMALLINT[] DEFAULT '{}';

UPDATE sport_activities
SET scheduled_days = CASE
  WHEN scheduled_day IS NOT NULL THEN ARRAY[scheduled_day]::SMALLINT[]
  ELSE '{}'
END;

ALTER TABLE sport_activities DROP COLUMN IF EXISTS scheduled_day;

-- tasks (house): add scheduled_days for recurring weekly chores
ALTER TABLE tasks ADD COLUMN scheduled_days SMALLINT[] DEFAULT NULL;

-- school_tasks: add scheduled_days for recurring weekly assignments
ALTER TABLE school_tasks ADD COLUMN scheduled_days SMALLINT[] DEFAULT NULL;
