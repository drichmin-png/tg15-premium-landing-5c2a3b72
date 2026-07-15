import { Lock, ShieldCheck, Snowflake, Truck } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Produto Original", text: "Nota fiscal e rastreabilidade de lote" },
  { icon: Snowflake, title: "Cadeia de Frio", text: "Envio refrigerado 2°C a 8°C" },
  { icon: Truck, title: "Entrega Nacional", text: "Envio rápido para todo o Brasil" },
  { icon: Lock, title: "Pagamento Seguro", text: "Ambiente criptografado SSL" },
];

export function TrustBar() {
  return (
    <section className="container-x mt-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">{title}</div>
              <div className="text-xs text-muted-foreground">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
