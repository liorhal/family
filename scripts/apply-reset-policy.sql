-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jnigheoieybgeaqurvup/sql
-- Allows family members to delete scores (for reset/undo completed activity)

DROP POLICY IF EXISTS "Family can delete scores" ON scores_log;
CREATE POLICY "Family can delete scores" ON scores_log FOR DELETE
  USING (member_id IN (SELECT id FROM members WHERE family_id = get_my_family_id()));
