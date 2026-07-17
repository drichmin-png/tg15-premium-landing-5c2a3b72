
-- Enum for gateway types
DO $$ BEGIN
  CREATE TYPE public.gateway_tipo AS ENUM ('ironpay', 'pagarme', 'mercadopago', 'outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Gateways table
CREATE TABLE IF NOT EXISTS public.gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo public.gateway_tipo NOT NULL,
  chave_publica text NOT NULL DEFAULT '',
  chave_secreta text NOT NULL DEFAULT '',
  webhook_secret text NOT NULL DEFAULT '',
  tipo_chave_pix text NOT NULL DEFAULT 'aleatoria',
  chave_pix text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  padrao boolean NOT NULL DEFAULT false,
  prioridade integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gateways TO authenticated;
GRANT ALL ON public.gateways TO service_role;
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gateways admin all" ON public.gateways
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER gateways_set_updated_at
  BEFORE UPDATE ON public.gateways
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Webhook logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_tipo text NOT NULL,
  pedido_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  assinatura_valida boolean NOT NULL DEFAULT false,
  sucesso boolean NOT NULL DEFAULT false,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_logs admin read" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS webhook_logs_created_idx ON public.webhook_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_logs_gateway_idx ON public.webhook_logs (gateway_tipo);

-- Orders: add gateway + UTM + tracking fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gateway_utilizado text,
  ADD COLUMN IF NOT EXISTS gateway_charge_id text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS status_rastreio text NOT NULL DEFAULT 'preparando',
  ADD COLUMN IF NOT EXISTS rastreio_atualizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS chargeback_flag boolean NOT NULL DEFAULT false;

-- Admin settings: integration tokens (server-only reads)
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS facebook_capi_token text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS utmify_api_key text NOT NULL DEFAULT '';
