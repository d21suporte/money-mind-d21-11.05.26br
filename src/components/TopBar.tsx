import { Bell, Menu, Home, Target, Plus, BarChart3, User as UserIcon, Sun, Moon, Settings, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import triggerIcon from "@/assets/highlights/trigger.png";
import mentorIcon from "@/assets/highlights/mentor.png";
import appIcon from "@/assets/highlights/app.png";
import planilhasIcon from "@/assets/highlights/planilhas.png";
import checklistsIcon from "@/assets/highlights/checklists.png";
import videoaulasIcon from "@/assets/highlights/videoaulas.png";
import bonusIcon from "@/assets/highlights/bonus.png";
import { useUser, useJourney } from "@/hooks/useFinance";
import { useTheme } from "@/hooks/useTheme";
import { useStorage } from "@/hooks/useStorage";
import { endSession } from "@/hooks/useSession";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@/lib/router-compat";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { user } = useUser();
  const { progress } = useJourney();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useStorage<boolean>("d21.notifications", false);
  const navigate = useNavigate();
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<null | "mentor" | "pwa" | "planilhas" | "checklists" | "videoaulas" | "bonus">(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__d21PWAPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const initials =
    (user.name || "V")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const abbreviateName = (full: string) => {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 2) return full;
    const first = parts[0];
    const last = parts[parts.length - 1];
    const middle = parts.slice(1, -1).map((p) => `${p[0].toUpperCase()}.`).join(" ");
    return `${first} ${middle} ${last}`;
  };
  const displayName = user.name && user.name.length > 22 ? abbreviateName(user.name) : user.name;

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    toast.success(next ? "Notificações ativadas" : "Notificações desativadas");
  };

  return (
    <header
      className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl"
      style={{ paddingTop: "max(env(safe-area-inset-top), 2.25rem)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-5 pt-2">
        {/* Notifications */}
        <button
          type="button"
          onClick={toggleNotifications}
          aria-label="Ativar notificações"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft transition-smooth hover:bg-secondary",
            notifications && "text-primary"
          )}
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {notifications && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Highlights */}
          <button
            type="button"
            onClick={() => setHighlightsOpen(true)}
            aria-label="Destaques do plano"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft transition-smooth hover:bg-secondary text-primary"
          >
            <img src={triggerIcon} alt="" className="h-6 w-6" />
          </button>

          {/* Menu */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft transition-smooth hover:bg-secondary"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Navegação</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" /> Início
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/jornada")}>
              <Target className="mr-2 h-4 w-4" /> Jornada
            </DropdownMenuItem>
            <AddTransactionDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={() => navigate("/relatorios")}>
              <BarChart3 className="mr-2 h-4 w-4" /> Relatórios
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              <UserIcon className="mr-2 h-4 w-4" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Configurações</DropdownMenuLabel>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleTheme(); }}>
              {theme === "dark" ? (
                <><Sun className="mr-2 h-4 w-4" /> Modo claro</>
              ) : (
                <><Moon className="mr-2 h-4 w-4" /> Modo escuro</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleNotifications}>
              <Settings className="mr-2 h-4 w-4" />
              {notifications ? "Desativar notificações" : "Ativar notificações"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                endSession();
                window.dispatchEvent(new Event("d21:session-change"));
                toast.success("Sessão encerrada", { description: "Seus dados ficam salvos." });
                navigate("/bem-vindo", { replace: true });
              }}
              className="text-danger focus:text-danger"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* User info bar */}
      <div className="mx-auto max-w-md px-5 pb-3 pt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{displayName || "Visitante"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email || "sem email"}</p>
          </div>
          <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {progress}/21 dias
          </div>
        </div>
      </div>

      <Dialog open={highlightsOpen} onOpenChange={setHighlightsOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-primary/40 bg-background/70 backdrop-blur-xl shadow-floating data-[state=open]:animate-in data-[state=open]:slide-in-from-top-1/2 data-[state=open]:fade-in-0 data-[state=open]:duration-500">
          <div className="grid grid-cols-3 gap-x-2 gap-y-5 pt-2 divide-x divide-y-0 divide-primary/20">
            {[
              { icon: mentorIcon, title: "Mentor 24H", sub: "Nosso Agente de IA", action: "mentor" as const },
              { icon: appIcon, title: "App Exclusivo", sub: "Mobile e Desktop", action: "pwa" as const },
              { icon: planilhasIcon, title: "Planilhas Financeiras", sub: "+ de 6000 Planilhas", action: "planilhas" as const },
              { icon: checklistsIcon, title: "Checklists PRO", sub: "Protocolos Exclusivos", action: "checklists" as const },
              { icon: videoaulasIcon, title: "Vídeo Aulas", sub: "Aprenda no seu tempo", action: "videoaulas" as const },
              { icon: bonusIcon, title: "Bônus Exclusivos", sub: "Brindes Surpresa.", action: "bonus" as const },
            ].map(({ icon, title, sub, action }) => (
              <button
                type="button"
                key={title}
                onClick={() => setActiveHighlight(action)}
                className="flex flex-col items-center gap-1.5 px-2 text-center transition-smooth hover:opacity-80"
              >
                <img
                  src={icon}
                  alt=""
                  className="h-12 w-12 drop-shadow-[0_0_10px_hsl(var(--primary)/0.7)]"
                  style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.8))" }}
                />
                <p className="text-[12px] font-bold leading-tight">{title}</p>
                <p className="text-[10px] leading-tight text-primary">{sub}</p>
              </button>
            ))}
          </div>
          <DialogTitle className="pt-2 text-center text-[11px] font-semibold tracking-[0.18em] text-foreground/90">
            TUDO O QUE VOCÊ PRECISA PARA <span className="text-primary">EVOLUIR EM 21 DIAS.</span>
          </DialogTitle>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeHighlight} onOpenChange={(o) => !o && setActiveHighlight(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          {(() => {
            const map: Record<string, { icon: string; title: string; description: ReactNode; cta: string; onCta: () => void; }> = {
              mentor: {
                icon: mentorIcon,
                title: "Mentor 24 Horas",
                description: <>Converse com o <strong className="text-foreground">Mentor do Progresso</strong> a qualquer hora. Seu conselheiro pessoal de IA está pronto para te ajudar.</>,
                cta: "Falar com o Mentor do Progresso",
                onCta: () => window.open("https://chatgpt.com/g/g-687434b4fafc81919ae1d9e27d48d27f-o-conselheiro-do-progresso", "_blank", "noopener,noreferrer"),
              },
              pwa: {
                icon: appIcon,
                title: "App Exclusivo",
                description: <>Instale o app na sua tela inicial e acesse a jornada como um app nativo, offline e sem distrações.</>,
                cta: "Instalar agora",
                onCta: () => {
                  const ev = (window as any).__d21PWAPrompt;
                  if (ev && typeof ev.prompt === "function") ev.prompt();
                  else toast.info("Use o menu do navegador → 'Adicionar à tela inicial'.");
                },
              },
              planilhas: {
                icon: planilhasIcon,
                title: "Planilhas Financeiras",
                description: <>Mais de <strong className="text-foreground">6000 planilhas</strong> prontas para organizar receitas, despesas, metas e projeções do seu negócio.</>,
                cta: "Em breve",
                onCta: () => toast.info("Disponível em breve."),
              },
              checklists: {
                icon: checklistsIcon,
                title: "Checklists PRO",
                description: <>Protocolos exclusivos passo a passo para você executar sem travar e evoluir todos os dias.</>,
                cta: "Em breve",
                onCta: () => toast.info("Disponível em breve."),
              },
              videoaulas: {
                icon: videoaulasIcon,
                title: "Vídeo Aulas",
                description: <>Conteúdos curtos e diretos para você aprender no seu tempo, sem enrolação.</>,
                cta: "Em breve",
                onCta: () => toast.info("Disponível em breve."),
              },
              bonus: {
                icon: bonusIcon,
                title: "Bônus Exclusivos",
                description: <>Best sellers em áudio com capa, cortina e playlist integrada. Você chegou até aqui — não pare agora.</>,
                cta: "Acessar Bônus",
                onCta: () => { setActiveHighlight(null); setHighlightsOpen(false); navigate("/audios"); },
              },
            };
            const item = activeHighlight ? map[activeHighlight] : null;
            if (!item) return null;
            return (
              <>
                <DialogHeader>
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <img src={item.icon} alt="" className="h-12 w-12" />
                  </div>
                  <DialogTitle className="text-center">{item.title}</DialogTitle>
                </DialogHeader>
                <p className="text-center text-sm text-muted-foreground">{item.description}</p>
                <button
                  type="button"
                  onClick={item.onCta}
                  className="mt-2 flex h-12 items-center justify-center rounded-2xl gradient-primary font-semibold text-primary-foreground shadow-glow"
                >
                  {item.cta}
                </button>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </header>
  );
}
