
-- Allow public read of site_config (no sensitive data stored)
GRANT SELECT ON public.site_config TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_site_config" ON public.site_config;
CREATE POLICY "public_read_site_config" ON public.site_config FOR SELECT TO anon, authenticated USING (true);

-- RPC to save config, password-gated using existing admin_auth_settings hash
CREATE OR REPLACE FUNCTION public.save_site_config(pwd text, payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash text;
  provided_hash text;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_auth_settings WHERE singleton = true;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'Senha administrativa não configurada';
  END IF;
  provided_hash := encode(extensions.digest(pwd, 'sha256'), 'hex');
  IF provided_hash <> stored_hash THEN
    RAISE EXCEPTION 'Senha incorreta';
  END IF;
  UPDATE public.site_config SET data = payload, updated_at = now() WHERE singleton = true;
  IF NOT FOUND THEN
    INSERT INTO public.site_config (singleton, data) VALUES (true, payload);
  END IF;
  RETURN payload;
END;
$$;

REVOKE ALL ON FUNCTION public.save_site_config(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_site_config(text, jsonb) TO anon, authenticated;
