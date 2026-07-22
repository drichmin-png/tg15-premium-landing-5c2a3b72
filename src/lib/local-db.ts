export type LocalEventType =
  | "page_view"
  | "section_view"
  | "click"
  | "checkout_step"
  | "pix_copied"
  | "purchase"
  | "exit"
  | "form_field";

export interface LocalAnalyticsEvent {
  session_id: string;
  event_type: LocalEventType;
  target: string | null;
  path: string;
  meta: Record<string, unknown>;
  ms_on_section: number | null;
  user_agent: string;
  referrer: string | null;
  created_at: string;
}

export type AdminOrder = {
  id: string;
  public_token: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string;
  payment_status: string;
  card_installments: number;
  total_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  delivery_status_override: string | null;
  invoice_url: string | null;
  notes: string;
  items: {
    id: string;
    variant_id: string;
    variant_name: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

export interface AnalyticsReport {
  windowDays: number;
  totals: {
    sessions: number;
    pageViews: number;
    checkoutStarted: number;
    checkoutCompleted: number;
    pixCopied: number;
  };
  funnel: Array<{ step: string; sessions: number; pctFromStart: number }>;
  topClicks: Array<{ target: string; clicks: number }>;
  timeOnSections: Array<{ section: string; avgMs: number; sessions: number }>;
  dropoffPaths: Array<{ path: string; exits: number; avgMs: number }>;
  copiers: {
    sessions: number;
    avgSectionsViewed: number;
    topSections: Array<{ section: string; sessions: number }>;
    avgTimeToCopyMs: number;
  };
}

const ORDERS_KEY_BASE = "tg15-local-orders-v1";
const EVENTS_KEY_BASE = "tg15-local-analytics-v1";
const MAX_EVENTS = 5000;

function currentNamespace(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const active = window.sessionStorage.getItem("tg15-active-operator-slug");
    if (active) return active.toLowerCase();
  } catch {
    /* ignore */
  }
  return null;
}

function ordersKey(ns?: string | null) {
  const n = ns === undefined ? currentNamespace() : ns;
  return n ? `${ORDERS_KEY_BASE}:${n}` : ORDERS_KEY_BASE;
}

function eventsKey(ns?: string | null) {
  const n = ns === undefined ? currentNamespace() : ns;
  return n ? `${EVENTS_KEY_BASE}:${n}` : EVENTS_KEY_BASE;
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function listLocalOrders(ns?: string | null): AdminOrder[] {
  return readJson<AdminOrder[]>(ordersKey(ns), []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Master-only: aggregate orders across every operator namespace present on this device. */
export function listAllLocalOrders(): Array<AdminOrder & { tenant_slug: string }> {
  if (!canUseStorage()) return [];
  const result: Array<AdminOrder & { tenant_slug: string }> = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(ORDERS_KEY_BASE)) continue;
    const slug = key === ORDERS_KEY_BASE ? "" : key.slice(ORDERS_KEY_BASE.length + 1);
    if (!slug) continue;
    const rows = readJson<AdminOrder[]>(key, []);
    for (const row of rows) result.push({ ...row, tenant_slug: slug });
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function saveLocalOrder(order: AdminOrder, ns?: string | null) {
  const key = ordersKey(ns);
  const current = readJson<AdminOrder[]>(key, []);
  const next = [order, ...current.filter((o) => o.id !== order.id && o.public_token !== order.public_token)];
  writeJson(key, next);
}

export function updateLocalOrder(
  orderId: string,
  patch: Partial<Pick<AdminOrder, "payment_status" | "delivery_status_override" | "invoice_url" | "notes">>,
  ns?: string | null,
) {
  const key = ordersKey(ns);
  const next = readJson<AdminOrder[]>(key, []).map((order) => {
    if (order.id !== orderId) return order;
    const paid_at = patch.payment_status === "paid" && !order.paid_at ? new Date().toISOString() : order.paid_at;
    return { ...order, ...patch, paid_at };
  });
  writeJson(key, next);
}

export function addLocalAnalyticsEvents(rows: Omit<LocalAnalyticsEvent, "created_at">[]) {
  const key = eventsKey();
  const current = readJson<LocalAnalyticsEvent[]>(key, []);
  const created = new Date().toISOString();
  const next = [
    ...current,
    ...rows.map((row) => ({ ...row, created_at: created })),
  ].slice(-MAX_EVENTS);
  writeJson(key, next);
}

function listLocalAnalyticsEvents(days: number, allNamespaces = false) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  if (!allNamespaces) {
    return readJson<LocalAnalyticsEvent[]>(eventsKey(), []).filter(
      (ev) => new Date(ev.created_at).getTime() >= since,
    );
  }
  if (!canUseStorage()) return [] as LocalAnalyticsEvent[];
  const all: LocalAnalyticsEvent[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(EVENTS_KEY_BASE)) continue;
    for (const ev of readJson<LocalAnalyticsEvent[]>(key, [])) {
      if (new Date(ev.created_at).getTime() >= since) all.push(ev);
    }
  }
  return all;
}

export function getLocalAnalyticsReport(daysInput = 14, allNamespaces = false): AnalyticsReport {
  const days = Math.min(Math.max(daysInput, 1), 90);
  const events = listLocalAnalyticsEvents(days, allNamespaces);


  const sessionsSet = new Set<string>();
  const sessionsPageView = new Set<string>();
  const sessionsCheckoutStart = new Set<string>();
  const sessionsCheckoutComplete = new Set<string>();
  const sessionsPixCopied = new Set<string>();
  const clickCounts = new Map<string, number>();
  const sectionTotals = new Map<string, { total: number; sessions: Set<string> }>();
  const exitCounts = new Map<string, { count: number; totalMs: number }>();
  const sessionFirstSeen = new Map<string, number>();
  const sessionCopyAt = new Map<string, number>();
  const sessionSections = new Map<string, Set<string>>();

  const stepSessions: Record<string, Set<string>> = {
    identificacao: new Set(),
    endereco: new Set(),
    pagamento: new Set(),
    confirmacao: new Set(),
  };

  for (const ev of events) {
    const sid = ev.session_id;
    const target = ev.target ?? "";
    const tsVal = ev.created_at ? new Date(ev.created_at).getTime() : Date.now();
    sessionsSet.add(sid);
    if (!sessionFirstSeen.has(sid)) sessionFirstSeen.set(sid, tsVal);

    if (ev.event_type === "page_view") sessionsPageView.add(sid);
    if (ev.event_type === "click" && target) {
      clickCounts.set(target, (clickCounts.get(target) ?? 0) + 1);
    }
    if (ev.event_type === "section_view" && target) {
      const entry = sectionTotals.get(target) ?? { total: 0, sessions: new Set<string>() };
      entry.total += ev.ms_on_section ?? 0;
      entry.sessions.add(sid);
      sectionTotals.set(target, entry);
      const set = sessionSections.get(sid) ?? new Set<string>();
      set.add(target);
      sessionSections.set(sid, set);
    }
    if (ev.event_type === "exit" && target) {
      const cur = exitCounts.get(target) ?? { count: 0, totalMs: 0 };
      cur.count += 1;
      cur.totalMs += ev.ms_on_section ?? 0;
      exitCounts.set(target, cur);
    }
    if (ev.event_type === "checkout_step") {
      if (target in stepSessions) stepSessions[target]!.add(sid);
      if (target === "identificacao") sessionsCheckoutStart.add(sid);
      if (target === "confirmacao") sessionsCheckoutComplete.add(sid);
    }
    if (ev.event_type === "pix_copied") {
      sessionsPixCopied.add(sid);
      if (!sessionCopyAt.has(sid)) sessionCopyAt.set(sid, tsVal);
    }
  }

  const funnelOrder = ["identificacao", "endereco", "pagamento", "confirmacao"];
  const funnelLabels: Record<string, string> = {
    identificacao: "1. Identificação",
    endereco: "2. Endereço",
    pagamento: "3. Pagamento",
    confirmacao: "4. Pix gerado",
  };

  const copierIds = [...sessionsPixCopied];
  const copierSectionCount = copierIds.map((sid) => sessionSections.get(sid)?.size ?? 0);
  const avgSectionsViewed = copierIds.length
    ? Math.round((copierSectionCount.reduce((a, b) => a + b, 0) / copierIds.length) * 10) / 10
    : 0;
  const copierSectionFreq = new Map<string, number>();
  for (const sid of copierIds) {
    const set = sessionSections.get(sid);
    if (!set) continue;
    for (const section of set) copierSectionFreq.set(section, (copierSectionFreq.get(section) ?? 0) + 1);
  }
  const timeToCopyMs = copierIds
    .map((sid) => (sessionCopyAt.get(sid) ?? 0) - (sessionFirstSeen.get(sid) ?? 0))
    .filter((n) => n > 0 && n < 6 * 60 * 60 * 1000);

  return {
    windowDays: days,
    totals: {
      sessions: sessionsSet.size,
      pageViews: sessionsPageView.size,
      checkoutStarted: sessionsCheckoutStart.size,
      checkoutCompleted: sessionsCheckoutComplete.size,
      pixCopied: sessionsPixCopied.size,
    },
    funnel: [
      { step: "0. Sessões", sessions: sessionsSet.size, pctFromStart: 100 },
      ...funnelOrder.map((k) => ({
        step: funnelLabels[k]!,
        sessions: stepSessions[k]!.size,
        pctFromStart: Math.round((stepSessions[k]!.size / (sessionsSet.size || 1)) * 100),
      })),
      {
        step: "5. Pix copiado",
        sessions: sessionsPixCopied.size,
        pctFromStart: Math.round((sessionsPixCopied.size / (sessionsSet.size || 1)) * 100),
      },
    ],
    topClicks: [...clickCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([target, clicks]) => ({ target, clicks })),
    timeOnSections: [...sectionTotals.entries()]
      .map(([section, v]) => ({
        section,
        avgMs: Math.round(v.total / Math.max(v.sessions.size, 1)),
        sessions: v.sessions.size,
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, 12),
    dropoffPaths: [...exitCounts.entries()]
      .map(([path, v]) => ({ path, exits: v.count, avgMs: Math.round(v.totalMs / Math.max(v.count, 1)) }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10),
    copiers: {
      sessions: copierIds.length,
      avgSectionsViewed,
      topSections: [...copierSectionFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([section, sessions]) => ({ section, sessions })),
      avgTimeToCopyMs: timeToCopyMs.length
        ? Math.round(timeToCopyMs.reduce((a, b) => a + b, 0) / timeToCopyMs.length)
        : 0,
    },
  };
}

export function getLocalAnalyticsSuggestions(report: AnalyticsReport) {
  const weakestStep = report.funnel
    .filter((step) => !step.step.startsWith("0."))
    .sort((a, b) => a.pctFromStart - b.pctFromStart)[0];
  const topClick = report.topClicks[0];
  const longestSection = report.timeOnSections[0];

  return [
    {
      titulo: "Reforce a etapa com maior abandono",
      evidencia: weakestStep
        ? `${weakestStep.step} está com ${weakestStep.pctFromStart}% das sessões.`
        : "Ainda há poucos dados no funil.",
      acao: "Simplifique essa etapa, reduza campos e destaque o botão principal antes da dobra.",
    },
    {
      titulo: "Use os cliques como prioridade visual",
      evidencia: topClick ? `O item mais clicado é “${topClick.target}” com ${topClick.clicks} cliques.` : "Sem cliques suficientes no período.",
      acao: "Deixe CTAs parecidos próximos das seções com maior atenção do visitante.",
    },
    {
      titulo: "Aproveite as seções de maior permanência",
      evidencia: longestSection
        ? `A seção “${longestSection.section}” tem média de ${(longestSection.avgMs / 1000).toFixed(1)}s.`
        : "Ainda sem tempo médio registrado por seção.",
      acao: "Insira prova social, garantia e botão de compra perto dessa seção para converter melhor.",
    },
  ];
}