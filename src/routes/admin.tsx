import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Package,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { admin, useAdmin, type BlockId } from "@/lib/admin-store";
import { buildPixPayload, pixQrImageUrl } from "@/lib/payments/pix";
import {
  type AdminOrder,
  listLocalOrders,
  updateLocalOrder,
  getLocalAnalyticsReport,
  getLocalAnalyticsSuggestions,
  type AnalyticsReport,
} from "@/lib/local-db";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});


function AdminPage() {
  const state = useAdmin();
  if (!state.authed) return <LoginScreen />;
  return <Dashboard />;
}

function LoginScreen() {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setLoading(true);
          try {
            await admin.loginRemote(pwd);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Senha incorreta";
            setError(msg);
          } finally {
            setLoading(false);
          }
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg gradient-brand text-white font-black shadow-md shadow-primary/30">
            TG
          </span>
          <div>
            <div className="text-lg font-bold text-ink">Painel T.G.15</div>
            <div className="text-xs text-muted-foreground">Acesso restrito</div>
          </div>
        </div>
        <label className="mt-6 block text-sm font-semibold text-ink">Senha</label>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="Digite sua senha"
          autoFocus
        />
        {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-full gradient-brand py-2.5 text-sm font-bold text-white shadow-md shadow-primary/30 disabled:opacity-70"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Acesso local, sem depender de configuração de servidor.
          </p>
      </form>
    </div>
  );
}

type Tab = "pedidos" | "relatorio" | "produtos" | "blocos" | "hero" | "tracking" | "gateway" | "pix" | "suporte" | "seguranca";

export function Dashboard() {
  const [tab, setTab] = useState<Tab>("pedidos");
  const s = useAdmin();

  const tabs: { id: Tab; label: string }[] = [
    { id: "pedidos", label: "Pedidos" },
    { id: "relatorio", label: "Relatório & IA" },
    { id: "produtos", label: "Produtos e Preços" },
    { id: "hero", label: "Hero / Textos" },
    { id: "blocos", label: "Blocos da Página" },
    { id: "tracking", label: "Facebook Pixel & Tracking" },
    { id: "pix", label: "Pagamento Pix" },
    { id: "gateway", label: "Gateway de Pagamento" },
    { id: "suporte", label: "Suporte / WhatsApp" },
    { id: "seguranca", label: "Segurança" },
  ];


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-black text-sm">
              TG
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink">Painel T.G.15</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Administração
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/master/login"
              className="rounded-full border border-primary/40 bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary/20"
            >
              Painel Master (Operadores)
            </a>
            <a
              href="/"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40"
            >
              Ver site
            </a>
            <SaveButton />
            <button
              onClick={() => admin.logout()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row overflow-x-auto lg:flex-col gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                tab === t.id
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-foreground/70 hover:bg-sand"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 space-y-6">
          <ShareSiteLink />
          {tab === "pedidos" && <OrdersPanel />}
          {tab === "relatorio" && <AnalyticsPanel />}
          {tab === "produtos" && <ProductsPanel s={s} />}
          {tab === "hero" && <HeroPanel s={s} />}
          {tab === "blocos" && <BlocksPanel s={s} />}
          {tab === "tracking" && <TrackingPanel s={s} />}
          {tab === "pix" && <PixPanel s={s} />}
          {tab === "gateway" && <GatewayPanel s={s} />}
          {tab === "suporte" && <SupportPanel s={s} />}
          {tab === "seguranca" && <SecurityPanel />}
        </main>

      </div>
    </div>
  );
}

