
-- 1) site_config: no more public read
DROP POLICY IF EXISTS "public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "public_read_site_config" ON public.site_config;

CREATE POLICY "service_role manages site_config"
  ON public.site_config FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admins read site_config"
  ON public.site_config FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) app_users: explicit service_role access
CREATE POLICY "service_role manages app_users"
  ON public.app_users FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 3) impersonation_logs
CREATE POLICY "service_role manages impersonation_logs"
  ON public.impersonation_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admins read impersonation_logs"
  ON public.impersonation_logs FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) tenants
CREATE POLICY "service_role manages tenants"
  ON public.tenants FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admins read tenants"
  ON public.tenants FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) webhook_logs: explicit service_role insert
CREATE POLICY "service_role inserts webhook_logs"
  ON public.webhook_logs FOR INSERT
  TO service_role WITH CHECK (true);

-- 6) Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
--    Admin login flow now goes through server functions that use service_role.
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_admin_password(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.save_site_config(text, jsonb) FROM PUBLIC, anon, authenticated;

-- 7) Upgrade stored admin password to bcrypt (was unsalted SHA-256)
INSERT INTO public.admin_auth_settings (singleton, password_hash, updated_at)
VALUES (true, '$2b$10$AnjdppizooXaWADBgexSvu2.nhEoLOEONMVFQaIliZO5HiHpLIZj6', now())
ON CONFLICT (singleton) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      updated_at = now();

-- 8) Seed / upgrade the master app_user with a bcrypt hash so masterLogin works
INSERT INTO public.app_users (tenant_id, username, password_salt, password_hash, role, display_name, status)
VALUES (NULL, 'admin', '', '$2b$10$AnjdppizooXaWADBgexSvu2.nhEoLOEONMVFQaIliZO5HiHpLIZj6', 'master', 'Admin Master', 'active')
ON CONFLICT DO NOTHING;

UPDATE public.app_users
   SET password_hash = '$2b$10$AnjdppizooXaWADBgexSvu2.nhEoLOEONMVFQaIliZO5HiHpLIZj6',
       password_salt = '',
       status = 'active'
 WHERE username = 'admin' AND role = 'master';
