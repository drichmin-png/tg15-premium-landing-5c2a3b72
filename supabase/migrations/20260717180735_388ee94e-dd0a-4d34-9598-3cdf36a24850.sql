
-- Convert has_role to SECURITY INVOKER. The user_roles RLS policy
-- "users can read own roles" (user_id = auth.uid()) already lets a
-- signed-in user check their own role, which is the only case used
-- by RLS policies in this project (they all pass auth.uid()).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
