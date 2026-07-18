
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.verify_admin_password(pwd text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored text;
  provided text;
BEGIN
  SELECT password_hash INTO stored FROM public.admin_auth_settings WHERE singleton = true;
  IF stored IS NULL THEN RETURN false; END IF;
  provided := encode(extensions.digest(btrim(pwd), 'sha256'), 'hex');
  RETURN provided = stored;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_password(current_pwd text, new_pwd text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  ok boolean;
BEGIN
  IF length(btrim(new_pwd)) < 4 THEN
    RAISE EXCEPTION 'Senha muito curta';
  END IF;
  SELECT public.verify_admin_password(current_pwd) INTO ok;
  IF NOT ok THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;
  INSERT INTO public.admin_auth_settings (singleton, password_hash, updated_at)
  VALUES (true, encode(extensions.digest(btrim(new_pwd), 'sha256'), 'hex'), now())
  ON CONFLICT (singleton) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now();
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_password(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_admin_password(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_password(text, text) TO anon, authenticated;
