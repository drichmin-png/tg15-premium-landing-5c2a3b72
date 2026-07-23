-- Namespaced site_config so each operator's storefront config lives on the server
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS namespace text;
CREATE UNIQUE INDEX IF NOT EXISTS site_config_namespace_uniq
  ON public.site_config(namespace) WHERE namespace IS NOT NULL;

-- Extend save_site_config with an optional namespace parameter.
-- namespace = NULL keeps writing to the existing singleton row (main site).
CREATE OR REPLACE FUNCTION public.save_site_config(pwd text, payload jsonb, ns text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash text;
  provided_hash text;
  clean_ns text;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.admin_auth_settings WHERE singleton = true;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'Senha administrativa não configurada';
  END IF;
  provided_hash := encode(extensions.digest(pwd, 'sha256'), 'hex');
  IF provided_hash <> stored_hash THEN
    RAISE EXCEPTION 'Senha incorreta';
  END IF;

  clean_ns := NULLIF(btrim(lower(ns)), '');

  IF clean_ns IS NULL THEN
    UPDATE public.site_config SET data = payload, updated_at = now() WHERE singleton = true;
    IF NOT FOUND THEN
      INSERT INTO public.site_config (singleton, data) VALUES (true, payload);
    END IF;
  ELSE
    UPDATE public.site_config
       SET data = payload, updated_at = now()
     WHERE namespace = clean_ns;
    IF NOT FOUND THEN
      INSERT INTO public.site_config (singleton, namespace, data)
      VALUES (false, clean_ns, payload);
    END IF;
  END IF;

  RETURN payload;
END;
$function$;

-- Public read function: returns config for a given namespace (or main singleton if null).
CREATE OR REPLACE FUNCTION public.read_site_config(ns text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  clean_ns text;
  result jsonb;
BEGIN
  clean_ns := NULLIF(btrim(lower(ns)), '');
  IF clean_ns IS NULL THEN
    SELECT data INTO result FROM public.site_config WHERE singleton = true LIMIT 1;
  ELSE
    SELECT data INTO result FROM public.site_config WHERE namespace = clean_ns LIMIT 1;
  END IF;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.read_site_config(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_site_config(text, jsonb, text) TO service_role;