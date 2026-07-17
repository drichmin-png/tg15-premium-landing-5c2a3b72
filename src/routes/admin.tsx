import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LogOut,
  Package,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { admin, useAdmin, type BlockId } from "@/lib/admin-store";
import {
  listOrdersAdmin,
  updateOrderStatusAdmin,
  type AdminOrder,
} from "@/lib/orders-admin.functions";

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
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const ok = admin.login(pwd);
          if (!ok) setError("Senha incorreta");
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
          className="mt-5 w-full rounded-full gradient-brand py-2.5 text-sm font-bold text-white shadow-md shadow-primary/30"
        >
          Entrar
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Senha inicial: <code className="rounded bg-sand px-1">admin123</code> — altere após o primeiro acesso.
        </p>
      </form>
    </div>
  );
}

type Tab = "pedidos" | "produtos" | "blocos" | "hero" | "tracking" | "gateway" | "seguranca";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("pedidos");
  const s = useAdmin();

  const tabs: { id: Tab; label: string }[] = [
    { id: "pedidos", label: "Pedidos" },
    { id: "produtos", label: "Produtos e Preços" },
    { id: "hero", label: "Hero / Textos" },
    { id: "blocos", label: "Blocos da Página" },
    { id: "tracking", label: "Facebook Pixel & Tracking" },
    { id: "gateway", label: "Gateway de Pagamento" },
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
              href="/"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40"
            >
              Ver site
            </a>
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

        <main className="min-w-0">
          {tab === "pedidos" && <OrdersPanel />}
          {tab === "produtos" && <ProductsPanel s={s} />}
          {tab === "hero" && <HeroPanel s={s} />}
          {tab === "blocos" && <BlocksPanel s={s} />}
          {tab === "tracking" && <TrackingPanel s={s} />}
          {tab === "gateway" && <GatewayPanel s={s} />}
          {tab === "seguranca" && <SecurityPanel />}
        </main>
      </div>
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

  return (
    <div className="grid gap-6">
      <Card title="Alterar senha" description="A senha protege o acesso ao painel neste dispositivo.">
        <div className="grid gap-4 max-w-md">
          <Field label="Nova senha (mín. 4 caracteres)" type="password" value={pwd} onChange={setPwd} />
          <Field label="Confirmar" type="password" value={pwd2} onChange={setPwd2} />
          {msg && (
            <div className={`text-xs ${msg.type === "ok" ? "text-primary-deep" : "text-destructive"}`}>
              {msg.text}
            </div>
          )}
          <button
            onClick={() => {
              if (pwd !== pwd2) return setMsg({ type: "err", text: "As senhas não coincidem." });
              const ok = admin.changePassword(pwd);
              if (!ok) return setMsg({ type: "err", text: "Senha muito curta." });
              setMsg({ type: "ok", text: "Senha atualizada com sucesso." });
              setPwd("");
              setPwd2("");
            }}
            className="inline-flex w-fit items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/30"
          >
            <Save className="h-4 w-4" /> Salvar nova senha
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
  const listOrders = useServerFn(listOrdersAdmin);
  const updateOrder = useServerFn(updateOrderStatusAdmin);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all");
  const password = admin.get().password;

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const rows = await listOrders({ data: { password } });
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
      await updateOrder({ data: { password, orderId: id, payment_status } });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }
  async function setDelivery(id: string, delivery_status_override: string | null) {
    try {
      await updateOrder({ data: { password, orderId: id, delivery_status_override } });
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

