-- Badge completion dates and prevent double-counting
CREATE TABLE IF NOT EXISTS badge_earnings (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badge_earnings_member ON badge_earnings(member_id);

ALTER TABLE badge_earnings ENABLE ROW LEVEL SECURITY;

-- Family members can view each other's badge earnings
CREATE POLICY "Family can view badge_earnings"
  ON badge_earnings FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );

-- Family members can insert (server actions use service role or family context)
CREATE POLICY "Family can insert badge_earnings"
  ON badge_earnings FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id())
  );
