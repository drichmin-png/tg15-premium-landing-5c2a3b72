
-- Add tenant_id (nullable during backfill)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Backfill everything existing to the tg15 tenant
DO $$
DECLARE
  v_tg15 UUID;
BEGIN
  SELECT id INTO v_tg15 FROM public.tenants WHERE slug = 'tg15' LIMIT 1;
  IF v_tg15 IS NULL THEN RETURN; END IF;
  UPDATE public.orders           SET tenant_id = v_tg15 WHERE tenant_id IS NULL;
  UPDATE public.order_items      SET tenant_id = v_tg15 WHERE tenant_id IS NULL;
  UPDATE public.analytics_events SET tenant_id = v_tg15 WHERE tenant_id IS NULL;
  UPDATE public.site_config      SET tenant_id = v_tg15 WHERE tenant_id IS NULL;
END $$;

-- Indexes for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created           ON public.orders           (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant              ON public.order_items      (tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_created ON public.analytics_events (tenant_id, created_at DESC);

-- site_config: previously singleton per project; now one row per tenant.
-- Keep singleton column for legacy compatibility but add a per-tenant unique key.
CREATE UNIQUE INDEX IF NOT EXISTS site_config_tenant_uniq ON public.site_config (tenant_id) WHERE tenant_id IS NOT NULL;
