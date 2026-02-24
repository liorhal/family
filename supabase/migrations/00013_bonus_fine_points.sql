-- Add bonus and fine source types for manual point adjustments
ALTER TYPE score_source_type ADD VALUE 'bonus';
ALTER TYPE score_source_type ADD VALUE 'fine';

-- Add description for bonus/fine entries
ALTER TABLE scores_log ADD COLUMN IF NOT EXISTS description TEXT;
