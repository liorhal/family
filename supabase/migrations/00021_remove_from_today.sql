-- Setting: allow removing activities from today (reappears tomorrow)
ALTER TABLE families ADD COLUMN IF NOT EXISTS show_remove_from_today BOOLEAN DEFAULT false;

-- Track dismissed activities per day (family_id, source_type, source_id, date)
CREATE TABLE IF NOT EXISTS activity_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('house', 'sport', 'school')),
  source_id UUID NOT NULL,
  date DATE NOT NULL,
  UNIQUE(family_id, source_type, source_id, date)
);

CREATE INDEX IF NOT EXISTS idx_activity_dismissals_lookup
  ON activity_dismissals(family_id, date);

ALTER TABLE activity_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family can manage dismissals"
  ON activity_dismissals FOR ALL
  USING (family_id = get_my_family_id())
  WITH CHECK (family_id = get_my_family_id());
