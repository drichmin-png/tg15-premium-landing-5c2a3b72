CREATE TABLE IF NOT EXISTS public.admin_auth_settings (
  singleton boolean PRIMARY KEY DEFAULT true,
  password_hash text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_auth_settings_singleton CHECK (singleton = true)
);

GRANT ALL ON public.admin_auth_settings TO service_role;

ALTER TABLE public.admin_auth_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_auth_settings (singleton, password_hash)
VALUES (true, 'efd04cebc62748d90abe9c5b244559cd07da568af5118ff935c4ed0d51c6abc4')
ON CONFLICT (singleton) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = now();