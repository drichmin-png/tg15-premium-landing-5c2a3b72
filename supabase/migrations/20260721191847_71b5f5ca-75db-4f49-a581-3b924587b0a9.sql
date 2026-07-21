
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =========================
-- tenants (operadores)
-- =========================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  responsible_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','inactive')),
  expires_at TIMESTAMPTZ,
  order_limit INTEGER NOT NULL DEFAULT 0,
  product_limit INTEGER NOT NULL DEFAULT 0,
  user_limit INTEGER NOT NULL DEFAULT 3,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- No policies: only accessible via service_role from server functions.

-- =========================
-- app_users (usuários do SaaS: master + owners + staff)
-- =========================
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master','owner','staff')),
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_users_master_no_tenant CHECK (
    (role = 'master' AND tenant_id IS NULL) OR (role <> 'master' AND tenant_id IS NOT NULL)
  )
);

-- Master usernames are globally unique; tenant users are unique per tenant.
CREATE UNIQUE INDEX app_users_master_username_uniq
  ON public.app_users (username) WHERE role = 'master';
CREATE UNIQUE INDEX app_users_tenant_username_uniq
  ON public.app_users (tenant_id, username) WHERE role <> 'master';

GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- =========================
-- impersonation_logs
-- =========================
CREATE TABLE public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ip TEXT,
  user_agent TEXT
);

GRANT ALL ON public.impersonation_logs TO service_role;
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- updated_at triggers
-- =========================
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Seed: master + primeiro tenant (T.G.15)
-- Password hashing: sha256(salt || password), hex.
-- Master password = "34561581"; owner do tg15 senha inicial = "34561581".
-- =========================
DO $$
DECLARE
  v_master_salt TEXT := encode(extensions.gen_random_bytes(16), 'hex');
  v_owner_salt  TEXT := encode(extensions.gen_random_bytes(16), 'hex');
  v_tenant_id   UUID;
BEGIN
  INSERT INTO public.tenants (slug, company_name, responsible_name, plan, status)
  VALUES ('tg15', 'T.G.15', 'Administrador', 'owner', 'active')
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.app_users (tenant_id, username, password_salt, password_hash, role, display_name)
  VALUES (
    NULL,
    'admin',
    v_master_salt,
    encode(extensions.digest(v_master_salt || '34561581', 'sha256'), 'hex'),
    'master',
    'Admin Master'
  );

  INSERT INTO public.app_users (tenant_id, username, password_salt, password_hash, role, display_name)
  VALUES (
    v_tenant_id,
    'admin',
    v_owner_salt,
    encode(extensions.digest(v_owner_salt || '34561581', 'sha256'), 'hex'),
    'owner',
    'Dono T.G.15'
  );
END $$;
