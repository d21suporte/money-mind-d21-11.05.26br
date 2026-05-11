import { Lightbulb } from "lucide-react";

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

export function DailyTip() {
  const idx = Math.floor((Date.now() / 86_400_000)) % TIPS.length;
  const tip = TIPS[idx];
  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-card to-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-500">
          <Lightbulb className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Dica do dia
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-card-foreground">{tip}</p>
        </div>
      </div>
    </section>
  );
}
