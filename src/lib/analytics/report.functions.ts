import { createServerFn } from "@tanstack/react-start";

function requirePassword(password: string) {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) throw new Error("Senha administrativa não configurada no servidor");
  if (password !== expected) throw new Error("Senha incorreta");
}

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
    // Behavior of sessions that completed the Pix copy
    sessions: number;
    avgSectionsViewed: number;
    topSections: Array<{ section: string; sessions: number }>;
    avgTimeToCopyMs: number;
  };
}

export const getAnalyticsReport = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; days?: number }) => input)
  .handler(async ({ data }): Promise<AnalyticsReport> => {
    requirePassword(data.password);
    const days = Math.min(Math.max(data.days ?? 14, 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("analytics_events")
      .select("session_id, event_type, target, path, ms_on_section, meta, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(50000);
    if (error) throw new Error(error.message);
    const events = rows ?? [];

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

    // Funnel step markers (looking at checkout_step targets)
    const stepSessions: Record<string, Set<string>> = {
      identificacao: new Set(),
      endereco: new Set(),
      pagamento: new Set(),
      confirmacao: new Set(),
    };

    for (const ev of events) {
      const sid = ev.session_id;
      const t = ev.event_type;
      const target = ev.target ?? "";
      sessionsSet.add(sid);
      const tsVal = ev.created_at ? new Date(ev.created_at as string).getTime() : Date.now();
      if (!sessionFirstSeen.has(sid)) sessionFirstSeen.set(sid, tsVal);

      if (t === "page_view") sessionsPageView.add(sid);
      if (t === "click" && target) {
        clickCounts.set(target, (clickCounts.get(target) ?? 0) + 1);
      }
      if (t === "section_view" && target) {
        const entry = sectionTotals.get(target) ?? { total: 0, sessions: new Set<string>() };
        entry.total += ev.ms_on_section ?? 0;
        entry.sessions.add(sid);
        sectionTotals.set(target, entry);
        const set = sessionSections.get(sid) ?? new Set<string>();
        set.add(target);
        sessionSections.set(sid, set);
      }
      if (t === "exit" && target) {
        const cur = exitCounts.get(target) ?? { count: 0, totalMs: 0 };
        cur.count += 1;
        cur.totalMs += ev.ms_on_section ?? 0;
        exitCounts.set(target, cur);
      }
      if (t === "checkout_step") {
        if (target in stepSessions) stepSessions[target]!.add(sid);
        if (target === "identificacao") sessionsCheckoutStart.add(sid);
        if (target === "confirmacao") sessionsCheckoutComplete.add(sid);
      }
      if (t === "pix_copied") {
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
    const start = sessionsCheckoutStart.size || 1;
    const funnel = [
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
    ];

    const topClicks = [...clickCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([target, clicks]) => ({ target, clicks }));

    const timeOnSections = [...sectionTotals.entries()]
      .map(([section, v]) => ({
        section,
        avgMs: Math.round(v.total / Math.max(v.sessions.size, 1)),
        sessions: v.sessions.size,
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, 12);

    const dropoffPaths = [...exitCounts.entries()]
      .map(([path, v]) => ({ path, exits: v.count, avgMs: Math.round(v.totalMs / Math.max(v.count, 1)) }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10);

    // Behavior of copiers
    const copierIds = [...sessionsPixCopied];
    const copierSectionCount = copierIds.map((sid) => (sessionSections.get(sid)?.size ?? 0));
    const avgSectionsViewed = copierIds.length
      ? Math.round((copierSectionCount.reduce((a, b) => a + b, 0) / copierIds.length) * 10) / 10
      : 0;
    const copierSectionFreq = new Map<string, number>();
    for (const sid of copierIds) {
      const set = sessionSections.get(sid);
      if (!set) continue;
      for (const s of set) copierSectionFreq.set(s, (copierSectionFreq.get(s) ?? 0) + 1);
    }
    const topSections = [...copierSectionFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([section, sessions]) => ({ section, sessions }));

    const timeToCopyMs = copierIds
      .map((sid) => (sessionCopyAt.get(sid) ?? 0) - (sessionFirstSeen.get(sid) ?? 0))
      .filter((n) => n > 0 && n < 6 * 60 * 60 * 1000);
    const avgTimeToCopyMs = timeToCopyMs.length
      ? Math.round(timeToCopyMs.reduce((a, b) => a + b, 0) / timeToCopyMs.length)
      : 0;

    return {
      windowDays: days,
      totals: {
        sessions: sessionsSet.size,
        pageViews: sessionsPageView.size,
        checkoutStarted: sessionsCheckoutStart.size,
        checkoutCompleted: sessionsCheckoutComplete.size,
        pixCopied: sessionsPixCopied.size,
      },
      funnel,
      topClicks,
      timeOnSections,
      dropoffPaths,
      copiers: {
        sessions: copierIds.length,
        avgSectionsViewed,
        topSections,
        avgTimeToCopyMs,
      },
    };
  });

export const getAnalyticsSuggestions = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; report: AnalyticsReport }) => input)
  .handler(async ({ data }) => {
    requirePassword(data.password);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const prompt = `Você é um especialista em CRO e comportamento de usuários em landing pages de produto único de saúde.
Analise o relatório abaixo (JSON) da landing do T.G.15 e devolva 5 a 8 sugestões OBJETIVAS e ACIONÁVEIS de melhoria.
Foque em: reduzir abandono nas etapas do funil, replicar padrões de quem copiou o código Pix (conversão real), otimizar seções onde as pessoas passam muito ou pouco tempo, e ajustar CTAs pouco clicados.
Retorne APENAS um JSON válido no formato:
{"insights":[{"titulo":"...","evidencia":"...","acao":"..."}]}
Sem markdown, sem texto fora do JSON.

Relatório:
${JSON.stringify(data.report)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é analista de conversão. Sempre responde em JSON puro válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Falha IA (${resp.status}): ${txt.slice(0, 200)}`);
    }
    const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { insights?: Array<{ titulo: string; evidencia: string; acao: string }> } = {};
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { insights: [{ titulo: "Resposta bruta", evidencia: content.slice(0, 400), acao: "Revise o prompt." }] };
    }
    return { insights: parsed.insights ?? [] };
  });
