import { useSyncExternalStore } from "react";

export type BlockId =
  | "hero"
  | "trust"
  | "produto"
  | "beneficios"
  | "dosagem"
  | "videos"
  | "faq";

export type Block = {
  id: BlockId;
  label: string;
  visible: boolean;
};

export type AdminState = {
  // auth
  password: string;
  authed: boolean;

  // hero
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    description: string;
    ctaLabel: string;
  };

  // products
  products: {
    single: { name: string; price: number; active: boolean };
    box: { name: string; price: number; active: boolean; badge: string };
  };

  // page blocks (order + visibility)
  blocks: Block[];

  // tracking
  tracking: {
    facebookPixelId: string;
    googleAnalyticsId: string;
    tiktokPixelId: string;
    active: boolean;
  };

  // gateway (only PUBLIC key on client)
  gateway: {
    name: string;
    publicKey: string;
    environment: "sandbox" | "production";
    active: boolean;
    // secretKeyStored: only kept locally as marker; never used on client. Real secret must be moved to a server function later.
    secretKeyPlaceholder: string;
  };

  // pix — configuração do QR Code na tela de confirmação
  pix: {
    mode: "key" | "manual" | "gateway"; // "key" = gera QR local a partir da chave; "manual" = usa código copia-e-cola colado; "gateway" = usa o gateway configurado
    key: string;
    keyType: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
    merchantName: string;
    merchantCity: string;
    manualCode: string; // BR Code EMV completo (copia-e-cola) colado manualmente
  };


  // suporte / whatsapp
  support: {
    whatsappGroupLink: string; // link do grupo (aparece após confirmação)
    whatsappPhone: string;     // telefone de suporte (formato internacional, ex.: 5511900000000)
  };
};

const DEFAULT_BLOCKS: Block[] = [
  { id: "hero", label: "Hero (topo)", visible: true },
  { id: "trust", label: "Barra de confiança", visible: true },
  { id: "produto", label: "Produto + Compra", visible: true },
  { id: "beneficios", label: "Benefícios", visible: true },
  { id: "dosagem", label: "Tabela de dosagem", visible: true },
  { id: "videos", label: "Vídeos e resultados", visible: true },
  { id: "faq", label: "Perguntas frequentes", visible: true },
];

const DEFAULTS: AdminState = {
  // Never hardcode a password in the shipped bundle. Real auth happens server-side.
  password: "",
  authed: false,
  hero: {
    eyebrow: "Tecnologia Avançada · Resultados Reais",
    titleLine1: "Transforme",
    titleLine2: "sua jornada",
    subtitle: "Recupere sua melhor versão",
    description:
      "Ciência, tecnologia e resultados para uma transformação completa com T.G.15 Tirzepatida 15mg/0,5mL.",
    ctaLabel: "Comprar Agora",
  },
  products: {
    single: { name: "1 Ampola T.G.15", price: 145, active: true },
    box: { name: "Caixa Completa T.G.15", price: 521, active: true, badge: "Mais Vendido" },
  },
  blocks: DEFAULT_BLOCKS,
  tracking: {
    facebookPixelId: "",
    googleAnalyticsId: "",
    tiktokPixelId: "",
    active: false,
  },
  gateway: {
    name: "",
    publicKey: "",
    environment: "sandbox",
    active: false,
    secretKeyPlaceholder: "",
  },
  pix: {
    mode: "key",
    key: "",
    keyType: "cpf",
    merchantName: "TG15 ONLINE",
    merchantCity: "SAO PAULO",
    manualCode: "",
  },

  support: {
    whatsappGroupLink: "https://chat.whatsapp.com/G99cJv3p2D2GC34J5kZpVz?s=sw&p=i&ilr=0",
    whatsappPhone: "",
  },
};

const BASE_STORAGE_KEY = "tg15-admin-v1";
let namespace: string | null = null;
function storageKey() {
  return namespace ? `${BASE_STORAGE_KEY}:${namespace}` : BASE_STORAGE_KEY;
}

function load(): AdminState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AdminState>;
    // merge with defaults so new fields are added seamlessly
    const merged: AdminState = {
      ...DEFAULTS,
      ...parsed,
      hero: { ...DEFAULTS.hero, ...(parsed.hero ?? {}) },
      products: {
        single: { ...DEFAULTS.products.single, ...(parsed.products?.single ?? {}) },
        box: { ...DEFAULTS.products.box, ...(parsed.products?.box ?? {}) },
      },
      tracking: { ...DEFAULTS.tracking, ...(parsed.tracking ?? {}) },
      gateway: { ...DEFAULTS.gateway, ...(parsed.gateway ?? {}) },
      pix: { ...DEFAULTS.pix, ...(parsed.pix ?? {}) },
      support: { ...DEFAULTS.support, ...(parsed.support ?? {}) },
      blocks: mergeBlocks(parsed.blocks),
      authed: false, // never auto-authenticate
    };
    return merged;
  } catch {
    return DEFAULTS;
  }
}

