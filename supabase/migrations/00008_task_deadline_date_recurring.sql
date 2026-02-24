-- House tasks: deadline is date-only, add recurring_daily (always open)
-- When recurring_daily=true and task is completed, it resets with deadline=tomorrow

ALTER TABLE tasks
  ALTER COLUMN deadline TYPE DATE USING (deadline::date);

ALTER TABLE tasks
  ADD COLUMN recurring_daily BOOLEAN NOT NULL DEFAULT false;
