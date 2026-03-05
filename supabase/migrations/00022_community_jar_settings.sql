-- Community Jar: configurable target and prize per family
ALTER TABLE families ADD COLUMN IF NOT EXISTS jar_target INTEGER DEFAULT 1500;
ALTER TABLE families ADD COLUMN IF NOT EXISTS jar_prize TEXT DEFAULT '1,500 points = Family Movie Night 🍿';