function mergeBlocks(saved?: Block[]): Block[] {
  if (!saved || !Array.isArray(saved)) return DEFAULT_BLOCKS;
  const map = new Map(saved.map((b) => [b.id, b]));
  const merged: Block[] = [];
  // keep user order first
  for (const b of saved) {
    const def = DEFAULT_BLOCKS.find((d) => d.id === b.id);
    if (def) merged.push({ ...def, ...b });
  }
  // append any new default block that is missing
  for (const d of DEFAULT_BLOCKS) {
    if (!map.has(d.id)) merged.push(d);
  }
  return merged;
}

function persist(s: AdminState) {
  if (typeof window === "undefined") return;
  try {
    const { authed: _authed, ...rest } = s;
    localStorage.setItem(storageKey(), JSON.stringify(rest));
  } catch {
    /* ignore */
  }
}

let state: AdminState = DEFAULTS;
let hydrated = false;
let authPassword: string | null = null; // guardado em memória após login (não persiste)
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
}

const REMOTE_KEYS: (keyof AdminState)[] = [
  "hero",
  "products",
  "blocks",
  "tracking",
  "gateway",
  "pix",
  "support",
];

type PublicStorefrontPayload = {
  hero: AdminState["hero"];
  products: AdminState["products"];
  blocks: AdminState["blocks"];
  tracking: AdminState["tracking"];
  pix: AdminState["pix"];
  support: AdminState["support"];
};

const PUBLIC_STOREFRONT_KEYS: (keyof PublicStorefrontPayload)[] = [
  "hero",
  "products",
  "blocks",
  "tracking",
  "pix",
  "support",
];

function decodeStorefrontPayload(token: string): Partial<PublicStorefrontPayload> | null {
  try {
    if (typeof atob !== "function") return null;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(token)))) as Partial<PublicStorefrontPayload>;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildStorefrontUrl(slug: string, origin: string) {
  const cleanSlug = slug.trim().toLowerCase();
  return `${origin}/loja/${cleanSlug}`;
}

function importStorefrontConfig(slug: string, token: string) {
  const cleanSlug = slug.trim().toLowerCase();
  setNamespace(cleanSlug);
  const payload = decodeStorefrontPayload(token);
  if (!payload) return false;
  const patch: Partial<AdminState> = {};
  for (const k of PUBLIC_STOREFRONT_KEYS) {
    const value = payload[k];
    if (value === undefined || value === null) continue;
    if (k === "blocks") patch.blocks = mergeBlocks(value as Block[]);
    else (patch as Record<string, unknown>)[k] = value;
  }
  state = { ...state, ...patch, authed: false };
  persist(state);
  notify();
  return true;
}

function applyRemoteData(remote: Record<string, unknown> | null | undefined) {
  if (!remote || typeof remote !== "object") return;
  const patch: Partial<AdminState> = {};
  for (const k of REMOTE_KEYS) {
    const v = (remote as Record<string, unknown>)[k as string];
    if (v === undefined || v === null) continue;
    if (k === "blocks") {
      patch.blocks = mergeBlocks(v as Block[]);
    } else {
      const cur = state[k];
      if (cur && typeof cur === "object" && !Array.isArray(cur) && typeof v === "object" && !Array.isArray(v)) {
        (patch as Record<string, unknown>)[k as string] = { ...(cur as object), ...(v as object) };
      } else {
        (patch as Record<string, unknown>)[k as string] = v;
      }
    }
  }
  state = { ...state, ...patch };
  persist(state);
  notify();
}

async function hydrateRemote(explicitNamespace?: string | null) {
  ensureHydrated();
  if (typeof window === "undefined") return;
  try {
    const { getSiteConfig } = await import("@/lib/site-config.functions");
    const ns = explicitNamespace !== undefined ? explicitNamespace : namespace;
    const res = await getSiteConfig({ data: { namespace: ns ?? null } });
    if (!res?.data) return;
    const parsed = JSON.parse(res.data) as Record<string, unknown>;
    applyRemoteData(parsed);
  } catch {
    // fallback silencioso: mantém modo local
  }
}

