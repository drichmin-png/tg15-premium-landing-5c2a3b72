import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, MessageCircle, QrCode, ShieldCheck, Truck, FileText, Lock, Building2 } from "lucide-react";
import { admin, useAdmin } from "@/lib/admin-store";
import { buildPixPayload } from "@/lib/payments/pix";
import { listAllLocalOrders, type AdminOrder } from "@/lib/local-db";
import { formatBRL } from "@/lib/product";

export const Route = createFileRoute("/pedido/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Concluir pedido #${params.token} — T.G.15` },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    pix: typeof s.pix === "string" ? s.pix : undefined,
  }),
  component: PedidoConclusao,
});

function maskCPF(cpf: string) {
  const c = (cpf || "").replace(/\D/g, "").padEnd(11, "•");
  return `${c.slice(0, 3)}.•••.•••-${c.slice(9, 11)}`;
}
function maskEmail(email: string) {
  if (!email || !email.includes("@")) return email || "—";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
function maskPhone(phone: string) {
  const p = (phone || "").replace(/\D/g, "");
  if (p.length < 4) return phone || "—";
  return `(${p.slice(0, 2)}) •••••-${p.slice(-4)}`;
}

function PedidoConclusao() {
  const { token } = Route.useParams();
  const search = useSearch({ from: "/pedido/$token" });
  const [order, setOrder] = useState<(AdminOrder & { tenant_slug: string }) | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customPix, setCustomPix] = useState<string>(search.pix ?? "");
  const [editing, setEditing] = useState(false);
  const adminState = useAdmin();

  useEffect(() => {
    admin.hydrateRemote();
    const rows = listAllLocalOrders();
    const found = rows.find((o) => o.public_token === token || o.id === token);
    if (!found) {
      setNotFound(true);
      return;
    }
    // aplicar namespace do operador correspondente para carregar as configs certas (pix / whatsapp)
    if (typeof window !== "undefined") {
      if (found.tenant_slug && found.tenant_slug !== "principal") {
        window.sessionStorage.setItem("tg15-active-operator-slug", found.tenant_slug);
        admin.setNamespace(found.tenant_slug);
      } else {
        window.sessionStorage.removeItem("tg15-active-operator-slug");
        admin.setNamespace(null);
      }
    }
    setOrder(found);
  }, [token]);

  const total = order ? order.total_cents / 100 : 0;
  const trackingCode = order ? `BR${order.public_token.replace(/[^A-Z0-9]/gi, "").toUpperCase().padEnd(9, "0").slice(0, 9)}TG` : "";

  const pixPayload = useMemo(() => {
    if (customPix.trim()) return customPix.trim();
    if (adminState.pix.mode === "manual") return adminState.pix.manualCode.trim();
    if (adminState.pix.mode === "key" && adminState.pix.key.trim()) {
      try {
        return buildPixPayload({
          key: adminState.pix.key,
          keyType: adminState.pix.keyType,
          amount: total,
          merchantName: adminState.pix.merchantName || "TG15 ONLINE",
          merchantCity: adminState.pix.merchantCity || "SAO PAULO",
          txid: "***",
        });
      } catch {
        return "";
      }
    }
    return "";
  }, [customPix, adminState.pix, total]);

  const hasPix = pixPayload.length > 0;

  const phone = (adminState.support.whatsappPhone || "").replace(/\D/g, "");
  const waMessage = order
    ? `Olá! Estou finalizando o pedido *#${order.public_token}* no site T.G.15.

*Total:* ${formatBRL(total)}
*Cliente:* ${order.customer_name}
*CPF:* ${order.customer_cpf}
*Telefone:* ${order.customer_phone}

Aguardo a confirmação para concluir a compra.`
    : "";
  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="heading-display text-2xl text-ink">Pedido não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Não localizamos este pedido neste dispositivo. Confirme o link com nossa equipe pelo WhatsApp.
        </p>
        <Link to="/" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary/40">
          Voltar ao site
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-[60vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Carregando pedido…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-sand/50">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-black text-sm">TG</span>
            <div className="text-sm font-bold tracking-tight">T.G.15</div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" /> Conclusão segura
          </div>
        </div>
      </header>

      <main className="container-x py-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-brand text-white shadow-xl shadow-primary/40">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
          <h1 className="heading-display mt-4 text-2xl md:text-3xl text-ink">Concluir pedido</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido <span className="font-semibold text-ink">#{order.public_token}</span>
          </p>
        </div>

        <div className="mt-6 mx-auto max-w-2xl">
          <div className="card-premium overflow-hidden">
            <div className="gradient-brand px-5 py-4 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">Resumo</div>
                <div className="mt-0.5 font-bold">#{order.public_token}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/80">Total</div>
                <div className="font-price text-2xl text-white">{formatBRL(total)}</div>
              </div>
            </div>

            <div className="p-5 space-y-5 text-left">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" /> Cliente
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div><dt className="text-[11px] text-muted-foreground uppercase">Nome</dt><dd className="font-semibold text-ink">{order.customer_name || "—"}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground uppercase">CPF</dt><dd className="font-semibold text-ink">{maskCPF(order.customer_cpf)}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground uppercase">E-mail</dt><dd className="font-semibold text-ink break-all">{maskEmail(order.customer_email)}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground uppercase">Telefone</dt><dd className="font-semibold text-ink">{maskPhone(order.customer_phone)}</dd></div>
                </dl>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Truck className="h-3.5 w-3.5" /> Entrega
                </div>
                <div className="mt-3 text-sm">
                  <div className="font-semibold text-ink">
                    {order.address_street}, {order.address_number}
                    {order.address_complement ? ` — ${order.address_complement}` : ""}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {order.address_district}
                    {order.address_district && (order.address_city || order.address_state) ? " · " : ""}
                    {order.address_city}{order.address_state ? `/${order.address_state}` : ""}
                  </div>
                  {order.address_zip && <div className="text-muted-foreground mt-0.5">CEP: {order.address_zip}</div>}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <FileText className="h-3.5 w-3.5" /> Itens
                </div>
                <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-sand/40">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span><strong>{it.quantity}×</strong> {it.variant_name}</span>
                      <span className="text-muted-foreground">{formatBRL((it.unit_price_cents * it.quantity) / 100)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between px-3 py-2 text-sm font-bold bg-primary/[0.04]">
                    <span>Total</span>
                    <span className="font-price text-lg text-primary">{formatBRL(total)}</span>
                  </li>
                </ul>
              </div>

              <div className="h-px bg-border" />

              {/* Nota de compra + Rastreio */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-sand/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <FileText className="h-3.5 w-3.5" /> Nota de compra
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Nº do pedido</dt><dd className="font-semibold text-ink">#{order.public_token}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Emissão</dt><dd className="font-semibold text-ink">{new Date(order.created_at).toLocaleDateString("pt-BR")}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Valor</dt><dd className="font-price text-ink">{formatBRL(total)}</dd></div>
                  </dl>
                  <p className="mt-2 text-[11px] text-muted-foreground">A nota fiscal eletrônica será enviada por e-mail após a confirmação do pagamento.</p>
                </div>
                <div className="rounded-xl border border-border bg-sand/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Truck className="h-3.5 w-3.5" /> Código de rastreio
                  </div>
                  <div className="mt-3 font-mono text-sm font-bold text-ink break-all">{trackingCode}</div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Ativado assim que o pedido for despachado do centro de distribuição.</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Empresa responsável */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Building2 className="h-3.5 w-3.5" /> Empresa responsável
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm sm:gap-x-6">
                  <div className="col-span-2 flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Razão social</dt><dd className="font-semibold text-ink">TGFarmacêutica Indústria e Comércio LTDA.</dd></div>
                  <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">CNPJ</dt><dd className="font-semibold text-ink">48.327.915/0001-72</dd></div>
                  <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Endereço</dt><dd className="font-semibold text-ink">Av. Paulista, 1106 — Bela Vista, São Paulo/SP</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </div>


        {hasPix && (
          <div className="mt-6 mx-auto max-w-md rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <QrCode className="h-4 w-4 text-primary" /> Pague com Pix — {formatBRL(total)}
              </div>
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {editing ? "Fechar" : "Alterar código"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Escaneie o QR Code no app do banco ou use o código copia-e-cola abaixo.
            </p>

            {editing && (
              <div className="mt-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Novo código Pix (copia-e-cola)
                </label>
                <textarea
                  value={customPix}
                  onChange={(e) => setCustomPix(e.target.value)}
                  placeholder="Cole aqui o novo código Pix"
                  className="mt-1 w-full h-24 rounded-lg border border-border bg-background p-2 text-xs font-mono"
                />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  O código substitui o atual apenas nesta tela.
                </div>
              </div>
            )}

            <div className="mt-4 grid place-items-center">
              <div className="grid h-60 w-60 place-items-center rounded-xl border border-border bg-white p-2" aria-label="QR Code Pix">
                <QRCodeSVG value={pixPayload} size={216} level="M" bgColor="#FFFFFF" fgColor="#111827" />
              </div>
            </div>
            <div className="mt-4">
              <div className="rounded-lg border border-border bg-sand/50 p-3 text-[11px] font-mono break-all text-ink/80 max-h-24 overflow-auto">
                {pixPayload}
              </div>
              <button
                onClick={copyPix}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                <Copy className="h-4 w-4" /> {copied ? "Copiado!" : "Copiar código Pix"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#25D366]/40 hover:brightness-110"
          >
            <MessageCircle className="h-5 w-5" /> Concluir no WhatsApp
          </a>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            Voltar ao site
          </Link>
        </div>
      </main>
    </div>
  );
}
