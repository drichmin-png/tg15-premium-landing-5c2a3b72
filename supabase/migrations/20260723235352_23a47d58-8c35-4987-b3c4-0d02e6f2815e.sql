REVOKE ALL ON FUNCTION public.save_site_config(text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_site_config(text, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.read_site_config(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.read_site_config(text) TO anon, service_role;