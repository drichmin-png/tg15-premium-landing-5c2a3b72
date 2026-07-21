
CREATE OR REPLACE FUNCTION public.default_tenant_tg15()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_tg15 UUID;
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT id INTO v_tg15 FROM public.tenants WHERE slug = 'tg15' LIMIT 1;
    NEW.tenant_id := v_tg15;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_default_tenant ON public.orders;
CREATE TRIGGER trg_orders_default_tenant
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.default_tenant_tg15();

DROP TRIGGER IF EXISTS trg_order_items_default_tenant ON public.order_items;
CREATE TRIGGER trg_order_items_default_tenant
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.default_tenant_tg15();

DROP TRIGGER IF EXISTS trg_analytics_default_tenant ON public.analytics_events;
CREATE TRIGGER trg_analytics_default_tenant
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.default_tenant_tg15();
