import { useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "O T.G.15 é o mesmo princípio ativo dos medicamentos originais?",
    a: "Sim. O T.G.15 contém Tirzepatida 15mg/0,5mL, o mesmo princípio ativo utilizado em referência mundial, com alta pureza farmacêutica.",
  },
  {
    q: "Com que frequência devo aplicar?",
    a: "A aplicação é subcutânea, uma vez por semana. A dose deve ser fracionada conforme a tabela oficial (2,5mg → 15mg) e sempre com orientação médica.",
  },
  {
    q: "Como é feito o envio?",
    a: "Enviamos em embalagem refrigerada com rastreio, mantendo a cadeia de frio entre 2°C e 8°C até a entrega. Frete calculado no checkout.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Pix (com desconto), cartão de crédito em até 12x e boleto bancário. Todos processados em ambiente seguro e criptografado.",
  },
  {
    q: "Preciso de receita médica?",
    a: "Sim. Trata-se de medicamento sob prescrição médica. Solicitaremos a receita no momento da entrega ou envio, conforme legislação.",
  },
  {
    q: "Quanto tempo até ver resultados?",
    a: "A maioria dos pacientes observa resultados consistentes a partir da 4ª semana de tratamento, com evolução contínua ao longo dos meses.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="container-x mt-24">
      <div className="max-w-2xl">
        <div className="eyebrow">Perguntas frequentes</div>
        <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
          Tudo o que você <span className="text-gradient-brand">precisa saber</span>
        </h2>
      </div>
      <div className="mt-10 grid gap-3 max-w-3xl">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              onClick={() => setOpen(isOpen ? null : i)}
              className={`text-left card-premium overflow-hidden transition-all ${isOpen ? "ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex items-center gap-4 p-5">
                <div className="flex-1 font-semibold text-ink">{f.q}</div>
                <span className={`grid h-8 w-8 place-items-center rounded-full transition-transform ${isOpen ? "bg-primary text-white rotate-45" : "bg-sand text-ink"}`}>
                  <Plus className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
