CREATE POLICY "service role can manage admin auth settings"
ON public.admin_auth_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);