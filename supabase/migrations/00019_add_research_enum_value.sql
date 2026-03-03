-- Fix for migrations 00017/00018 not applied: add research enum + nullable member_id + nullable due_date
-- Safe to run multiple times

DO $$ BEGIN
  ALTER TYPE school_task_type ADD VALUE 'research';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE school_tasks ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE school_tasks ALTER COLUMN due_date DROP NOT NULL;
