import { useNavigate } from "@tanstack/react-router";
import { Check, Minus, Plus, Shield, Truck, Award } from "lucide-react";
import { cart, useCart } from "@/lib/cart-store";
import { formatBRL, variants } from "@/lib/product";
import { useAdmin } from "@/lib/admin-store";
import { trackAddToCart } from "@/lib/tracking/metaPixel";


export function BuyPanel() {
  const state = useCart();
  const nav = useNavigate();
  const { products } = useAdmin();
  const singleActive = products.single.active;
  const boxActive = products.box.active;
  const dynPrice = { single: products.single.price, box: products.box.price };
  const dynName = { single: products.single.name, box: products.box.name };
  const boxBadge = products.box.badge;
  const BOX_UNIT_TOTAL = dynPrice.single * 4;
  const BOX_SAVINGS = Math.max(0, BOX_UNIT_TOTAL - dynPrice.box);
  const activeVariant = state.variant === "single" && !singleActive ? "box" : state.variant === "box" && !boxActive ? "single" : state.variant;
  const v = variants[activeVariant];
  const unitPrice = dynPrice[activeVariant];
  const total = unitPrice * state.qty;
  const savings = activeVariant === "box" ? BOX_SAVINGS * state.qty : 0;
  const BOX_PRICE = dynPrice.box;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="eyebrow">Uso Subcutâneo • Uso Adulto</div>
        <h1 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
          T.G.15 <span className="text-gradient-brand">Tirzepatida</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          15mg / 0,5mL — Solução Injetável
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary-deep">
            <Award className="h-3.5 w-3.5" /> Produto Original
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
            <Shield className="h-3.5 w-3.5" /> Lote com nota fiscal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
            <Truck className="h-3.5 w-3.5" /> Envio refrigerado
          </span>
        </div>
      </div>

      <p className="text-[15px] leading-relaxed text-foreground/80">
        Tirzepatida de alta pureza para emagrecimento eficaz, melhora do controle
        glicêmico, do perfil lipídico e do bem-estar. Formulação subcutânea de
        aplicação semanal.
      </p>

      <div id="comprar" className="grid gap-3">
        <div className="eyebrow">Escolha sua opção</div>
        {(["single", "box"] as const).filter((id) => (id === "single" ? singleActive : boxActive)).map((id) => {
          const variant = variants[id];
          const selected = activeVariant === id;
          const price = dynPrice[id];
          const name = dynName[id];
          const badge = id === "box" ? boxBadge : undefined;
          return (
            <button
              key={id}
              onClick={() => cart.setVariant(id)}
              className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/[0.04] shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-4 rounded-full gradient-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/30">
                  {badge}
                </span>
              )}
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand">
                <img src={variant.image} alt="" className="h-full w-full object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold text-ink">{name}</div>
                  <div className="text-lg font-bold text-ink whitespace-nowrap">
                    {formatBRL(price)}
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {variant.units} {variant.units > 1 ? "ampolas" : "ampola"} · 15mg/0,5mL
                </div>
                {id === "box" && (
                  <div className="mt-1 text-xs font-semibold text-primary-deep">
                    Economize {formatBRL(BOX_SAVINGS)} · {formatBRL(BOX_PRICE / 4)} por ampola
                  </div>
                )}
              </div>
              <div
                className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                  selected ? "border-primary bg-primary text-white" : "border-border"
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {state.variant === "box" && (
        <div className="card-premium relative overflow-hidden p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative">
            <div className="eyebrow">Economia Real</div>
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">4 × unidades</div>
                <div className="text-base font-semibold line-through text-muted-foreground">
                  {formatBRL(BOX_UNIT_TOTAL)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Caixa</div>
                <div className="text-base font-semibold text-ink">{formatBRL(BOX_PRICE)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Você economiza</div>
                <div className="text-lg font-bold text-gradient-brand">
                  {formatBRL(BOX_SAVINGS)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
          <button
            onClick={() => cart.setQty(state.qty - 1)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand"
            aria-label="Diminuir"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{state.qty}</span>
          <button
            onClick={() => cart.setQty(state.qty + 1)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand"
            aria-label="Aumentar"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Preço unitário {formatBRL(unitPrice)}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="heading-display text-3xl text-ink">{formatBRL(total)}</div>
        </div>
        {savings > 0 && (
          <div className="mt-1 text-right text-xs font-medium text-primary-deep">
            Economia total {formatBRL(savings)}
          </div>
        )}
        <button
          onClick={() => nav({ to: "/checkout" })}
          className="btn-shine mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-4 text-base font-bold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <span className="btn-shine-inner" />
          <span className="relative">Comprar Agora</span>
        </button>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground justify-center">
          <span>Pix</span>·<span>Cartão até 12x</span>·<span>Boleto</span>·<span>Compra 100% segura</span>
        </div>
      </div>
    </div>
  );
}
