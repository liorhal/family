-- Dashboard header: custom text, default "[family name] family dashboard"
ALTER TABLE families ADD COLUMN IF NOT EXISTS dashboard_header TEXT;

-- Member birthdays (month/day used for bonus; year optional)
ALTER TABLE members ADD COLUMN IF NOT EXISTS birthday DATE;

-- Birthday bonus source type for scores_log
ALTER TYPE score_source_type ADD VALUE 'birthday_bonus';
