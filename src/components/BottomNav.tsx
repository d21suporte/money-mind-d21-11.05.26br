import { NavLink } from "@/lib/router-compat";
import { Home, Target, BarChart3, Briefcase, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionDialog } from "./AddTransactionDialog";

const leftTabs = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/jornada", label: "Jornada", icon: Target },
];

const rightTabs = [
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/meu-negocio", label: "Meu Negócio", icon: Briefcase },
];

function TabLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Home; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }: { isActive: boolean }) =>
        cn(
          "group flex h-full w-full flex-col items-center justify-center gap-1 self-center text-center transition-smooth hover:text-primary",
          isActive ? "text-primary" : "text-muted-foreground"
        )
      }
      aria-label={label}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <Icon
            className={cn(
              "h-5 w-5 mx-auto shrink-0 transition-smooth group-hover:scale-110 group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]",
              isActive && "scale-110 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span
            className={cn(
              "block w-full text-center text-[10px] leading-none",
              isActive && "font-semibold text-primary"
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl safe-bottom">
      <div className="relative mx-auto grid h-16 w-full max-w-md grid-cols-5 items-center px-1 py-1">
        {leftTabs.map((t) => (
          <div key={t.to} className="flex h-full items-center justify-center">
            <TabLink {...t} />
          </div>
        ))}

        {/* Center floating action button + label */}
        <div className="flex h-full flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <AddTransactionDialog
              trigger={
                <button
                  type="button"
                  aria-label="Novo Lançamento"
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                    boxShadow: "0px 8px 20px rgba(0,0,0,0.18)",
                  }}
                  className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-smooth hover:opacity-90 active:scale-95"
                >
                  <Plus className="h-6 w-6 text-white" strokeWidth={2.75} />
                </button>
              }
            />
            <span className="mt-1 text-[10px] font-semibold leading-none text-primary">
              Novo
            </span>
          </div>
        </div>

        {rightTabs.map((t) => (
          <div key={t.to} className="flex h-full items-center justify-center">
            <TabLink {...t} />
          </div>
        ))}
      </div>
    </nav>
  );
}
