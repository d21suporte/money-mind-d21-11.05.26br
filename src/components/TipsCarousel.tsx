import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

const TIPS = [
  "Anote toda saída do dia. O que se mede, se controla.",
  "Antes de comprar, espere 24h. Vontade não é necessidade.",
  "Pague-se primeiro: separe um valor para você antes das contas.",
  "Revise assinaturas mensais. Cancele o que você não usa há 30 dias.",
  "Compare 3 preços antes de qualquer compra acima de R$100.",
  "Estabeleça um teto para 'supérfluos' por semana — e respeite.",
  "Cozinhe em casa pelo menos 5 vezes por semana.",
  "Negocie dívidas: ligue, peça desconto à vista. Quase sempre funciona.",
  "Crie uma reserva de emergência equivalente a 3 meses de gastos.",
  "Estude 15 min/dia sobre dinheiro. Constância vence intensidade.",
  "Evite parcelar o que se consome rápido (comida, lazer).",
  "Defina uma meta visível. Sem destino, todo caminho cansa.",
  "Use dinheiro vivo em categorias de risco (lazer, mercado).",
  "Revise seu orçamento toda segunda. 10 minutos mudam o mês.",
  "Diga 'não' sem culpa. Sua paz financeira vale mais que aprovação.",
];

export function TipsCarousel() {
  const [idx, setIdx] = useState(0);
  const tip = TIPS[idx];
  const prev = () => setIdx((i) => (i - 1 + TIPS.length) % TIPS.length);
  const next = () => setIdx((i) => (i + 1) % TIPS.length);
  return (
    <section className="mt-5" aria-label="Dica do dia">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Dica do dia · {idx + 1}/{TIPS.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Dica anterior" onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-amber-600 shadow-soft transition-smooth active:scale-95">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Próxima dica" onClick={next} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-amber-600 shadow-soft transition-smooth active:scale-95">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-card to-card p-4 shadow-elevated">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-500">
            <Lightbulb className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-medium leading-snug text-card-foreground">{tip}</p>
        </div>
      </div>
    </section>
  );
}
