// Client-side behavioral tracker. Writes directly to public.analytics_events
// using the browser Supabase client (anon key + RLS policy that validates shape).
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "tg15_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min inactivity

type SessionState = { id: string; last: number };

function readSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionState;
    if (!s.id || typeof s.last !== "number") return null;
    if (Date.now() - s.last > SESSION_TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

function writeSession(s: SessionState) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function newId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  } catch { /* fallthrough */ }
  return "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr_placeholder";
  const s = readSession();
  const id = s?.id ?? newId();
  writeSession({ id, last: Date.now() });
  return id;
}

type EventType =
  | "page_view"
  | "section_view"
  | "click"
  | "checkout_step"
  | "pix_copied"
  | "purchase"
  | "exit"
  | "form_field";

interface TrackParams {
  target?: string;
  msOnSection?: number;
  meta?: Record<string, unknown>;
}

const queue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 800);
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const rows = queue.splice(0, queue.length);
  try {
    await supabase.from("analytics_events").insert(rows);
  } catch {
    /* swallow — analytics must never break the app */
  }
}

export function track(event: EventType, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  const row = {
    session_id: getSessionId(),
    event_type: event,
    target: params.target ?? null,
    path: window.location.pathname + window.location.search,
    meta: params.meta ?? {},
    ms_on_section: params.msOnSection ?? null,
    user_agent: navigator.userAgent.slice(0, 250),
    referrer: document.referrer ? document.referrer.slice(0, 200) : null,
  };
  queue.push(row);
  scheduleFlush();
}

// ---- Section visibility tracking ----
const sectionTimers = new WeakMap<Element, { name: string; enteredAt: number }>();
let observer: IntersectionObserver | null = null;

function ensureObserver() {
  if (observer || typeof window === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const rec = sectionTimers.get(entry.target);
        if (!rec) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
          if (rec.enteredAt === 0) rec.enteredAt = Date.now();
        } else if (rec.enteredAt > 0) {
          const ms = Date.now() - rec.enteredAt;
          rec.enteredAt = 0;
          if (ms >= 400) track("section_view", { target: rec.name, msOnSection: ms });
        }
      }
    },
    { threshold: [0, 0.4, 0.8] }
  );
  return observer;
}

export function observeSection(el: Element | null, name: string) {
  if (!el || typeof window === "undefined") return () => {};
  const obs = ensureObserver();
  if (!obs) return () => {};
  sectionTimers.set(el, { name, enteredAt: 0 });
  obs.observe(el);
  return () => {
    const rec = sectionTimers.get(el);
    if (rec && rec.enteredAt > 0) {
      const ms = Date.now() - rec.enteredAt;
      if (ms >= 400) track("section_view", { target: rec.name, msOnSection: ms });
    }
    obs.unobserve(el);
    sectionTimers.delete(el);
  };
}

// ---- Page view + exit ----
let pageStart = 0;
let currentPath = "";

export function trackPageView() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (currentPath && pageStart > 0) {
    track("exit", { target: currentPath, msOnSection: now - pageStart });
  }
  currentPath = window.location.pathname;
  pageStart = now;
  track("page_view", { target: currentPath });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (currentPath && pageStart > 0) {
      track("exit", { target: currentPath, msOnSection: Date.now() - pageStart });
    }
    // Best-effort synchronous flush via sendBeacon
    if (queue.length > 0 && navigator.sendBeacon) {
      // Skipped: supabase-js doesn't expose beacon; events remain in memory queue.
    }
    void flush();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}
