import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { JOURNEY_DAYS } from "@/data/journey";
import { DAY_BLUEPRINTS } from "@/data/dayBlueprints";
import { useJourneyDayActions } from "@/hooks/useJourneyDayActions";
import { useJourney } from "@/hooks/useFinance";
import { Check, Sparkles, Target, Trophy, X, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { toast } from "sonner";

interface Props {
  day: number | null;
  onOpenChange: (open: boolean) => void;
}

const MIN_REFLECTION = 30;

export function DayActionExperience({ day, onOpenChange }: Props) {
  const open = day !== null;
  const blueprint = day != null ? DAY_BLUEPRINTS[day] : undefined;
  const meta = day != null ? JOURNEY_DAYS.find((d) => d.day === day) : undefined;

  const { get, toggleStep, setReflection } = useJourneyDayActions();
  const { isCompleted, toggleDay } = useJourney();
  const [openTx, setOpenTx] = useState(false);

  const state = day != null ? get(day) : { steps: {}, reflection: "" };
  const done = day != null ? isCompleted(day) : false;

  const stepsList = blueprint?.steps ?? [];
  const checkedCount = stepsList.filter((s) => state.steps[s.id]).length;
  const reflectionOk = state.reflection.trim().length >= MIN_REFLECTION;

  const totalActions = stepsList.length + 1; // +1 reflexão
  const doneActions = checkedCount + (reflectionOk ? 1 : 0);
  const progress = totalActions === 0 ? 0 : Math.round((doneActions / totalActions) * 100);

  const canFinish = checkedCount === stepsList.length && reflectionOk;

  const handleFinish = () => {
    if (!day) return;
    if (!canFinish) {
      toast.error("Marque todos os passos e escreva sua reflexão.");
      return;
    }
    if (!done) toggleDay(day);
    toast.success("Dia concluído! Você está construindo um novo padrão.");
    onOpenChange(false);
  };

  const handleUndo = () => {
    if (!day) return;
    toggleDay(day);
    toast.info("Dia reaberto.");
  };

  if (!day || !blueprint || !meta) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
        <SheetContent
          side="bottom"
          className="mx-auto h-auto max-h-[85svh] w-[calc(100%-1rem)] max-w-[460px] overflow-y-auto rounded-t-[2rem] border-0 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-5 [&>button]:hidden"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-background/95 text-primary shadow-soft backdrop-blur transition-smooth active:scale-95"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <SheetHeader className="pr-12 text-left">
            <SheetDescription className="sr-only">
              Experiência prática do Dia {day} da jornada.
            </SheetDescription>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Dia {day} • {blueprint.chapter}
            </p>
            <SheetTitle className="text-2xl leading-tight">{meta.title}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Inspirado em <span className="font-semibold text-foreground">{blueprint.mentor}</span>
            </p>
          </SheetHeader>

          {/* Mentor / quote */}
          <div className="mt-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              {blueprint.pillar}
            </p>
            <p className="mt-2 text-sm italic leading-relaxed text-foreground">
              "{blueprint.quote}"
            </p>
          </div>

          {/* Missão */}
          <div className="mt-3 rounded-2xl bg-secondary p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Missão de hoje
            </p>
            <p className="mt-1 text-sm font-semibold">{meta.mission}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
          </div>

          {/* Progresso da ação */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progresso prático</span>
              <span className="text-foreground">{doneActions}/{totalActions} • {progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Checklist de passos */}
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Target className="h-3.5 w-3.5" /> Passos para concluir
            </p>
            {stepsList.map((step) => {
              const checked = !!state.steps[step.id];
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => toggleStep(day, step.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-smooth active:scale-[0.99]",
                    checked
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-smooth",
                      checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40"
                    )}
                  >
                    {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </span>
                  <span className={cn("text-sm leading-snug", checked && "text-muted-foreground line-through")}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA opcional: lançar transação */}
          {blueprint.cta && (
            <button
              type="button"
              onClick={() => setOpenTx(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-elevated transition-smooth active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              {blueprint.cta.label}
            </button>
          )}

          {/* Reflexão */}
          <div className="mt-4">
            <p className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-primary">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Minha aplicação prática
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  reflectionOk ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                {state.reflection.trim().length}/{MIN_REFLECTION}
              </span>
            </p>
            <Textarea
              value={state.reflection}
              onChange={(e) => setReflection(day, e.target.value)}
              placeholder="O que você fez hoje? O que aprendeu? Qual foi a menor dívida que escolheu, qual valor cortou, qual aporte fez…"
              className="mt-2 min-h-[110px] resize-none rounded-2xl border-border bg-card text-sm"
            />
          </div>

          {/* Botão de fechar dia */}
          <div className="mt-5 space-y-2">
            <Button
              size="lg"
              disabled={!canFinish && !done}
              onClick={done ? handleUndo : handleFinish}
              className={cn(
                "h-14 w-full rounded-2xl text-base font-bold",
                done
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : canFinish
                    ? "gradient-primary text-primary-foreground shadow-elevated"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {done ? (
                <>
                  <Trophy className="mr-2 h-4 w-4" /> Dia concluído — reabrir
                </>
              ) : canFinish ? (
                <>
                  <Check className="mr-2 h-5 w-5" strokeWidth={3} /> Concluir dia {day}
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Marque tudo + escreva sua aplicação
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Diálogo de transação acoplado ao fluxo */}
      <AddTransactionDialog open={openTx} onOpenChange={setOpenTx} />
    </>
  );
}
