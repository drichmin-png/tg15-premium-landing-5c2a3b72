
-- 1) admin_settings: remove public SELECT policy exposing secrets
DROP POLICY IF EXISTS "anyone can read settings" ON public.admin_settings;

-- Add a safe SELECT policy only for admins (server code uses service role and bypasses RLS)
CREATE POLICY "admins read settings"
  ON public.admin_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) orders / order_items: remove overly permissive anon INSERT policies.
-- All writes go through server functions using the service role, which bypasses RLS.
DROP POLICY IF EXISTS "anyone can create order" ON public.orders;
DROP POLICY IF EXISTS "anyone can insert order items" ON public.order_items;

-- 3) Lock down has_role SECURITY DEFINER function execution:
--    Only authenticated users need to call it (via RLS policies). Revoke from PUBLIC and anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
