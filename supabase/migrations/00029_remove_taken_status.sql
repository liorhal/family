-- Remove "taken" status: tasks with assignments stay "open"; assignments define "assigned" state
UPDATE tasks SET status = 'open' WHERE status = 'taken';
