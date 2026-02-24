-- Allow onboarding: new users can create a family and add themselves as admin
-- Without these policies, onboarding fails with RLS violation

-- Authenticated users can create a new family (for onboarding)
CREATE POLICY "Authenticated users can create family"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can add themselves as a member when they don't have one yet (onboarding)
CREATE POLICY "Users can add themselves as member"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid())
  );
