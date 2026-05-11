import { useEffect, useMemo, useRef, useState } from "react";
import { ICE_BREAKER_AUDIOS, type IceBreakerAudio } from "@/data/iceBreakerAudios";
import { useIceBreakerProgress } from "@/hooks/useIceBreakerProgress";
import { Sparkles, Play, Pause, Lock, Star, ChevronDown, RotateCcw, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStorage } from "@/hooks/useStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import trofeuGold from "@/assets/trofeu-gold.png";

const MENTOR_IMG = "https://jornadadoprogresso.com/wp-content/uploads/2026/04/mentoronline.png";
const VICTORY_SFX = "https://jornadadoprogresso.com/wp-content/uploads/2026/04/victory.wav";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

export function IceBreakerHero() {
  const { state, setProgress, isCompleted, getProgress } = useIceBreakerProgress();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [positions, setPositions] = useStorage<Record<string, number>>("d21.iceBreakerPos", {});
  const [resumePrompt, setResumePrompt] = useState<{ id: string; saved: number } | null>(null);
  const [trophyFor, setTrophyFor] = useState<string | null>(null);

  const total = ICE_BREAKER_AUDIOS.length;
  const completedCount = state.completed.length;
  const allDone = completedCount === total;
  const starsFilled = Math.min(5, Math.floor(completedCount / 2));

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    return state.completed.includes(ICE_BREAKER_AUDIOS[idx - 1].id);
  };

  const playVictory = () => {
    try {
      const a = new Audio(VICTORY_SFX);
      a.volume = 0.7;
      a.play().catch(() => {});
    } catch {}
  };

  const handleComplete = (id: string) => {
    if (state.completed.includes(id)) return;
    setProgress(id, 1);
    playVictory();
    setTrophyFor(id);
    window.setTimeout(() => setTrophyFor(null), 2200);
  };

  const neuOut =
    "shadow-[8px_8px_20px_hsl(165_50%_3%/0.85),_-6px_-6px_16px_hsl(165_30%_14%/0.45)]";
  const neuIn =
    "shadow-[inset_5px_5px_12px_hsl(165_50%_3%/0.8),_inset_-4px_-4px_10px_hsl(165_30%_14%/0.4)]";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-[hsl(165_38%_9%)] text-[hsl(150_20%_96%)]",
        "ring-1 ring-[hsl(var(--primary-glow)/0.55)]",
        neuOut,
        !allDone && "animate-neon-pulse",
      )}
      aria-label="Comece aqui — Áudios Quebra-Gelo do Mentor do Progresso"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[hsl(var(--primary-glow)/0.28)] blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-[hsl(162_73%_38%/0.28)] blur-3xl" />
      </div>

      <div className="relative p-5">
        {/* Botão recolher */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Recolher" : "Expandir"}
          aria-expanded={open}
          className="absolute right-5 top-5 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(165_40%_7%)] text-[hsl(var(--primary-glow))] shadow-[inset_3px_3px_8px_hsl(165_50%_3%/0.8),_inset_-2px_-2px_6px_hsl(165_30%_14%/0.45)] transition-smooth active:scale-95"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")}
            strokeWidth={2.5}
          />
        </button>

        {/* Header — compacto quando recolhido */}
        {!open ? (
          <div className="flex items-center gap-3 pr-10">
            <MentorAvatar playing={!!activeId} compact />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-extrabold leading-tight">
                <span className="truncate">Mentor 21D</span>
                <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 shadow-[0_0_10px_hsl(45_95%_60%/0.35)]">
                  Comece Aqui!
                </span>
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Status:
                </span>
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--primary-glow))] shadow-[0_0_8px_hsl(var(--primary-glow))]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary-glow))]">
                  Online
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--primary-glow))] shadow-[0_0_10px_hsl(var(--primary-glow))]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--primary-glow))]">
                  Mentor do Progresso · Online
                </span>
              </div>
              <h2 className="mt-1.5 flex items-center gap-2 text-2xl font-extrabold leading-none tracking-tight">
                <Sparkles className="h-5 w-5 text-[hsl(var(--primary-glow))]" />
                Comece Aqui
              </h2>

              {/* Linha única: Quebra-Gelo + estrelas + X/10 */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(150_20%_82%)]">
                  Quebra-Gelo
                </span>
                <div
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
                    "bg-[hsl(165_40%_7%)]",
                    neuIn,
                  )}
                  aria-label={`${starsFilled} de 5 estrelas`}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const on = i < starsFilled;
                    return (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3 transition",
                          on
                            ? "fill-[hsl(45_95%_58%)] text-[hsl(45_95%_58%)] drop-shadow-[0_0_4px_hsl(45_95%_58%/0.8)]"
                            : "text-white/20",
                        )}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-medium text-white/60">
                  {completedCount}/{total} conselhos
                </span>
              </div>
            </div>

            <MentorAvatar playing={!!activeId} />
          </div>
        )}

        {/* Lista sequencial */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out",
            open ? "mt-4 max-h-[60rem] opacity-100" : "mt-0 max-h-0 opacity-0",
          )}
        >
          <ul className="flex flex-col gap-2.5">
            {ICE_BREAKER_AUDIOS.map((audio, idx) => (
              <AudioListItem
                key={audio.id}
                audio={audio}
                index={idx}
                unlocked={isUnlocked(idx)}
                completed={isCompleted(audio.id)}
                progress={getProgress(audio.id)}
                isActive={activeId === audio.id}
                savedPosition={positions[audio.id] ?? 0}
                onActivate={() => setActiveId(audio.id)}
                onDeactivate={() => setActiveId(null)}
                onProgress={(r) => setProgress(audio.id, r)}
                onPosition={(t) => setPositions((p) => ({ ...p, [audio.id]: t }))}
                onPauseRequest={(saved) => setResumePrompt({ id: audio.id, saved })}
                onComplete={() => handleComplete(audio.id)}
                neuIn={neuIn}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Popup retomar — estilo app: rounded + transparência */}
      <Dialog open={!!resumePrompt} onOpenChange={(o) => !o && setResumePrompt(null)}>
        <DialogContent className="max-w-xs rounded-3xl border border-white/10 bg-[hsl(165_38%_9%/0.85)] backdrop-blur-xl text-[hsl(150_20%_96%)] shadow-[0_0_40px_hsl(165_50%_3%/0.7)]">
          <DialogHeader>
            <DialogTitle className="text-base">Continuar de onde parou?</DialogTitle>
            <DialogDescription className="text-white/70">
              Você ouviu até{" "}
              {resumePrompt
                ? `${Math.floor(resumePrompt.saved / 60)}:${Math.floor(resumePrompt.saved % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "0:00"}{" "}
              deste bloco.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <button
              type="button"
              onClick={() => {
                if (!resumePrompt) return;
                const id = resumePrompt.id;
                setResumePrompt(null);
                window.dispatchEvent(
                  new CustomEvent("d21:ib-resume", { detail: { id, time: 0, action: "play" } }),
                );
                window.setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("d21:ib-resume", {
                      detail: { id, time: positions[id] ?? 0, action: "play" },
                    }),
                  );
                }, 0);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--primary-glow))] px-4 py-2.5 text-sm font-bold text-[hsl(165_40%_8%)] shadow-[0_0_20px_hsl(var(--primary-glow)/0.6)] active:scale-[0.98]"
            >
              <Play className="h-4 w-4" /> Continuar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!resumePrompt) return;
                const id = resumePrompt.id;
                setResumePrompt(null);
                setPositions((p) => ({ ...p, [id]: 0 }));
                window.dispatchEvent(
                  new CustomEvent("d21:ib-resume", { detail: { id, time: 0, action: "play" } }),
                );
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> Reiniciar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Troféu Gold (apenas no item da lista; aqui só dispara o som) */}
    </section>
  );
}

/* ---------- Item da lista ---------- */

interface AudioListItemProps {
  audio: IceBreakerAudio;
  index: number;
  unlocked: boolean;
  completed: boolean;
  progress: number;
  isActive: boolean;
  savedPosition: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onProgress: (ratio: number) => void;
  onPosition: (time: number) => void;
  onPauseRequest: (saved: number) => void;
  onComplete: () => void;
  neuIn: string;
}

function AudioListItem({
  audio,
  unlocked,
  completed,
  progress,
  isActive,
  savedPosition,
  onActivate,
  onDeactivate,
  onProgress,
  onPosition,
  onPauseRequest,
  onComplete,
  neuIn,
}: AudioListItemProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [xpBurst, setXpBurst] = useState(false);
  const userPausedRef = useRef(false);

  const speed = SPEEDS[speedIdx];

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = speed;
  }, [speed]);

  // Listener para retomar via popup
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; time: number; action: string };
      if (detail.id !== audio.id) return;
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = detail.time;
      userPausedRef.current = false;
      a.play().then(() => {
        setPlaying(true);
        onActivate();
      }).catch(() => {});
    };
    window.addEventListener("d21:ib-resume", handler);
    return () => window.removeEventListener("d21:ib-resume", handler);
  }, [audio.id, onActivate]);

  const togglePlay = async () => {
    if (!unlocked) {
      toast.error("Conclua o áudio anterior para liberar este.");
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    try {
      if (a.paused) {
        if (savedPosition > 5 && a.currentTime < 1 && !completed) {
          onPauseRequest(savedPosition);
          return;
        }
        userPausedRef.current = false;
        await a.play();
        setPlaying(true);
        onActivate();
      } else {
        userPausedRef.current = true;
        a.pause();
      }
    } catch {
      toast.error("Não consegui iniciar o áudio.");
    }
  };

  const onTime = () => {
    const a = audioRef.current;
    if (!a || !a.duration || !isFinite(a.duration)) return;
    const ratio = a.currentTime / a.duration;
    onProgress(ratio);
    onPosition(a.currentTime);
  };

  const onEnded = () => {
    setPlaying(false);
    onDeactivate();
    setXpBurst(true);
    window.setTimeout(() => setXpBurst(false), 1800);
    onComplete();
  };

  const onPause = () => {
    setPlaying(false);
    onDeactivate();
    const a = audioRef.current;
    if (!a) return;
    // Se foi pausa do usuário (não fim) e ainda não completou, mostra popup
    if (userPausedRef.current && !completed && a.currentTime > 2 && a.currentTime < a.duration - 0.5) {
      onPauseRequest(a.currentTime);
    }
    userPausedRef.current = false;
  };

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);

  const pct = Math.round(progress * 100);
  const locked = !unlocked;

  return (
    <li
      className={cn(
        "rounded-2xl bg-[hsl(165_40%_7%)] p-3 transition",
        neuIn,
        locked && "opacity-40 grayscale",
        completed && "ring-1 ring-[hsl(var(--primary-glow)/0.5)]",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Número / status */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black",
            completed
              ? "bg-[hsl(45_95%_58%)] text-[hsl(165_40%_8%)] shadow-[0_0_12px_hsl(45_95%_58%/0.6)]"
              : "bg-[hsl(165_38%_9%)] text-[hsl(var(--primary-glow))]",
          )}
        >
          {completed ? (
            <img src={trofeuGold} alt="" className="h-6 w-6" />
          ) : locked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            audio.number
          )}
        </div>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-bold leading-tight">
            <span className="truncate">{audio.title}</span>
            {xpBurst && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[hsl(45_95%_58%)] px-2 py-0.5 text-[10px] font-black text-[hsl(165_40%_8%)] shadow-[0_0_12px_hsl(45_95%_58%/0.7)] animate-scale-in">
                +15 XP
              </span>
            )}
          </p>
          <p className="truncate text-[11px] text-white/55">
            {audio.duration} · {audio.subtitle}
          </p>
        </div>

        {/* Play */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={locked}
          aria-label={playing ? "Pausar" : "Tocar"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95",
            locked
              ? "bg-white/5 text-white/40"
              : "bg-[hsl(var(--primary-glow))] text-[hsl(165_40%_8%)] shadow-[0_0_16px_hsl(var(--primary-glow)/0.55)]",
          )}
        >
          {playing ? <Pause className="h-4 w-4" strokeWidth={3} /> : <Play className="ml-0.5 h-4 w-4" strokeWidth={3} />}
        </button>
      </div>

      {/* Player expandido quando ativo */}
      {isActive && !locked && (
        <div className="mt-3 space-y-2">
          <SoundWave active={playing} />
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(165_40%_5%)]", neuIn)}>
              <div
                className="h-full bg-[hsl(var(--primary-glow))] shadow-[0_0_10px_hsl(var(--primary-glow))] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-white/60 tabular-nums">{pct}%</span>
            <button
              type="button"
              onClick={cycleSpeed}
              className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-white/80 hover:bg-white/10 transition"
              aria-label="Velocidade de reprodução"
            >
              <Gauge className="h-3 w-3" />
              {speed}x
            </button>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={audio.src}
        preload="none"
        onTimeUpdate={onTime}
        onEnded={onEnded}
        onPause={onPause}
        onPlay={() => setPlaying(true)}
        onContextMenu={(e) => e.preventDefault()}
        className="hidden"
      />
    </li>
  );
}

/* ---------- Sub-componentes ---------- */

function MentorAvatar({ playing, compact = false }: { playing: boolean; compact?: boolean }) {
  const size = compact ? "h-12 w-12" : "h-16 w-16";
  const inner = compact ? "h-10 w-10" : "h-14 w-14";
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", size)}>
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-[hsl(var(--primary-glow)/0.35)] blur-md",
          playing ? "animate-mentor-orb" : "animate-pulse",
        )}
      />
      <div className="absolute inset-0 rounded-full ring-2 ring-[hsl(var(--primary-glow)/0.85)] shadow-[0_0_18px_hsl(var(--primary-glow)/0.6)]" />
      <div className="absolute inset-[3px] rounded-full ring-1 ring-white/15" />
      <img
        src={MENTOR_IMG}
        alt="Mentor do Progresso"
        loading="lazy"
        className={cn("relative rounded-full object-cover", inner)}
      />
      {!compact && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[hsl(var(--primary-glow))] ring-2 ring-[hsl(165_38%_9%)] shadow-[0_0_8px_hsl(var(--primary-glow))]" />
      )}
    </div>
  );
}

function SoundWave({ active }: { active: boolean }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => {
        const h = 30 + Math.round(Math.abs(Math.sin(i * 0.7)) * 70);
        const delay = (i % 8) * 0.08;
        return { h, delay };
      }),
    [],
  );

  return (
    <div className="flex h-10 items-center justify-between gap-[3px] px-1" aria-hidden="true">
      {bars.map((b, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] origin-center rounded-full bg-gradient-to-t from-[hsl(162_73%_38%)] to-[hsl(var(--primary-glow))]",
            active && "shadow-[0_0_6px_hsl(var(--primary-glow))]",
          )}
          style={{
            height: `${b.h}%`,
            animation: active ? `wave-bar 0.9s ease-in-out ${b.delay}s infinite` : undefined,
            opacity: active ? 1 : 0.35,
            transform: active ? undefined : "scaleY(0.4)",
            transition: "opacity 0.3s, transform 0.3s",
          }}
        />
      ))}
      <style>{`@keyframes wave-bar { 0%,100%{transform:scaleY(0.25)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  );
}
