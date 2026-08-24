-- Preserve the role selected during account creation.
-- Missing or invalid client metadata always falls back to USER.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := upper(COALESCE(NEW.raw_user_meta_data->>'role', 'USER'));
  profile_role app_role := 'USER'::app_role;
BEGIN
  IF requested_role IN ('USER', 'MODEL', 'MANAGER', 'ADMIN') THEN
    profile_role := requested_role::app_role;
  END IF;

  INSERT INTO public.profiles (id, email, name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    profile_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
