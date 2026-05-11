import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles, Target, Trophy, Wallet, BookOpen, Users, Headphones, Play, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDay1, type ESM } from "@/hooks/useDay1";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { toast } from "sonner";
import { CurrencyInput } from "./CurrencyInput";
import { parseMaskedToNumber } from "@/hooks/useCurrency";
import { formatCurrency } from "@/hooks/useFinance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ESM_META: Record<ESM, { label: string; emoji: string; cls: string }> = {
  E: { label: "Essencial", emoji: "👍", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  S: { label: "Supérfluo", emoji: "👎", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  M: { label: "Meta", emoji: "🎯", cls: "border-primary/40 bg-primary/10 text-primary" },
};


const CERBASI_AVATAR = "https://jornadadoprogresso.com/wp-content/uploads/2026/05/gustavo-cerbasi.png";

type JourneyAudio = {
  id: string;
  title: string;
  src: string;
  xp: number;
};

const DAY1_INTRO_AUDIOS: JourneyAudio[] = [
  {
    id: "dia1-intro1",
    title: "Introdução da Jornada",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/dia1-intro1-1.wav",
    xp: 10,
  },
  {
    id: "dia1-intro2",
    title: "Consciência Financeira",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/dia1-intro2-1.wav",
    xp: 10,
  },
];

const PILAR1_AUDIOS: JourneyAudio[] = [
  {
    id: "pilar1-aud1",
    title: "Orientação do Pilar 1",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/pilar1-aud1-1.wav",
    xp: 15,
  },
  {
    id: "dia1-aud1",
    title: "Clareza Antes do Crescimento",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/dia1-aud1-1.wav",
    xp: 10,
  },
  {
    id: "dia1-aud2",
    title: "Dinheiro Amplifica Comportamento",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/dia1-aud2-1.wav",
    xp: 10,
  },
  {
    id: "dia1-aud3",
    title: "Orçamento Revela Identidade",
    src: "https://jornadadoprogresso.com/wp-content/uploads/2026/05/dia1-aud3-1.wav",
    xp: 10,
  },
];

function AudioListSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  audios,
  playingAudio,
  completedAudios,
  playbackRate,
  onPlaybackRateChange,
  onPlay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  audios: JourneyAudio[];
  playingAudio: string | null;
  completedAudios: string[];
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onPlay: (audio: JourneyAudio) => void;
}) {
  const completedCount = audios.filter((audio) => completedAudios.includes(audio.id)).length;
  const totalXp = audios.reduce((sum, audio) => sum + audio.xp, 0);
  const progress = Math.round((completedCount / audios.length) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto h-auto max-h-[80svh] w-[calc(100%-1rem)] max-w-[430px] overflow-y-auto rounded-t-[2rem] border-0 bg-background px-4 pb-7 pt-6 shadow-2xl sm:px-5 [&>button]:hidden"
      >
        <SheetHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={CERBASI_AVATAR}
                alt="Gustavo Cerbasi"
                className="h-12 w-12 shrink-0 rounded-full border border-primary/25 object-cover shadow-soft"
              />
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg leading-tight">{title}</SheetTitle>
                <SheetDescription className="text-xs leading-snug text-muted-foreground">
                  {subtitle}
                </SheetDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background/95 text-primary shadow-soft backdrop-blur transition-smooth active:scale-95"
              aria-label="Fechar lista de áudios"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-primary">{completedCount}/{audios.length} concluídos</span>
            <span className="text-muted-foreground">{totalXp} XP disponíveis</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">Velocidade do áudio</p>
              <p className="text-[11px] text-muted-foreground">Ajuste o ritmo da orientação</p>
            </div>

            <div className="grid shrink-0 grid-cols-4 rounded-full bg-muted p-1">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onPlaybackRateChange(rate)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-smooth",
                  playbackRate === rate
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {rate === 1 ? "1x" : `${rate}x`}
              </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 pb-[env(safe-area-inset-bottom)]">
          {audios.map((audio) => {
            const isPlaying = playingAudio === audio.id;
            const isCompleted = completedAudios.includes(audio.id);

            return (
              <button
                key={audio.id}
                type="button"
                onClick={() => onPlay(audio)}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-smooth active:scale-[0.98]",
                  isCompleted ? "border-amber-400/35 bg-amber-400/5" : "border-border"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isCompleted && <Trophy className="h-4 w-4 shrink-0 text-amber-500" />}
                    <p className="truncate text-sm font-bold text-foreground">{audio.title}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">+{audio.xp} XP</span>
                    {isCompleted && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-600">Concluído</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <span className="flex h-8 items-end gap-0.5 rounded-full bg-primary/10 px-2 py-1.5" aria-hidden="true">
                      <span className="h-2 w-1 animate-pulse rounded-full bg-primary" />
                      <span className="h-4 w-1 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                      <span className="h-3 w-1 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                    </span>
                  )}

                  <span className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full shadow-glow transition-smooth group-active:scale-95",
                    isCompleted ? "bg-amber-400 text-amber-950" : "bg-primary text-primary-foreground"
                  )}>
                    {isPlaying ? <Pause className="h-4 w-4" strokeWidth={3} /> : <Play className="ml-0.5 h-4 w-4" strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Day1Experience({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const {
    snapshot,
    missions,
    progress,
    doneCount,
    allDone,
    pendingCard,
    xp,
    completed,
    expenseTxs,
    esm,
    familyAlignment,
    familyGoal,
    start,
    saveSnapshot,
    classifyTx,
    setFamily,
    dismissCard,
    finish,
  } = useDay1();

  const [hasToday, setHasToday] = useState("");
  const [debt, setDebt] = useState("");
  const [income, setIncome] = useState("");
  const [goal, setGoal] = useState(familyGoal);
  const [showFinal, setShowFinal] = useState(false);
  const [openIntroAudios, setOpenIntroAudios] = useState(false);
  const [openPilarAudios, setOpenPilarAudios] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [completedAudios, setCompletedAudios] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("d21.day1AudiosCompleted") || "[]");
    } catch {
      return [];
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) start();
  }, [open, start]);

  useEffect(() => {
    if (allDone && !completed) {
      finish();
      setShowFinal(true);
    }
  }, [allDone, completed, finish]);

  const handleSnapshot = () => {
    const a = parseMaskedToNumber(hasToday);
    const b = parseMaskedToNumber(debt);
    const c = parseMaskedToNumber(income);
    if (a <= 0 && c <= 0) {
      toast.error("Informe quanto você tem hoje ou quanto entra por mês");
      return;
    }
    saveSnapshot(a, b, c);
    toast.success("Snapshot salvo! Você começou a enxergar.");
  };

  useEffect(() => {
    localStorage.setItem("d21.day1AudiosCompleted", JSON.stringify(completedAudios));
  }, [completedAudios]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleAudioPlay = (audio: JourneyAudio) => {
    const current = audioRef.current;

    if (playingAudio === audio.id && current) {
      current.pause();
      setPlayingAudio(null);
      return;
    }

    if (current) {
      current.pause();
      current.currentTime = 0;
    }

    const nextAudio = new Audio(audio.src);
    nextAudio.playbackRate = playbackRate;
    audioRef.current = nextAudio;
    setPlayingAudio(audio.id);

    nextAudio.play().catch(() => {
      setPlayingAudio(null);
      toast.error("Não consegui reproduzir este áudio.");
    });

    nextAudio.onended = () => {
      setPlayingAudio(null);
      setCompletedAudios((prev) => prev.includes(audio.id) ? prev : [...prev, audio.id]);
      toast.success(`+${audio.xp} XP adquirido. Você evoluiu no Pilar 1.`);
    };
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto h-auto max-h-[80svh] w-[calc(100%-1rem)] max-w-[430px] overflow-y-auto rounded-t-[2rem] border-0 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-5 [&>button]:hidden"
        >
          <div className="absolute right-4 top-4 z-50 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-background/95 text-primary shadow-soft backdrop-blur transition-smooth active:scale-95"
              aria-label="Fechar Dia 1"
            >
              <X className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpenIntroAudios(true)}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-smooth active:scale-95"
              aria-label="Abrir áudios do capítulo"
            >
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-background" />
              <Headphones className="h-4 w-4" />
            </button>
          </div>

          <SheetHeader className="pr-14 text-left">
            <SheetDescription className="sr-only">Conteúdo guiado do Dia 1 da jornada.</SheetDescription>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dia 1 • Capítulo 1</p>
              <SheetTitle className="text-2xl leading-tight">Planeje antes que fique insustentável</SheetTitle>
              <p className="text-xs text-muted-foreground">Inspirado em Gustavo Cerbasi — referência em finanças pessoais</p>
            </div>
          </SheetHeader>

          {/* Quote do mentor */}
          <div className="mt-3 rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 shadow-soft">
            <div className="flex flex-col items-center text-center">
              <img
                src={CERBASI_AVATAR}
                alt="Gustavo Cerbasi"
                className="h-14 w-14 rounded-full border-2 border-primary/20 object-cover shadow-soft"
              />

              <h3 className="mt-2 text-sm font-bold text-foreground">Gustavo Cerbasi</h3>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Casais Inteligentes Enriquecem Juntos
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                  A dor da falta de planejamento
                </span>
              </div>

              <p className="mt-3 text-sm italic leading-relaxed text-foreground">
                “Você já sentiu que, mesmo pagando tudo certinho, o dinheiro nunca sobra?”
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Hoje você vai aprender na prática os 3 pilares do Cerbasi:
                <span className="font-semibold text-foreground">
                  {" "}Orçamento Consciente, Definição de Prioridades e Alinhamento Familiar.
                </span>
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 rounded-2xl bg-secondary p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progresso do Dia 1</span>
              <span className="text-foreground">{doneCount}/{missions.length} • {progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* PILAR 1 — Snapshot */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                <span className="rounded bg-primary/15 px-1.5 py-0.5">Pilar 1</span>
                Orçamento Consciente
              </h3>

              <button
                type="button"
                onClick={() => setOpenPilarAudios(true)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-smooth active:scale-95"
                aria-label="Abrir áudios do Pilar 1"
              >
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-background" />
                <Headphones className="h-4 w-4" />
              </button>
            </div>
            {!snapshot ? (
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h4 className="text-base font-semibold">Onde você está pisando?</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="has">Tem hoje</Label>
                    <CurrencyInput id="has" value={hasToday} onChange={setHasToday} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="debt">Deve</Label>
                    <CurrencyInput id="debt" value={debt} onChange={setDebt} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="income">Quanto entra por mês?</Label>
                  <CurrencyInput id="income" value={income} onChange={setIncome} />
                </div>
                <Button type="button" onClick={handleSnapshot} className="h-11 w-full rounded-xl gradient-primary font-semibold">
                  Salvar snapshot
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Reflexão pessoal — não afeta seu saldo real. “Anote tudo. Entrou? Anota. Saiu? Anota.”
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Check className="h-4 w-4" strokeWidth={3} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Snapshot salvo</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Tem</p>
                    <p className="font-bold">{formatCurrency(snapshot.hasToday)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Deve</p>
                    <p className="font-bold">{formatCurrency(snapshot.debt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Entra/mês</p>
                    <p className="font-bold">{formatCurrency(snapshot.monthlyIncome)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Missões */}
          <div className="mt-4 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" />
              Missões do dia
            </h3>
            <ul className="space-y-2">
              {missions.map((m) => (
                <li key={m.id} className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition-smooth",
                  m.done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                )}>
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    m.done ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {m.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-xs">•</span>}
                  </div>
                  <span className={cn("flex-1 text-sm", m.done ? "font-semibold" : "text-foreground")}>
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA registrar */}
          {!allDone && (
            <div className="mt-4">
              <AddTransactionDialog
                trigger={
                  <Button size="lg" className="h-12 w-full rounded-xl gradient-primary text-base font-semibold">
                    + Registrar entrada ou saída
                  </Button>
                }
              />
            </div>
          )}

          {/* PILAR 2 — Classificador E/S/M */}
          {expenseTxs.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                <span className="rounded bg-primary/15 px-1.5 py-0.5">Pilar 2</span>
                Definição de Prioridades — E / S / M
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Para cada gasto pergunte: <i>“Isso me aproxima da vida que quero ou só me distrai dela?”</i>
              </p>
              <ul className="space-y-2">
                {expenseTxs.slice(0, 6).map((tx) => {
                  const cur = esm[tx.id];
                  return (
                    <li key={tx.id} className="rounded-2xl border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{tx.description || tx.category}</p>
                          <p className="text-[11px] text-muted-foreground">{formatCurrency(tx.amount)} • {tx.category}</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {(["E", "S", "M"] as ESM[]).map((opt) => {
                          const active = cur === opt;
                          const meta = ESM_META[opt];
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => classifyTx(tx.id, opt)}
                              className={cn(
                                "flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-smooth",
                                active ? meta.cls : "border-border bg-background text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <span>{meta.emoji}</span>
                              <span>{meta.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* PILAR 3 — Alinhamento familiar */}
          <div className="mt-5">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
              <span className="rounded bg-primary/15 px-1.5 py-0.5">Pilar 3</span>
              Alinhamento Familiar
            </h3>
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Quem decide o dinheiro com você?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFamily("alone", goal)}
                  className={cn(
                    "rounded-xl border p-3 text-sm font-semibold transition-smooth",
                    familyAlignment === "alone" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  )}
                >
                  Decido sozinho(a)
                </button>
                <button
                  type="button"
                  onClick={() => setFamily("shared", goal)}
                  className={cn(
                    "rounded-xl border p-3 text-sm font-semibold transition-smooth",
                    familyAlignment === "shared" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  )}
                >
                  Divido com alguém
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal">Qual sua primeira meta financeira?</Label>
                <Input
                  id="goal"
                  placeholder="Ex.: reserva de R$ 500"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onBlur={() => familyAlignment && setFamily(familyAlignment, goal)}
                  className="h-11 rounded-xl"
                />
              </div>
              <p className="text-[11px] italic text-muted-foreground">
                “Família unida no planejamento é mais forte na realização.” — Cerbasi
              </p>
            </div>
          </div>

          {/* Card dinâmico */}
          {pendingCard && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug text-foreground">{pendingCard.text}</p>
                  <button
                    onClick={() => dismissCard(pendingCard.id)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          )}

          {xp > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-primary">
              <Trophy className="h-4 w-4" />
              {xp} XP conquistado
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AudioListSheet
        open={openIntroAudios}
        onOpenChange={setOpenIntroAudios}
        title="Áudios do Capítulo"
        subtitle="Gustavo Cerbasi • Consciência Financeira"
        audios={DAY1_INTRO_AUDIOS}
        playingAudio={playingAudio}
        completedAudios={completedAudios}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
        onPlay={handleAudioPlay}
      />

      <AudioListSheet
        open={openPilarAudios}
        onOpenChange={setOpenPilarAudios}
        title="Áudios do Pilar 1"
        subtitle="Orçamento Consciente • Clareza antes do crescimento"
        audios={PILAR1_AUDIOS}
        playingAudio={playingAudio}
        completedAudios={completedAudios}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
        onPlay={handleAudioPlay}
      />

      {/* Final reward */}
      <Sheet open={showFinal} onOpenChange={setShowFinal}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[78svh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-0 px-5 pb-8 pt-6 [&>button]:right-5 [&>button]:top-5 [&>button]:z-50 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:border [&>button]:border-primary/25 [&>button]:bg-background/90 [&>button]:text-primary [&>button]:shadow-soft"
        >
          <SheetHeader>
            <SheetDescription className="sr-only">Recompensa final do Dia 1.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary shadow-glow">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Capítulo 1 concluído • +50 XP</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Você praticou os 3 pilares do Cerbasi: enxergou, priorizou e alinhou. Amanhã: Dave Ramsey e a Bola de Neve das Dívidas.
            </p>
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl font-semibold"
                onClick={() => { setShowFinal(false); onOpenChange(false); navigate("/relatorios"); }}
              >
                Ver meus dados
              </Button>
              <Button
                className="h-12 rounded-xl gradient-primary font-semibold"
                onClick={() => { setShowFinal(false); onOpenChange(false); }}
              >
                Continuar jornada
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