function ShareSiteLink() {
  const state = useAdmin();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const namespace = admin.getNamespace();
  const isOperatorLink = Boolean(namespace);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentNamespace = admin.getNamespace();
    setUrl(currentNamespace ? admin.buildStorefrontUrl(currentNamespace, window.location.origin) : window.location.origin);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  const waMsg = encodeURIComponent(
    `Confira o T.G.15 — Tirzepatida 15mg/0,5mL 💉\nCompre pelo meu link: ${url}`
  );
  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-orange-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">{isOperatorLink ? "Link próprio do operador" : "Link oficial do site"}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isOperatorLink
              ? "Compartilhe este link exclusivo com clientes. Ele abre a loja deste operador com as configurações atuais."
              : "Compartilhe este link com clientes — sempre reflete as últimas alterações salvas no painel."}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs text-ink"
            />
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <a
                href={`https://wa.me/?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <Share2 className="h-3.5 w-3.5" /> WhatsApp
              </a>
              <a
                href={url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-sand"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SaveButton() {

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string>("");
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={async () => {
          setError("");
          setStatus("saving");
          try {
            await admin.saveRemote();
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2000);
          } catch (err) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Erro ao salvar");
            setTimeout(() => setStatus("idle"), 4000);
          }
        }}
        disabled={status === "saving"}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-70 ${
          status === "saved"
            ? "bg-emerald-600 shadow-emerald-600/30"
            : status === "error"
              ? "bg-destructive shadow-destructive/30"
              : "gradient-brand shadow-primary/30"
        }`}
      >
        <Save className="h-3.5 w-3.5" />
        {status === "saving"
          ? "Salvando..."
          : status === "saved"
            ? "Salvo neste aparelho"
            : status === "error"
              ? "Erro — tentar novamente"
              : "Salvar alterações"}
      </button>
      {status === "error" && error && (
        <span className="text-[10px] text-destructive max-w-[220px] text-right">{error}</span>
      )}
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  prefix,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 flex items-center rounded-lg border border-border bg-background focus-within:border-primary">
        {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <span
        className={`grid h-6 w-11 items-center rounded-full p-0.5 transition ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </button>
  );
}

/* ------------ PANELS ------------ */

function ProductsPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <div className="grid gap-6">
      <Card title="1 Ampola (avulsa)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={s.products.single.name} onChange={(v) => admin.update("products", { single: { ...s.products.single, name: v } })} />
          <Field
            label="Preço (R$)"
            type="number"
            value={s.products.single.price}
            onChange={(v) => admin.update("products", { single: { ...s.products.single, price: Number(v) || 0 } })}
          />
          <div className="md:col-span-2">
            <Toggle
              checked={s.products.single.active}
              onChange={(v) => admin.update("products", { single: { ...s.products.single, active: v } })}
              label="Exibir esta opção na página"
            />
          </div>
        </div>
      </Card>

      <Card title="Caixa Completa (4 ampolas)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={s.products.box.name} onChange={(v) => admin.update("products", { box: { ...s.products.box, name: v } })} />
          <Field
            label="Preço (R$)"
            type="number"
            value={s.products.box.price}
            onChange={(v) => admin.update("products", { box: { ...s.products.box, price: Number(v) || 0 } })}
          />
          <Field label="Selo/Badge" value={s.products.box.badge} onChange={(v) => admin.update("products", { box: { ...s.products.box, badge: v } })} />
          <div className="md:col-span-2">
            <Toggle
              checked={s.products.box.active}
              onChange={(v) => admin.update("products", { box: { ...s.products.box, active: v } })}
              label="Exibir esta opção na página"
            />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-primary-deep">
          A economia mostrada na página é calculada automaticamente: (preço avulso × 4) − preço da caixa.
        </div>
      </Card>
    </div>
  );
}

function HeroPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <Card title="Textos do Hero" description="Editam a primeira dobra da página.">
      <div className="grid gap-4">
        <Field label="Selo (topo)" value={s.hero.eyebrow} onChange={(v) => admin.update("hero", { eyebrow: v })} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Título — Linha 1" value={s.hero.titleLine1} onChange={(v) => admin.update("hero", { titleLine1: v })} />
          <Field label="Título — Linha 2 (destaque)" value={s.hero.titleLine2} onChange={(v) => admin.update("hero", { titleLine2: v })} />
        </div>
        <Field label="Subtítulo" value={s.hero.subtitle} onChange={(v) => admin.update("hero", { subtitle: v })} />
        <Textarea label="Descrição" value={s.hero.description} onChange={(v) => admin.update("hero", { description: v })} />
        <Field label="Texto do botão" value={s.hero.ctaLabel} onChange={(v) => admin.update("hero", { ctaLabel: v })} />
      </div>
    </Card>
  );
}

function BlocksPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <Card
      title="Ordem e visibilidade dos blocos"
      description="Reordene com as setas e oculte blocos que não quer mostrar. A página pública reflete essa ordem imediatamente."
    >
      <ul className="grid gap-2">
        {s.blocks.map((b, i) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-sand text-xs font-bold text-ink">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{b.label}</div>
                <div className="text-[11px] text-muted-foreground">{b.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => admin.moveBlock(b.id as BlockId, -1)}
                disabled={i === 0}
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card disabled:opacity-40 hover:border-primary/40"
                aria-label="Subir"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => admin.moveBlock(b.id as BlockId, 1)}
                disabled={i === s.blocks.length - 1}
                className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card disabled:opacity-40 hover:border-primary/40"
                aria-label="Descer"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => admin.toggleBlock(b.id as BlockId)}
                className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  b.visible ? "bg-primary/10 text-primary-deep" : "bg-sand text-muted-foreground"
                }`}
              >
                {b.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {b.visible ? "Visível" : "Oculto"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TrackingPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <div className="grid gap-6">
      <Card
        title="Facebook Pixel"
        description="O Pixel é injetado no site quando o rastreamento está ativo. O Access Token da Conversions API (CAPI) só poderá ser configurado com segurança quando ativarmos o backend."
      >
        <div className="grid gap-4">
          <Field
            label="Pixel ID"
            value={s.tracking.facebookPixelId}
            onChange={(v) => admin.update("tracking", { facebookPixelId: v })}
            placeholder="123456789012345"
          />
          <Toggle
            checked={s.tracking.active}
            onChange={(v) => admin.update("tracking", { active: v })}
            label="Ativar rastreamento no site"
          />
        </div>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary-deep">
          <strong>Trocar de campanha:</strong> mude o Pixel ID aqui e salve. Nenhum deploy é necessário.
        </div>
      </Card>

      <Card title="Outras plataformas (opcional)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Google Analytics (GA4) ID"
            value={s.tracking.googleAnalyticsId}
            onChange={(v) => admin.update("tracking", { googleAnalyticsId: v })}
            placeholder="G-XXXXXXX"
          />
          <Field
            label="TikTok Pixel ID"
            value={s.tracking.tiktokPixelId}
            onChange={(v) => admin.update("tracking", { tiktokPixelId: v })}
            placeholder="CXXXXXXXXXXXXXXX"
          />
        </div>
      </Card>
    </div>
  );
}

function GatewayPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <Card
      title="Gateway de Pagamento"
      description="Apenas a chave pública fica armazenada aqui. A secret_key e o webhook exigem backend (próxima etapa) para não ficarem expostos no navegador."
    >
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome do gateway" value={s.gateway.name} onChange={(v) => admin.update("gateway", { name: v })} placeholder="Pagar.me, Mercado Pago, custom..." />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambiente</span>
            <select
              value={s.gateway.environment}
              onChange={(e) => admin.update("gateway", { environment: e.target.value as "sandbox" | "production" })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="sandbox">Sandbox / Teste</option>
              <option value="production">Produção</option>
            </select>
          </label>
        </div>
        <Field label="Public Key" value={s.gateway.publicKey} onChange={(v) => admin.update("gateway", { publicKey: v })} placeholder="pk_..." />
        <Toggle
          checked={s.gateway.active}
          onChange={(v) => admin.update("gateway", { active: v })}
          label="Gateway ativo"
        />

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-900">
          <strong>Secret Key & Webhook:</strong> serão configurados via Edge Function quando ativarmos o Lovable Cloud.
          Manter secret_key no front-end é inseguro — qualquer visitante do site conseguiria ler no bundle.
        </div>
      </div>
    </Card>
  );
}

