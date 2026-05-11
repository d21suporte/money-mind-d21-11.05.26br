import { MobileShell } from "@/components/MobileShell";
import { ExternalLink, Store } from "lucide-react";
import { useEffect, useState } from "react";
import sv1 from "@/assets/vitrine-sv1.png";
import sv2 from "@/assets/vitrine-sv2.png";
import sv3 from "@/assets/vitrine-sv3.png";
import jp1 from "@/assets/vitrine-jp1.png";
import jp2 from "@/assets/vitrine-jp2.png";
import jp3 from "@/assets/vitrine-jp3.png";
import an1 from "@/assets/vitrine-anuncie1.png";
import an2 from "@/assets/vitrine-anuncie2.png";
import an3 from "@/assets/vitrine-anuncie3.png";

function AutoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-[2/3]">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const PRODUCTS = [
  {
    title: "Método Sociedade Viral",
    description: "Estratégias para crescer e viralizar no digital.",
    bullets: [
      "Reels que vendem no automático",
      "Cortes que escalam alcance",
      "Múltiplas fontes de renda",
      "Estratégias validadas por resultados",
    ],
    url: "https://kiwify.app/fCHyZSL?afid=xPHPNStm",
    images: [sv1, sv2, sv3],
    cta: "Acessar oferta",
  },
  {
    title: "Desafio 21 Dias — Jornada do Progresso",
    description: "Transforme sua relação com o dinheiro em 21 dias.",
    bullets: [
      "Mentoria diária guiada",
      "App calculadora de pagamentos",
      "Planejamento e controle real",
      "Disciplina hoje, liberdade amanhã",
    ],
    url: "https://kiwify.app/AaBECZ6?afid=4UF5JUi5",
    images: [jp1, jp2, jp3],
    cta: "Acessar oferta",
  },
  {
    title: "Anuncie aqui",
    description: "Seu produto em destaque para milhares de pessoas. Fale comigo no Instagram.",
    bullets: [
      "Mais de 10.000 usuários ativos",
      "Público qualificado e engajado",
      "Sua marca em evidência todos os dias",
      "Parceria que gera resultados reais",
    ],
    url: "https://instagram.com/eu.rickbr",
    images: [an1, an2, an3],
    cta: "Anunciar",
  },
];

const Vitrine = () => {
  return (
    <MobileShell>
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">Vitrine</p>
          <h1 className="text-lg font-bold">Vitrine de Infoprodutos</h1>
        </div>
      </header>

      <ul className="space-y-5">
        {PRODUCTS.map((p) => (
          <li
            key={p.url}
            className="overflow-hidden rounded-3xl border border-red-500/20 bg-card p-4 shadow-floating"
          >
            <AutoCarousel images={p.images} alt={p.title} />
            <h2 className="mt-4 text-base font-bold leading-snug">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            {p.bullets && (
              <ul className="mt-3 space-y-1.5">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
            >
              {p.cta} <ExternalLink className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
};

export default Vitrine;
