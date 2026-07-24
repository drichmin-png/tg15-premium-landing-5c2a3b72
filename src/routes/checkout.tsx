import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, CreditCard, Lock, QrCode, ShieldCheck, Truck, FileText, MessageCircle, Package } from "lucide-react";
import { cart, useCart } from "@/lib/cart-store";
import { BOX_SAVINGS, formatBRL, variants } from "@/lib/product";
import { trackLead, trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } from "@/lib/tracking/metaPixel";
import { cleanCPF, formatCPF, isValidCPF } from "@/lib/validation/cpf";
import { cleanCEP, formatCEP, lookupCEP } from "@/lib/validation/cep";
import { installmentOptions } from "@/lib/payments/installments";
import { admin, useAdmin } from "@/lib/admin-store";
import { buildPixPayload, pixQrImageUrl } from "@/lib/payments/pix";
import { saveLocalOrder } from "@/lib/local-db";


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
  const [trackingCode, setTrackingCode] = useState("BR000000000TG");
  useEffect(() => {
    setOrderId("TG-" + Math.random().toString(36).slice(2, 8).toUpperCase());
    setTrackingCode(
      "BR" + Math.random().toString(36).slice(2, 11).toUpperCase() + "TG"
    );
  }, []);
  useEffect(() => { admin.hydrateRemote(); }, []);

  const v = variants[state.variant];
  const unitPrice = state.variant === "box" ? products.box.price : products.single.price;
  const subtotal = unitPrice * state.qty;
  const freeShipping = state.variant === "box" || (state.variant === "single" && state.qty > 2);
  const shippingCost = freeShipping ? 0 : state.shipping === "express" ? 39.9 : state.shipping === "standard" ? 19.9 : 0;
  const total = subtotal + shippingCost;
  const boxSavingsUnit = Math.max(0, products.single.price * 4 - products.box.price);
  const savings = state.variant === "box" ? boxSavingsUnit * state.qty : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const operatorSlug = window.sessionStorage.getItem("tg15-active-operator-slug");
    if (operatorSlug && admin.getNamespace() !== operatorSlug) {
      admin.setNamespace(operatorSlug);
    } else if (!operatorSlug && admin.getNamespace() !== null) {
      admin.setNamespace(null);
    }
  }, [nav]);

  // InitiateCheckout — apenas ao acessar /checkout (uma vez por sessão de página)
  useEffect(() => {
    trackInitiateCheckout({
      value: subtotal,
      num_items: state.qty,
      content_ids: [state.variant],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const stepNames = ["identificacao", "endereco", "frete", "pagamento", "confirmacao"] as const;
  useEffect(() => {
    import("@/lib/analytics/tracker").then(({ track }) =>
      track("checkout_step", { target: stepNames[step - 1], meta: { step } })
    );
  }, [step]);

  const [packing, setPacking] = useState(false);
  const next = () => {
    if (step === 4) {
      setPacking(true);
      window.setTimeout(() => {
        setPacking(false);
        setStep(5);
      }, 2400);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };
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

      {packing && <PackingOverlay />}


      <div className={step === 5 ? "w-full py-10" : "container-x py-10"}>
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
          {/* Order summary — first in DOM so it sits at the top on mobile */}
          <aside className="order-first lg:order-2 lg:sticky lg:top-24 h-fit">
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
                  <div className="font-price text-2xl text-ink">{formatBRL(total)}</div>
                </div>

                <div className="mt-6 grid gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Compra 100% protegida</div>
                  <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Envio refrigerado</div>
                  <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" /> Dados criptografados</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:order-1 py-2">
            {step === 1 && <StepCustomer state={state} onNext={next} />}
            {step === 2 && <StepAddress state={state} onNext={next} />}
            {step === 3 && <StepShipping state={state} onNext={next} freeShipping={freeShipping} />}
            {step === 4 && <StepPayment state={state} onNext={next} total={total} />}
            {step === 5 && <StepConfirm orderId={orderId} trackingCode={trackingCode} total={total} state={state} />}
          </div>
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

function StepShipping({ state, onNext, freeShipping }: { state: ReturnType<typeof useCart>; onNext: () => void; freeShipping: boolean }) {
  const options = [
    { id: "standard" as const, label: "Envio Refrigerado Padrão", eta: "2 a 5 dias úteis", price: 19.9 },
    { id: "express" as const, label: "Envio Refrigerado Expresso", eta: "1 a 2 dias úteis", price: 39.9 },
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (state.shipping) onNext(); }}>
      <h2 className="heading-display text-2xl md:text-3xl text-ink">Frete</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Todos os envios com embalagem refrigerada e rastreio.</p>
      {freeShipping && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          🎉 Frete grátis liberado para este pedido!
        </div>
      )}
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
              <div className="text-sm font-bold text-ink">
                {freeShipping ? <span className="text-emerald-600">Grátis</span> : formatBRL(o.price)}
              </div>
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

type RegionalEta = { region: string; range: string; center: string };
// Centros de distribuição em todas as capitais do Brasil
const REGIONAL_ETA: Record<string, RegionalEta> = {
  SP: { region: "São Paulo", range: "1 a 2 dias úteis", center: "São Paulo (SP)" },
  RJ: { region: "Sudeste", range: "1 a 2 dias úteis", center: "Rio de Janeiro (RJ)" },
  MG: { region: "Sudeste", range: "1 a 2 dias úteis", center: "Belo Horizonte (MG)" },
  ES: { region: "Sudeste", range: "1 a 2 dias úteis", center: "Vitória (ES)" },
  PR: { region: "Sul", range: "1 a 2 dias úteis", center: "Curitiba (PR)" },
  SC: { region: "Sul", range: "1 a 2 dias úteis", center: "Florianópolis (SC)" },
  RS: { region: "Sul", range: "1 a 2 dias úteis", center: "Porto Alegre (RS)" },
  DF: { region: "Centro-Oeste", range: "1 a 2 dias úteis", center: "Brasília (DF)" },
  GO: { region: "Centro-Oeste", range: "1 a 2 dias úteis", center: "Goiânia (GO)" },
  MT: { region: "Centro-Oeste", range: "1 a 2 dias úteis", center: "Cuiabá (MT)" },
  MS: { region: "Centro-Oeste", range: "1 a 2 dias úteis", center: "Campo Grande (MS)" },
  BA: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Salvador (BA)" },
  SE: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Aracaju (SE)" },
  AL: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Maceió (AL)" },
  PE: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Recife (PE)" },
  PB: { region: "Nordeste", range: "1 a 2 dias úteis", center: "João Pessoa (PB)" },
  RN: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Natal (RN)" },
  CE: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Fortaleza (CE)" },
  PI: { region: "Nordeste", range: "1 a 2 dias úteis", center: "Teresina (PI)" },
  MA: { region: "Nordeste", range: "1 a 2 dias úteis", center: "São Luís (MA)" },
  PA: { region: "Norte", range: "1 a 2 dias úteis", center: "Belém (PA)" },
  AP: { region: "Norte", range: "1 a 2 dias úteis", center: "Macapá (AP)" },
  AM: { region: "Norte", range: "1 a 2 dias úteis", center: "Manaus (AM)" },
  RR: { region: "Norte", range: "1 a 2 dias úteis", center: "Boa Vista (RR)" },
  RO: { region: "Norte", range: "1 a 2 dias úteis", center: "Porto Velho (RO)" },
  AC: { region: "Norte", range: "1 a 2 dias úteis", center: "Rio Branco (AC)" },
  TO: { region: "Norte", range: "1 a 2 dias úteis", center: "Palmas (TO)" },
};
function getRegionalEta(uf: string): RegionalEta {
  const key = (uf || "").toUpperCase();
  return REGIONAL_ETA[key] || { region: "Brasil", range: "1 a 2 dias úteis", center: "capital mais próxima" };
}

function StepConfirm({ orderId, trackingCode, total, state }: { orderId: string; trackingCode: string; total: number; state: ReturnType<typeof useCart> }) {
  const admin = useAdmin();
  const savedOrder = useRef(false);
  useEffect(() => {
    trackPurchase({
      value: total,
      content_ids: [state.variant],
      num_items: state.qty,
      order_id: orderId,
    });
    if (!savedOrder.current) {
      savedOrder.current = true;
      const unitPrice = state.variant === "box" ? admin.products.box.price : admin.products.single.price;
      saveLocalOrder({
        id: orderId,
        public_token: orderId,
        created_at: new Date().toISOString(),
        paid_at: null,
        payment_method: state.payment || "pix",
        payment_status: "pending",
        card_installments: state.cardInstallments,
        total_cents: Math.round(total * 100),
        customer_name: state.customer.fullName,
        customer_email: state.customer.email,
        customer_phone: state.customer.phone,
        customer_cpf: state.customer.cpf,
        address_zip: state.address.zip,
        address_street: state.address.street,
        address_number: state.address.number,
        address_complement: state.address.complement,
        address_district: state.address.district,
        address_city: state.address.city,
        address_state: state.address.state,
        delivery_status_override: null,
        invoice_url: null,
        notes: state.address.reference,
        items: [
          {
            id: `${orderId}-1`,
            variant_id: state.variant,
            variant_name: state.variant === "box" ? admin.products.box.name : admin.products.single.name,
            quantity: state.qty,
            unit_price_cents: Math.round(unitPrice * 100),
          },
        ],
      });
    }
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

  const highValue = total > 499;
  const message =
`Olá! Acabei de finalizar meu pedido no site T.G.15 e gostaria de concluir a compra.${highValue ? "\n\n*Atenção:* pedido acima de R$ 499,00 — necessária *verificação de estoque* antes da confirmação." : ""}

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

${highValue ? "Aguardo a verificação de estoque e as instruções para finalizar o pagamento. Obrigado!" : "Aguardo as instruções para finalizar o pagamento. Obrigado!"}`;

  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  const manualPix = admin.pix.mode === "manual" ? admin.pix.manualCode.trim() : "";
  const hasPixConfigured = manualPix.length > 0 || (admin.pix.mode === "key" && admin.pix.key.trim().length > 0);

  useEffect(() => {
    if (!highValue && state.payment === "pix" && hasPixConfigured) return; // deixa o cliente pagar primeiro
    const t = setTimeout(() => {
      window.open(waLink, "_blank", "noopener,noreferrer");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showPix = !highValue && state.payment === "pix" && hasPixConfigured;

  const pixPayload = showPix
    ? manualPix
      ? manualPix
      : buildPixPayload({
          key: admin.pix.key,
          keyType: admin.pix.keyType,
          amount: total,
          merchantName: admin.pix.merchantName || "TG15 ONLINE",
          merchantCity: admin.pix.merchantCity || "SAO PAULO",
          txid: "***",
        })
    : "";

  const [copied, setCopied] = useState(false);
  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      import("@/lib/analytics/tracker").then(({ track }) =>
        track("pix_copied", { target: "pix_copy_button", meta: { orderId, total } })
      );
    } catch {}
  };

  const maskCPF = (cpf: string) => {
    const c = (cpf || "").replace(/\D/g, "").padEnd(11, "•");
    return `${c.slice(0, 3)}.•••.•••-${c.slice(9, 11)}`;
  };
  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email || "—";
    const [user, domain] = email.split("@");
    const visible = user.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
  };
  const maskPhone = (phone: string) => {
    const p = (phone || "").replace(/\D/g, "");
    if (p.length < 4) return phone || "—";
    return `(${p.slice(0, 2)}) •••••-${p.slice(-4)}`;
  };
  const etaText =
    state.shipping === "express" ? "1 a 2 dias úteis após a confirmação do pagamento"
      : state.shipping === "standard" ? "2 a 5 dias úteis após a confirmação do pagamento"
      : "A combinar após a confirmação do pagamento";

  const regionalEta = getRegionalEta(state.address.state);
  const emissionDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="text-center py-6">
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-sand/70 to-background px-6 pt-10 pb-8 ring-1 ring-primary/10">
        <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <PackageBox animated />
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-md">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <h2 className="heading-display text-3xl md:text-4xl text-ink">
            Pedido <span className="text-primary">confirmado</span>
          </h2>
        </div>
        <p className="mt-3 text-muted-foreground">
          Seu pedido <span className="font-semibold text-primary">#{orderId}</span> foi confirmado com sucesso.
        </p>
      </div>


      {/* Resumo do pedido — acima do código de pagamento */}
      <div className="mt-8 mx-auto max-w-2xl text-left">
        <div className="card-premium overflow-hidden">
          <div className="gradient-brand px-5 py-4 text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">Resumo do pedido</div>
              <div className="mt-0.5 font-bold">#{orderId}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-white/80">Total</div>
              <div className="font-price text-2xl text-white">{formatBRL(total)}</div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Produto */}
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand">
                <img src={v.image} alt="" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-sm">{v.name}</div>
                <div className="text-xs text-muted-foreground">15mg/0,5mL · {v.units} {v.units > 1 ? "ampolas" : "ampola"}</div>
                <div className="text-xs text-muted-foreground">Qtd: {state.qty}</div>
              </div>
              <div className="text-sm font-bold text-ink whitespace-nowrap">{formatBRL(total)}</div>
            </div>

            <div className="h-px bg-border" />

            {/* Dados do cliente */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Dados do cliente
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm sm:gap-x-6">
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Nome</dt><dd className="font-semibold text-ink">{state.customer.fullName || "—"}</dd></div>
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">CPF</dt><dd className="font-semibold text-ink">{maskCPF(state.customer.cpf)}</dd></div>
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">E-mail</dt><dd className="font-semibold text-ink break-all">{maskEmail(state.customer.email)}</dd></div>
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Telefone</dt><dd className="font-semibold text-ink">{maskPhone(state.customer.phone)}</dd></div>
              </dl>
            </div>

            <div className="h-px bg-border" />

            {/* Informações sobre o envio */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Package className="h-3.5 w-3.5" /> Informações sobre o envio
              </div>
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  Seu pedido será despachado a partir do nosso Centro de Distribuição em{" "}
                  <span className="font-semibold text-ink">{regionalEta.center}</span>. Contamos com centros de distribuição em <span className="font-semibold text-ink">todas as capitais do Brasil</span>, garantindo agilidade no envio.
                </p>

                <div className="rounded-xl border border-border bg-sand/40 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Transportadora responsável pelo envio</div>
                  <div className="mt-1 font-semibold text-ink">Empresa Brasileira de Correios e Telégrafos (ECT)</div>
                  <dl className="mt-3 grid grid-cols-1 gap-y-1.5 text-xs sm:grid-cols-2">
                    <div className="flex flex-col"><dt className="text-muted-foreground">Razão Social</dt><dd className="font-semibold text-ink">Empresa Brasileira de Correios e Telégrafos (Correios)</dd></div>
                    <div className="flex flex-col"><dt className="text-muted-foreground">CNPJ Sede (Brasília/DF)</dt><dd className="font-semibold text-ink">34.028.316/0001-03</dd></div>
                    <div className="flex flex-col sm:col-span-2"><dt className="text-muted-foreground">CNPJ emissão de Notas Fiscais (São Paulo/SP)</dt><dd className="font-semibold text-ink">34.028.316/0031-29</dd></div>
                  </dl>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-sand/40 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Código de rastreamento</div>
                    <div className="mt-1 font-mono text-sm font-bold text-ink break-all">{trackingCode}</div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Todos os pedidos são enviados com código de rastreamento, permitindo o acompanhamento completo da entrega.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-sand/40 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Garantia</div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Oferecemos garantia contra defeitos de fabricação. Caso o produto apresente algum defeito de origem, realizaremos a substituição ou o reembolso, conforme nossa política de garantia.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Agradecemos pela confiança e permanecemos à disposição para qualquer dúvida.
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Entrega */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Truck className="h-3.5 w-3.5" /> Entrega
              </div>
              <div className="mt-3 text-sm">
                <div className="font-semibold text-ink">
                  {state.address.street ? `${state.address.street}, ${state.address.number}` : "Endereço não informado"}
                  {state.address.complement ? ` - ${state.address.complement}` : ""}
                </div>
                {(state.address.district || state.address.city) && (
                  <div className="text-muted-foreground mt-0.5">
                    {state.address.district}{state.address.district && (state.address.city || state.address.state) ? " · " : ""}{state.address.city}{state.address.state ? `/${state.address.state}` : ""}
                  </div>
                )}
                {state.address.zip && <div className="text-muted-foreground mt-0.5">CEP: {state.address.zip}</div>}
                {state.address.reference && <div className="text-muted-foreground mt-0.5">Ref.: {state.address.reference}</div>}
              </div>
              <div className="mt-3 rounded-xl bg-primary/[0.04] border border-primary/15 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Prazo estimado</div>
                    <div className="text-sm font-semibold text-ink">{etaText}</div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground whitespace-nowrap">{shippingLabel}</div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">Embalagem térmica refrigerada com rastreio</div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Financeiro */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <FileText className="h-3.5 w-3.5" /> Pagamento
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Forma</span><span className="font-semibold text-ink">{paymentLabel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="font-semibold text-ink">{shippingLabel}</span></div>
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total do pedido</span>
                  <span className="font-price text-xl text-ink">{formatBRL(total)}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Nota de compra + Rastreio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-sand/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <FileText className="h-3.5 w-3.5" /> Nota de compra
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Nº do pedido</dt><dd className="font-semibold text-ink">#{orderId}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Emissão</dt><dd className="font-semibold text-ink">{emissionDate}</dd></div>
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


            {/* Empresa */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Empresa responsável
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm sm:gap-x-6">
                <div className="col-span-2 flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Razão social</dt><dd className="font-semibold text-ink">TGFarmacêutica Indústria e Comércio LTDA.</dd></div>
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">CNPJ</dt><dd className="font-semibold text-ink">48.327.915/0001-72</dd></div>
                <div className="flex flex-col"><dt className="text-[11px] text-muted-foreground uppercase">Endereço</dt><dd className="font-semibold text-ink">Av. Paulista, 1106 — Bela Vista, São Paulo/SP</dd></div>
              </dl>
            </div>

          </div>
        </div>


        {/* Termos */}
        <div className="mt-4 rounded-2xl border border-border bg-sand/40 p-5 text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/70">
            <Lock className="h-3.5 w-3.5" /> Termos e condições
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
            <li>O envio é iniciado somente após a confirmação do pagamento pela nossa equipe.</li>
            <li>Produto termolábil: enviado em embalagem refrigerada com gelo térmico e rastreio.</li>
            <li>Ao receber, confira a integridade da embalagem. Em caso de avaria, registre com foto e envie no WhatsApp em até 24h.</li>
            <li>Trocas e devoluções seguem o CDC (art. 49) em até 7 dias corridos, desde que o lacre esteja intacto.</li>
            <li>Seus dados são criptografados e utilizados apenas para o processamento do pedido, conforme a LGPD.</li>
            <li>Este pedido é válido por 24h. Após esse prazo, será necessário refazê-lo.</li>
          </ul>
        </div>
      </div>

      {showPix && (
        <div className="mt-8 mx-auto max-w-md rounded-2xl border border-border bg-card p-5 text-left">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <QrCode className="h-4 w-4 text-primary" /> Pague com Pix — {formatBRL(total)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Escaneie o QR Code no app do seu banco ou use o código copia-e-cola abaixo.
          </p>
          <div className="mt-4 grid place-items-center">
            <img
              src={pixQrImageUrl(pixPayload, 240)}
              alt="QR Code Pix"
              className="h-60 w-60 rounded-xl border border-border bg-white p-2"
            />
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

      <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto">
        {highValue
          ? "Pedidos acima de R$ 499,00 exigem verificação de estoque. Continue no WhatsApp com nossa equipe para confirmar a disponibilidade e receber as instruções de pagamento."
          : showPix
          ? "Após o pagamento, envie o comprovante pelo WhatsApp para liberarmos o envio."
          : "Para concluir a compra e receber as instruções de pagamento, finalize o atendimento pelo WhatsApp com nossa equipe."}
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#25D366]/40 hover:brightness-110"
        >
          <MessageCircle className="h-5 w-5" /> {highValue ? "Verificar estoque no WhatsApp" : showPix ? "Enviar comprovante no WhatsApp" : "Concluir compra no WhatsApp"}
        </a>
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

function PackageBox({ animated = false }: { animated?: boolean }) {
  return (
    <div className="relative mx-auto h-40 w-40 md:h-48 md:w-48">
      {animated && (
        <>
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/50 animate-orbit-dot" style={{ animationDelay: "0s" }} />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 animate-orbit-dot" style={{ animationDelay: "0.7s" }} />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 animate-orbit-dot" style={{ animationDelay: "1.4s" }} />
        </>
      )}
      <svg viewBox="0 0 200 200" className={`relative h-full w-full ${animated ? "animate-box-bounce" : ""}`} aria-hidden>
        {/* box body */}
        <path d="M30 70 L100 45 L170 70 L170 155 L100 180 L30 155 Z" fill="#E8A26A" />
        {/* right face */}
        <path d="M100 90 L170 70 L170 155 L100 180 Z" fill="#C97F44" />
        {/* left face */}
        <path d="M30 70 L100 90 L100 180 L30 155 Z" fill="#D89258" />
        {/* top seam */}
        <path d="M100 90 L100 45" stroke="#A8672F" strokeWidth="1.5" opacity="0.6" />
        {/* label */}
        <rect x="45" y="105" width="45" height="28" fill="#fff" rx="2" />
        <rect x="49" y="112" width="30" height="2" fill="#333" />
        <rect x="49" y="117" width="24" height="1.5" fill="#666" />
        <g fill="#111">
          <rect x="49" y="122" width="1.5" height="8" />
          <rect x="52" y="122" width="1" height="8" />
          <rect x="54.5" y="122" width="2" height="8" />
          <rect x="58" y="122" width="1" height="8" />
          <rect x="60.5" y="122" width="1.5" height="8" />
          <rect x="63.5" y="122" width="1" height="8" />
          <rect x="66" y="122" width="2" height="8" />
          <rect x="70" y="122" width="1" height="8" />
          <rect x="73" y="122" width="1.5" height="8" />
        </g>
        {/* up arrows */}
        <g fill="#3d2a1a" opacity="0.75">
          <path d="M108 150 L112 144 L116 150 L114 150 L114 158 L110 158 L110 150 Z" />
          <path d="M122 150 L126 144 L130 150 L128 150 L128 158 L124 158 L124 150 Z" />
        </g>
        {/* tape (animated) */}
        <g clipPath="url(#tapeClip)">
          <rect
            x="30" y="66" width="140" height="10" fill="#F2C48A"
            className={animated ? "origin-left animate-tape-wipe" : ""}
            style={animated ? { transformBox: "fill-box" } : undefined}
          />
        </g>
        <defs>
          <clipPath id="tapeClip">
            <path d="M30 66 L100 41 L170 66 L170 78 L100 53 L30 78 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* shield accent */}
      <div className="absolute -left-2 top-10 grid h-9 w-9 place-items-center rounded-full bg-white shadow-lg ring-1 ring-black/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
      </div>
      {/* check pop */}
      <div className={`absolute -right-2 bottom-6 grid h-14 w-14 place-items-center rounded-full bg-white shadow-xl ring-1 ring-black/5 ${animated ? "animate-check-pop" : ""}`}>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

function PackingOverlay() {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-white/85 backdrop-blur-md">
      <div className="text-center px-6">
        <PackageBox animated />
        <div className="mt-6 animate-fade-up-slow">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Preparando seu pedido</div>
          <h3 className="heading-display mt-1 text-2xl md:text-3xl text-ink">Embalando com cuidado…</h3>
          <p className="mt-1 text-sm text-muted-foreground">Envio refrigerado · Compra 100% protegida</p>
        </div>
      </div>
    </div>
  );
}