function SecurityPanel() {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="grid gap-6">
      <Card title="Alterar senha" description="A senha protege o acesso ao painel em todos os dispositivos.">
        <div className="grid gap-4 max-w-md">
          <Field label="Nova senha (mín. 4 caracteres)" type="password" value={pwd} onChange={setPwd} />
          <Field label="Confirmar" type="password" value={pwd2} onChange={setPwd2} />
          {msg && (
            <div className={`text-xs ${msg.type === "ok" ? "text-primary-deep" : "text-destructive"}`}>
              {msg.text}
            </div>
          )}
          <button
            disabled={saving}
            onClick={async () => {
              if (pwd !== pwd2) return setMsg({ type: "err", text: "As senhas não coincidem." });
              if (!pwd || pwd.length < 4) return setMsg({ type: "err", text: "Senha muito curta." });
              setSaving(true);
              setMsg(null);
              try {
                await admin.changePasswordRemote(pwd);
                setMsg({ type: "ok", text: "Senha atualizada com sucesso em produção." });
                setPwd("");
                setPwd2("");
              } catch (err) {
                const text = err instanceof Error ? err.message : "Não foi possível alterar a senha.";
                setMsg({ type: "err", text });
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex w-fit items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/30 disabled:opacity-70"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </Card>

      <Card
        title="Restaurar configurações"
        description="Volta o painel para os valores iniciais (preços, textos, blocos)."
      >
        <button
          onClick={() => {
            if (confirm("Tem certeza? Isto reverte todas as configurações.")) admin.reset();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-5 py-2.5 text-sm font-bold text-destructive"
        >
          <RotateCcw className="h-4 w-4" /> Restaurar padrões
        </button>
      </Card>

      <Card title="Próxima etapa">
        <div className="flex items-start gap-3 text-sm text-foreground/80">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            Para <strong>chaves secretas</strong> (secret_key do gateway, Facebook CAPI Access Token) e o
            <strong> assistente de IA</strong> do painel, ative o Lovable Cloud. Enquanto isso, tudo o que
            está neste painel já funciona salvo localmente neste dispositivo.
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------ ORDERS PANEL ------------ */

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}
const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Estornado",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-700 border-red-500/30",
  refunded: "bg-slate-500/10 text-slate-700 border-slate-500/30",
};

function OrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all");

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const rows = listLocalOrders();
      setOrders(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, payment_status: string) {
    try {
      updateLocalOrder(id, { payment_status });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }
  async function setDelivery(id: string, delivery_status_override: string | null) {
    try {
      updateLocalOrder(id, { delivery_status_override });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  const filtered = orders.filter((o) => filter === "all" || o.payment_status === filter);
  const totalPaidCents = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + o.total_cents, 0);

  return (
    <div className="grid gap-6">
      <Card
        title="Pedidos"
        description="Todos os pedidos recebidos, com dados do cliente, endereço de entrega e itens."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "paid", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-foreground/70 hover:border-primary/40"
                }`}
              >
                {f === "all" ? "Todos" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              <strong className="text-ink">{orders.length}</strong> pedidos ·{" "}
              <strong className="text-primary">{formatBRL(totalPaidCents)}</strong> pagos
            </div>
            <button
              onClick={reload}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        {loading && orders.length === 0 && (
          <div className="mt-6 text-sm text-muted-foreground">Carregando pedidos…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-6 grid place-items-center gap-2 rounded-lg border border-dashed border-border bg-background p-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-semibold text-ink">Nenhum pedido ainda</div>
            <div className="text-xs text-muted-foreground">
              Assim que um cliente finalizar a compra, ele aparece aqui.
            </div>
          </div>
        )}

        <ul className="mt-4 grid gap-3">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <li key={o.id} className="rounded-xl border border-border bg-background">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="grid w-full grid-cols-[1fr_auto] gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{o.customer_name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_BADGE[o.payment_status] ?? "bg-sand text-ink border-border"
                        }`}
                      >
                        {STATUS_LABEL[o.payment_status] ?? o.payment_status}
                      </span>
                      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground/70">
                        {PAYMENT_LABEL[o.payment_method] ?? o.payment_method}
                        {o.payment_method === "card" && o.card_installments > 1
                          ? ` ${o.card_installments}x`
                          : ""}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(o.created_at)} · {o.customer_email} · {o.customer_phone}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">
                      {o.address_street}, {o.address_number}
                      {o.address_complement ? ` — ${o.address_complement}` : ""} · {o.address_city}/
                      {o.address_state}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-ink">
                      {formatBRL(o.total_cents)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      #{o.public_token.slice(0, 8)}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Cliente
                        </div>
                        <div className="mt-1.5 text-sm text-ink space-y-0.5">
                          <div><strong>Nome:</strong> {o.customer_name}</div>
                          <div><strong>Email:</strong> {o.customer_email}</div>
                          <div><strong>Telefone:</strong> {o.customer_phone}</div>
                          <div><strong>CPF:</strong> {o.customer_cpf}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Endereço de entrega
                        </div>
                        <div className="mt-1.5 text-sm text-ink space-y-0.5">
                          <div>{o.address_street}, {o.address_number}</div>
                          {o.address_complement && <div>Compl.: {o.address_complement}</div>}
                          <div>Bairro: {o.address_district}</div>
                          <div>{o.address_city} / {o.address_state}</div>
                          <div>CEP: {o.address_zip}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Itens do pedido
                      </div>
                      <ul className="mt-1.5 divide-y divide-border rounded-lg border border-border bg-card">
                        {o.items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span>
                              <strong>{it.quantity}×</strong> {it.variant_name}
                            </span>
                            <span className="text-muted-foreground">
                              {formatBRL(it.unit_price_cents * it.quantity)}
                            </span>
                          </li>
                        ))}
                        <li className="flex items-center justify-between bg-sand/50 px-3 py-2 text-sm font-bold">
                          <span>Total</span>
                          <span className="text-primary">{formatBRL(o.total_cents)}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Status de pagamento
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(["pending", "paid", "cancelled", "refunded"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => setStatus(o.id, st)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                o.payment_status === st
                                  ? STATUS_BADGE[st]
                                  : "border-border bg-card text-foreground/70 hover:border-primary/40"
                              }`}
                            >
                              {STATUS_LABEL[st]}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Pago em: {formatDate(o.paid_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Status de entrega (manual)
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[
                            { v: null, l: "Automático" },
                            { v: "preparing", l: "Preparando" },
                            { v: "shipped", l: "Enviado" },
                            { v: "delivered", l: "Entregue" },
                          ].map((opt) => (
                            <button
                              key={String(opt.v)}
                              onClick={() => setDelivery(o.id, opt.v)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                o.delivery_status_override === opt.v
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-card text-foreground/70 hover:border-primary/40"
                              }`}
                            >
                              {opt.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      ID: {o.id} · Token público: {o.public_token}
                      {o.invoice_url && (
                        <>
                          {" · "}
                          <a
                            href={o.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            Nota fiscal
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ------------ PIX PANEL ------------ */

function PixPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <div className="grid gap-6">
      <Card
        title="Modo de geração do QR Code Pix"
        description="Escolha se o QR Code é gerado automaticamente a partir de uma chave Pix, ou delegado ao gateway configurado."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              { id: "key", title: "Chave Pix (automático)", desc: "Gera o QR Code na hora usando a chave abaixo. Ideal para receber direto na sua conta." },
              { id: "gateway", title: "Gateway", desc: "O QR Code será gerado pelo gateway de pagamento (aba Gateway)." },
            ] as const
          ).map((opt) => {
            const selected = s.pix.mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => admin.update("pix", { mode: opt.id })}
                className={`text-left rounded-2xl border-2 p-4 transition ${
                  selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-ink">{opt.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {s.pix.mode === "key" && (
        <Card
          title="Dados da chave Pix"
          description="Usados para gerar o QR Code e o código copia-e-cola na confirmação do pedido."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de chave</span>
              <select
                value={s.pix.keyType}
                onChange={(e) => admin.update("pix", { keyType: e.target.value as typeof s.pix.keyType })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Aleatória (EVP)</option>
              </select>
            </label>
            <Field
              label="Chave Pix"
              value={s.pix.key}
              onChange={(v) => admin.update("pix", { key: v })}
              placeholder="ex.: 000.000.000-00 ou email@dominio.com"
            />
            <Field
              label="Nome do recebedor"
              value={s.pix.merchantName}
              onChange={(v) => admin.update("pix", { merchantName: v })}
              placeholder="Máx. 25 caracteres"
            />
            <Field
              label="Cidade do recebedor"
              value={s.pix.merchantCity}
              onChange={(v) => admin.update("pix", { merchantCity: v })}
              placeholder="Máx. 15 caracteres, sem acento"
            />
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-primary-deep">
            O QR Code é gerado no padrão Pix do Banco Central (BR Code EMV). Funciona em qualquer app bancário.
          </div>
          <PixPreview s={s} />
        </Card>
      )}
    </div>
  );
}

function PixPreview({ s }: { s: ReturnType<typeof useAdmin> }) {
  const key = s.pix.key.trim();
  if (!key) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        Preencha a chave Pix acima para visualizar o QR Code de teste.
      </div>
    );
  }
  let payload = "";
  let error: string | null = null;
  try {
    payload = buildPixPayload({
      key,
      amount: 1.0,
      merchantName: s.pix.merchantName || "RECEBEDOR",
      merchantCity: s.pix.merchantCity || "SAO PAULO",
      txid: "TESTE",
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Erro ao gerar payload";
  }
  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
        {error}
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr] items-start rounded-xl border border-border p-4 bg-muted/20">
      <img
        src={pixQrImageUrl(payload, 220)}
        alt="QR Code Pix (preview R$ 1,00)"
        className="w-[220px] h-[220px] rounded-lg bg-white p-2"
      />
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preview de teste (R$ 1,00)
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Este é apenas um teste visual. Na tela do cliente, o valor será o total do pedido.
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-ink mb-1">Código copia-e-cola</div>
          <textarea
            readOnly
            value={payload}
            className="w-full h-24 text-[11px] font-mono rounded-lg border border-border bg-background p-2 outline-none"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(payload)}
            className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
          >
            Copiar código
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------ SUPPORT PANEL ------------ */

function SupportPanel({ s }: { s: ReturnType<typeof useAdmin> }) {
  return (
    <Card
      title="Suporte e grupo de clientes"
      description="O botão 'Entrar no grupo' aparece na tela de confirmação após o pedido."
    >
      <div className="grid gap-4">
        <Field
          label="Link do grupo WhatsApp"
          value={s.support.whatsappGroupLink}
          onChange={(v) => admin.update("support", { whatsappGroupLink: v })}
          placeholder="https://chat.whatsapp.com/..."
        />
        <Field
          label="Telefone de suporte (WhatsApp)"
          value={s.support.whatsappPhone}
          onChange={(v) => admin.update("support", { whatsappPhone: v })}
          placeholder="5511900000000 (DDI + DDD, só números)"
        />
        <div className="rounded-lg bg-primary/5 p-3 text-xs text-primary-deep">
          Deixe o link do grupo em branco para ocultar o botão da tela de confirmação.
        </div>
      </div>
    </Card>
  );
}



// ============================================================
// Relatório comportamental + IA
// ============================================================
function AnalyticsPanel() {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Array<{ titulo: string; evidencia: string; acao: string }> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = getLocalAnalyticsReport(days);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const askAI = async () => {
    if (!report) return;
    setAiLoading(true);
    setInsights(null);
    try {
      setInsights(getLocalAnalyticsSuggestions(report));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-ink">Relatório de comportamento</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold hover:border-primary/40 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {/^\s*<!?doctype|^\s*<html/i.test(error)
            ? "Não foi possível carregar o relatório agora. Toque em Atualizar para tentar de novo."
            : error.length > 240
              ? error.slice(0, 240) + "…"
              : error}
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard label="Sessões" value={report.totals.sessions} />
            <KpiCard label="Pageviews" value={report.totals.pageViews} />
            <KpiCard label="Iniciaram checkout" value={report.totals.checkoutStarted} />
            <KpiCard label="Chegaram no Pix" value={report.totals.checkoutCompleted} />
            <KpiCard label="Copiaram Pix" value={report.totals.pixCopied} highlight />
          </div>

          <Card title="Funil de conversão">
            <div className="space-y-2">
              {report.funnel.map((f) => (
                <div key={f.step} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-xs font-semibold text-ink">{f.step}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full gradient-brand"
                      style={{ width: `${Math.max(2, f.pctFromStart)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-bold text-ink">
                      <span>{f.sessions} sessões</span>
                      <span>{f.pctFromStart}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Cliques mais frequentes">
              {report.topClicks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem cliques registrados no período.</p>
              ) : (
                <ul className="space-y-1.5">
                  {report.topClicks.map((c) => (
                    <li key={c.target} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-ink">{c.target}</span>
                      <span className="rounded bg-sand px-2 py-0.5 font-bold text-primary">{c.clicks}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Tempo médio por seção">
              {report.timeOnSections.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem dados de tempo por seção.</p>
              ) : (
                <ul className="space-y-1.5">
                  {report.timeOnSections.map((t) => (
                    <li key={t.section} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-ink">{t.section}</span>
                      <span className="text-muted-foreground">
                        {(t.avgMs / 1000).toFixed(1)}s · {t.sessions} sess.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Onde os visitantes abandonam (páginas de saída)">
            {report.dropoffPaths.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados suficientes.</p>
            ) : (
              <ul className="space-y-1.5">
                {report.dropoffPaths.map((d) => (
                  <li key={d.path} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-ink">{d.path}</span>
                    <span className="text-muted-foreground">
                      {d.exits} saídas · média {(d.avgMs / 1000).toFixed(1)}s
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Perfil de quem copiou o código Pix (converteu)">
            <div className="grid gap-3 md:grid-cols-3">
              <KpiCard label="Sessões que copiaram" value={report.copiers.sessions} />
              <KpiCard label="Seções vistas (média)" value={report.copiers.avgSectionsViewed} />
              <KpiCard
                label="Tempo até copiar"
                value={report.copiers.avgTimeToCopyMs ? `${Math.round(report.copiers.avgTimeToCopyMs / 1000)}s` : "—"}
              />
            </div>
            {report.copiers.topSections.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Seções mais visitadas por eles
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.copiers.topSections.map((s) => (
                    <span key={s.section} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-deep">
                      {s.section} · {s.sessions}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Sugestões da IA">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Gera recomendações de melhoria baseadas no comportamento dos visitantes — priorizando o que
                converte (quem copia o Pix).
              </p>
              <button
                onClick={askAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/20 disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? "Analisando..." : "Analisar com IA"}
              </button>
            </div>
            {insights && insights.length > 0 && (
              <div className="space-y-2">
                {insights.map((it, i) => (
                  <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="text-sm font-bold text-ink">{it.titulo}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-ink">Evidência: </span>
                      {it.evidencia}
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="font-semibold text-primary-deep">Ação: </span>
                      {it.acao}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-white"}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-black ${highlight ? "text-primary" : "text-ink"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
        {value}
      </div>
    </div>
  );
}
