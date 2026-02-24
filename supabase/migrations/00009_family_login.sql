-- Family login: login_code + password (auth via Supabase Auth with shared family account)
-- login_code is used as email prefix: login_code@family.local
ALTER TABLE families ADD COLUMN IF NOT EXISTS login_code TEXT UNIQUE;

-- Allow NULL for existing families (migrated from magic link)
-- New families will have login_code set during onboarding