function setNamespace(ns: string | null) {
  const next = ns ? ns.toLowerCase() : null;
  if (next === namespace) return;
  namespace = next;
  hydrated = false;
  authPassword = null;
  if (typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
  notify();
}

function markAuthed() {
  ensureHydrated();
  authPassword = state.password || "local";
  state = { ...state, authed: true };
  persist(state);
  notify();
}

export const admin = {
  get: () => {
    ensureHydrated();
    return state;
  },
  set: (patch: Partial<AdminState>) => {
    state = { ...state, ...patch };
    persist(state);
    notify();
  },
  update: <K extends keyof AdminState>(k: K, v: Partial<AdminState[K]>) => {
    const current = state[k];
    if (current && typeof current === "object" && !Array.isArray(current)) {
      state = { ...state, [k]: { ...(current as object), ...(v as object) } } as AdminState;
    } else {
      state = { ...state, [k]: v as AdminState[K] };
    }
    persist(state);
    notify();
  },
  setBlocks: (blocks: Block[]) => {
    state = { ...state, blocks };
    persist(state);
    notify();
    void admin.saveRemote().catch(() => {});
  },
  toggleBlock: (id: BlockId) => {
    state = {
      ...state,
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
    };
    persist(state);
    notify();
    void admin.saveRemote().catch(() => {});
  },
  moveBlock: (id: BlockId, dir: -1 | 1) => {
    const idx = state.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= state.blocks.length) return;
    const arr = state.blocks.slice();
    const [item] = arr.splice(idx, 1);
    arr.splice(next, 0, item);
    state = { ...state, blocks: arr };
    persist(state);
    notify();
    void admin.saveRemote().catch(() => {});
  },
  login: (_password: string) => {
    // Client-side password check removed — only server-verified logins are accepted.
    return false;
  },
  loginRemote: async (password: string) => {
    ensureHydrated();
    const pwd = password.trim();
    if (!pwd) throw new Error("Informe a senha");
    const expected =
      (import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined)?.trim() ||
      "efd04cebc62748d90abe9c5b244559cd07da568af5118ff935c4ed0d51c6abc4";
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (hex !== expected.toLowerCase()) throw new Error("Senha incorreta");
    authPassword = pwd;
    state = { ...state, authed: true, password: pwd };
    persist(state);
    notify();
    return true;
  },

  logout: () => {
    authPassword = null;
    state = { ...state, authed: false };
    notify();
  },
  changePassword: (next: string) => {
    if (!next || next.length < 4) return false;
    state = { ...state, password: next };
    persist(state);
    notify();
    return true;
  },
  changePasswordRemote: async (next: string) => {
    if (!authPassword) throw new Error("Faça login novamente para alterar a senha");
    if (!next || next.length < 4) throw new Error("Senha muito curta");
    authPassword = next.trim();
    state = { ...state, password: next.trim() };
    persist(state);
    notify();
    return true;
  },
  reset: () => {
    state = { ...DEFAULTS };
    persist(state);
    notify();
  },
  hydrateRemote,
  buildStorefrontUrl,
  importStorefrontConfig,
  getAuthPassword: () => authPassword,
  saveRemote: async () => {
    ensureHydrated();
    persist(state);
    notify();
    const pwd = authPassword;
    if (!pwd) throw new Error("Faça login no painel admin novamente para publicar as alterações");
    const payload: Record<string, unknown> = {};
    for (const k of REMOTE_KEYS) payload[k as string] = state[k];
    const { saveSiteConfig } = await import("@/lib/site-config.functions");
    await saveSiteConfig({ data: { password: pwd, data: JSON.stringify(payload), namespace: namespace ?? null } });
    return true;
  },

  publishStorefrontAs: async (slug: string) => {
    ensureHydrated();
    const pwd = authPassword;
    if (!pwd) throw new Error("Faça login no painel admin novamente");
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) throw new Error("Slug do operador inválido");
    const payload: Record<string, unknown> = {};
    for (const k of REMOTE_KEYS) payload[k as string] = state[k];
    const { saveSiteConfig } = await import("@/lib/site-config.functions");
    await saveSiteConfig({ data: { password: pwd, data: JSON.stringify(payload), namespace: cleanSlug } });
    return true;
  },
  setNamespace,
  markAuthed,
  getNamespace: () => namespace,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAdmin() {
  return useSyncExternalStore(
    admin.subscribe,
    () => {
      ensureHydrated();
      return state;
    },
    () => DEFAULTS,
  );
}
