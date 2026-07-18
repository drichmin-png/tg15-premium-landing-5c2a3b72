import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, CreditCard, Lock, QrCode, ShieldCheck, Truck, FileText, MessageCircle } from "lucide-react";
import { cart, useCart } from "@/lib/cart-store";
import { BOX_SAVINGS, formatBRL, variants } from "@/lib/product";
import { trackLead, trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } from "@/lib/tracking/metaPixel";
import { cleanCPF, formatCPF, isValidCPF } from "@/lib/validation/cpf";
import { cleanCEP, formatCEP, lookupCEP } from "@/lib/validation/cep";
import { installmentOptions } from "@/lib/payments/installments";
import { useAdmin } from "@/lib/admin-store";
import { buildPixPayload, pixQrImageUrl } from "@/lib/payments/pix";


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — T.G.15" },
      { name: "description", content: "Finalize sua compra do T.G.15 com segurança." },
    ],
  }),
  component: Checkout,
});

const steps = [
  { id: 1, label: "Dados" },
  { id: 2, label: "Endereço" },
  { id: 3, label: "Frete" },
  { id: 4, label: "Pagamento" },
  { id: 5, label: "Confirmação" },
];

function Checkout() {
  const state = useCart();
  const nav = useNavigate();
  const { products } = useAdmin();
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState("TG-XXXXXX");
  useEffect(() => { setOrderId("TG-" + Math.random().toString(36).slice(2, 8).toUpperCase()); }, []);

  const v = variants[state.variant];
  const unitPrice = state.variant === "box" ? products.box.price : products.single.price;
  const subtotal = unitPrice * state.qty;
  const shippingCost = state.shipping === "express" ? 39.9 : state.shipping === "standard" ? 19.9 : 0;
  const total = subtotal + shippingCost;
  const boxSavingsUnit = Math.max(0, products.single.price * 4 - products.box.price);
  const savings = state.variant === "box" ? boxSavingsUnit * state.qty : 0;

  // InitiateCheckout — apenas ao acessar /checkout (uma vez por sessão de página)
  useEffect(() => {
    trackInitiateCheckout({
      value: subtotal,
      num_items: state.qty,
      content_ids: [state.variant],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-sand/50">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-black text-sm">TG</span>
            <div className="text-sm font-bold tracking-tight">T.G.15</div>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" /> Checkout seguro
          </div>
        </div>
      </header>

      <div className="container-x py-10">
        <button onClick={() => (step === 1 ? nav({ to: "/" }) : prev())} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? "Voltar à loja" : "Etapa anterior"}
        </button>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const active = step >= s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex flex-1 items-center gap-2">
                  <div className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition ${
                    done ? "gradient-brand text-white" : active ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <div className="hidden sm:block text-xs font-semibold text-foreground/80">{s.label}</div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 rounded-full overflow-hidden bg-border">
                      <div className={`h-full transition-all ${step > s.id ? "w-full gradient-brand" : "w-0"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div className="card-premium p-6 md:p-8">
            {step === 1 && <StepCustomer state={state} onNext={next} />}
            {step === 2 && <StepAddress state={state} onNext={next} />}
            {step === 3 && <StepShipping state={state} onNext={next} />}
            {step === 4 && <StepPayment state={state} onNext={next} total={total} />}
            {step === 5 && <StepConfirm orderId={orderId} total={total} state={state} />}

          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="card-premium overflow-hidden">
              <div className="gradient-brand px-6 py-4 text-white">
                <div className="eyebrow text-white/80">Resumo do Pedido</div>
                <div className="mt-1 font-bold">#{orderId}</div>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand">
                    <img src={v.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm">{v.name}</div>
                    <div className="text-xs text-muted-foreground">15mg/0,5mL · {v.units} {v.units > 1 ? "ampolas" : "ampola"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Qtd: {state.qty}</div>
                  </div>
                  <div className="text-sm font-bold text-ink whitespace-nowrap">{formatBRL(subtotal)}</div>
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  <Row label="Subtotal" value={formatBRL(subtotal)} />
                  <Row
                    label="Frete"
                    value={shippingCost ? formatBRL(shippingCost) : "—"}
                    muted={!shippingCost}
                  />
                  {savings > 0 && <Row label="Economia" value={"− " + formatBRL(savings)} accent />}
                </div>

                <div className="mt-4 border-t border-border pt-4 flex items-baseline justify-between">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="heading-display text-3xl text-ink">{formatBRL(total)}</div>
                </div>

                <div className="mt-6 grid gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Compra 100% protegida</div>
                  <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Envio refrigerado</div>
                  <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" /> Dados criptografados</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</span>
      <span className={`font-semibold ${accent ? "text-primary-deep" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70">{label}</span>
      <input
        {...rest}
        className={`w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 ${className ?? ""}`}
      />
    </label>
  );
}

function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="btn-shine relative mt-6 inline-flex w-full items-center justify-center rounded-full gradient-brand px-6 py-4 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      <span className="btn-shine-inner" />
      <span className="relative">{children}</span>
    </button>
  );
}

function StepCustomer({ state, onNext }: { state: ReturnType<typeof useCart>; onNext: () => void }) {
  const leadFired = useRef(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const fireLead = () => {
    if (leadFired.current) return;
    leadFired.current = true;
    trackLead({ content_name: "checkout_customer_form" });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCPF(state.customer.cpf)) {
      setCpfError("CPF inválido. Verifique os números digitados.");
      return;
    }
    setCpfError(null);
    onNext();
  };
  return (
    <form onSubmit={handleSubmit}>

      <h2 className="heading-display text-2xl md:text-3xl text-ink">Seus dados</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Para emissão da nota fiscal e contato.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" required value={state.customer.fullName} onChange={(e) => { fireLead(); cart.patch("customer", { fullName: e.target.value }); }} />
        <Field label="E-mail" required type="email" value={state.customer.email} onChange={(e) => { fireLead(); cart.patch("customer", { email: e.target.value }); }} />
        <Field label="Telefone / WhatsApp" required placeholder="(11) 90000-0000" value={state.customer.phone} onChange={(e) => { fireLead(); cart.patch("customer", { phone: e.target.value }); }} />
        <div>
          <Field
            label="CPF"
            required
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={formatCPF(state.customer.cpf)}
            onChange={(e) => { fireLead(); setCpfError(null); cart.patch("customer", { cpf: cleanCPF(e.target.value) }); }}
            onBlur={() => {
              if (state.customer.cpf && !isValidCPF(state.customer.cpf)) {
                setCpfError("CPF inválido.");
              }
            }}
          />
          {cpfError && <p className="mt-1.5 text-xs font-medium text-red-600">{cpfError}</p>}
        </div>

      </div>
      <PrimaryButton type="submit">Continuar para endereço</PrimaryButton>
    </form>
  );
}

function StepAddress({ state, onNext }: { state: ReturnType<typeof useCart>; onNext: () => void }) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleCepChange = async (raw: string) => {
    const clean = cleanCEP(raw);
    cart.patch("address", { zip: clean });
    setCepError(null);
    if (clean.length === 8) {
      setCepLoading(true);
      const res = await lookupCEP(clean);
      setCepLoading(false);
      if (!res) {
        setCepError("CEP não encontrado. Verifique e tente novamente.");
        return;
      }
      cart.patch("address", {
        street: res.logradouro || "",
        district: res.bairro || "",
        city: res.localidade || "",
        state: (res.uf || "").toUpperCase(),
      });
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      <h2 className="heading-display text-2xl md:text-3xl text-ink">Endereço de entrega</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Digite o CEP e preenchemos cidade, estado, bairro e rua automaticamente.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Field
            label={cepLoading ? "CEP (buscando...)" : "CEP"}
            required
            placeholder="00000-000"
            inputMode="numeric"
            value={formatCEP(state.address.zip)}
            onChange={(e) => handleCepChange(e.target.value)}
          />
          {cepError && <p className="mt-1.5 text-xs font-medium text-red-600">{cepError}</p>}
        </div>
        <div className="sm:col-span-4"><Field label="Rua" required value={state.address.street} onChange={(e) => cart.patch("address", { street: e.target.value })} /></div>
        <div className="sm:col-span-2"><Field label="Número" required value={state.address.number} onChange={(e) => cart.patch("address", { number: e.target.value })} /></div>
        <div className="sm:col-span-4"><Field label="Ponto de referência (opcional)" value={state.address.reference} onChange={(e) => cart.patch("address", { reference: e.target.value })} /></div>
        <div className="sm:col-span-3"><Field label="Bairro" required value={state.address.district} onChange={(e) => cart.patch("address", { district: e.target.value })} /></div>
        <div className="sm:col-span-2"><Field label="Cidade" required value={state.address.city} onChange={(e) => cart.patch("address", { city: e.target.value })} /></div>
        <div className="sm:col-span-1"><Field label="UF" required maxLength={2} value={state.address.state} onChange={(e) => cart.patch("address", { state: e.target.value.toUpperCase() })} /></div>
      </div>
      <PrimaryButton type="submit">Continuar para frete</PrimaryButton>
    </form>
  );
}

function StepShipping({ state, onNext }: { state: ReturnType<typeof useCart>; onNext: () => void }) {
  const options = [
    { id: "standard" as const, label: "Envio Refrigerado Padrão", eta: "2 a 5 dias úteis", price: 19.9 },
    { id: "express" as const, label: "Envio Refrigerado Expresso", eta: "1 a 2 dias úteis", price: 39.9 },
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (state.shipping) onNext(); }}>
      <h2 className="heading-display text-2xl md:text-3xl text-ink">Frete</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Todos os envios com embalagem refrigerada e rastreio.</p>
      <div className="mt-6 grid gap-3">
        {options.map((o) => {
          const selected = state.shipping === o.id;
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => cart.set({ shipping: o.id })}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Truck className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-semibold text-ink">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.eta}</div>
              </div>
              <div className="text-sm font-bold text-ink">{formatBRL(o.price)}</div>
              <div className={`grid h-6 w-6 place-items-center rounded-full border-2 ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
      <PrimaryButton type="submit" disabled={!state.shipping}>Continuar para pagamento</PrimaryButton>
    </form>
  );
}

function StepPayment({ state, onNext, total }: { state: ReturnType<typeof useCart>; onNext: () => void; total: number }) {
  const methods = [
    { id: "pix" as const, label: "Pix", desc: "Aprovação imediata · 5% de desconto", icon: QrCode },
    { id: "card" as const, label: "Cartão de crédito", desc: "Em até 12x sem juros", icon: CreditCard },
    { id: "boleto" as const, label: "Boleto bancário", desc: "Compensação em até 2 dias úteis", icon: FileText },
  ];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!state.payment) return;
        trackAddPaymentInfo({
          value: total,
          content_ids: [state.variant],
        });
        onNext();
      }}
    >

      <h2 className="heading-display text-2xl md:text-3xl text-ink">Pagamento</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Ambiente 100% seguro e criptografado.</p>
      <div className="mt-6 grid gap-3">
        {methods.map(({ id, label, desc, icon: Icon }) => {
          const selected = state.payment === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => cart.set({ payment: id })}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="font-semibold text-ink">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <div className={`grid h-6 w-6 place-items-center rounded-full border-2 ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
      {state.payment === "card" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Número do cartão" placeholder="0000 0000 0000 0000" inputMode="numeric" required /></div>
          <Field label="Nome impresso" required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Validade" placeholder="MM/AA" inputMode="numeric" required />
            <Field label="CVV" placeholder="000" inputMode="numeric" required />
          </div>
          <label className="sm:col-span-2 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70">Parcelamento</span>
            <select
              value={state.cardInstallments}
              onChange={(e) => cart.set({ cardInstallments: parseInt(e.target.value, 10) })}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
              {installmentOptions(total).map((opt) => (
                <option key={opt.n} value={opt.n}>{opt.label}</option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] text-muted-foreground">Até 12x sem juros no cartão de crédito.</span>
          </label>
        </div>
      )}
      <PrimaryButton type="submit" disabled={!state.payment}>Finalizar compra</PrimaryButton>
    </form>
  );
}

function StepConfirm({ orderId, total, state }: { orderId: string; total: number; state: ReturnType<typeof useCart> }) {
  const admin = useAdmin();
  useEffect(() => {
    trackPurchase({
      value: total,
      content_ids: [state.variant],
      num_items: state.qty,
      order_id: orderId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const v = variants[state.variant];
  const phone = (admin.support.whatsappPhone || "").replace(/\D/g, "");
  const paymentLabel =
    state.payment === "pix" ? "Pix"
      : state.payment === "card" ? `Cartão de crédito (${state.cardInstallments}x)`
      : state.payment === "boleto" ? "Boleto bancário"
      : "A combinar";
  const shippingLabel =
    state.shipping === "express" ? "Expresso (1 a 2 dias úteis)"
      : state.shipping === "standard" ? "Padrão (2 a 5 dias úteis)"
      : "A combinar";

  const message =
`Olá! Acabei de finalizar meu pedido no site T.G.15 e gostaria de concluir a compra.

*Pedido:* #${orderId}
*Produto:* ${v.name} (${state.qty}x)
*Total:* ${formatBRL(total)}
*Forma de pagamento:* ${paymentLabel}
*Frete:* ${shippingLabel}

*Dados do cliente*
Nome: ${state.customer.fullName}
E-mail: ${state.customer.email}
Telefone: ${state.customer.phone}
CPF: ${state.customer.cpf}

*Endereço de entrega*
${state.address.street}, ${state.address.number}${state.address.complement ? " - " + state.address.complement : ""}
${state.address.district} - ${state.address.city}/${state.address.state}
CEP: ${state.address.zip}${state.address.reference ? "\nReferência: " + state.address.reference : ""}

Aguardo as instruções para finalizar o pagamento. Obrigado!`;

  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    const t = setTimeout(() => {
      window.open(waLink, "_blank", "noopener,noreferrer");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center py-6">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-brand text-white shadow-2xl shadow-primary/40">
        <Check className="h-10 w-10" strokeWidth={3} />
      </div>
      <h2 className="heading-display mt-6 text-3xl md:text-4xl text-ink">Pedido registrado</h2>
      <p className="mt-2 text-muted-foreground">
        Seu pedido <span className="font-semibold text-ink">#{orderId}</span> foi registrado com sucesso.
      </p>
      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
        Para concluir a compra e receber as instruções de pagamento, finalize o atendimento pelo WhatsApp com nossa equipe.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#25D366]/40 hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" /> Concluir compra no WhatsApp
        </a>
        <p className="text-[11px] text-muted-foreground">
          Abrindo automaticamente… caso não abra, clique no botão acima.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {admin.support.whatsappGroupLink && (
          <a
            href={admin.support.whatsappGroupLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-sm font-bold text-[#128C7E] hover:bg-[#25D366]/15"
          >
            <MessageCircle className="h-4 w-4" /> Entrar no grupo de clientes
          </a>
        )}
        <Link to="/" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:border-primary/40">
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
