-- Enable Realtime for leaderboard updates
-- If this fails, enable via Supabase Dashboard: Database → Replication → supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scores_log;
ALTER PUBLICATION supabase_realtime ADD TABLE streaks;
