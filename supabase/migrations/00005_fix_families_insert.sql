-- Fix: Allow authenticated users to create families (onboarding)
-- Run this in Supabase SQL Editor if you get "new row violates row-level security policy for table families"

DROP POLICY IF EXISTS "Authenticated users can create family" ON families;
CREATE POLICY "Authenticated users can create family"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can add themselves as member" ON members;
CREATE POLICY "Users can add themselves as member"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid())
  );
