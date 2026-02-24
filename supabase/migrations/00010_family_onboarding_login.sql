-- Update create_family_and_join to accept and store login_code
CREATE OR REPLACE FUNCTION public.create_family_and_join(
  p_name TEXT DEFAULT 'Me',
  p_family_name TEXT DEFAULT 'My Family',
  p_login_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User already has a family';
  END IF;

  INSERT INTO families (name, login_code) 
  VALUES (p_family_name, NULLIF(TRIM(p_login_code), ''))
  RETURNING id INTO v_family_id;

  INSERT INTO members (family_id, user_id, name, role)
  VALUES (v_family_id, v_user_id, p_name, 'admin');

  RETURN v_family_id;
END;
$$;
