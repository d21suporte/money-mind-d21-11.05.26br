import { useEffect, useMemo, useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useStorage } from "@/hooks/useStorage";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  ImageIcon,
  ChevronLeft,
  Package,
  Wrench,
  GraduationCap,
  Sprout,
  Volume2,
  MoreVertical,
  Eye,
  ArrowUp,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// tabs removed: now using card-based navigation
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NewSaleDialog } from "@/components/NewSaleDialog";

// ---------- Types ----------
type Contact = { name: string; phone?: string; email?: string; address?: string };
type Product = {
  id: string;
  name: string;
  description?: string;
  cost: number;
  price: number;
  shipping: number;
  image?: string;
  supplier?: Contact;
};

type Recurrence =
  | "diario"
  | "semanal"
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual"
  | "personalizado";
type PayMethod = "pix" | "credito" | "boleto";
type Service = {
  id: string;
  name: string;
  image?: string;
  type: "unico" | "recorrente";
  recurrence?: Recurrence;
  amount: number;
  hireDate: string;
  description?: string;
  methods: PayMethod[];
  client?: Contact;
};

type Infoproduct = {
  id: string;
  name: string;
  image?: string;
  price: number;
  commissionType: "percent" | "fixed";
  commission: number;
  platform: string;
  description?: string;
};

type PaymentMethod = "Pix" | "Crédito" | "Débito" | "Boleto";
type SaleStatus = "Pago" | "Recusado" | "Aguardando" | "Reembolsado" | "Cancelado";
type Sale = {
  id: string;
  productId: string;
  customer: string;
  email?: string;
  phone?: string;
  cpf?: string;
  payment: PaymentMethod;
  status: SaleStatus;
  amount: number;
  date: string;
  refund?: boolean;
  chargeback?: boolean;
};

const FIXED_PLATFORMS = ["Hotmart", "Kiwify", "Cakto"];
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- helpers ----------
function readFile(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const parseMoney = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};
const maskMoney = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        R$
      </span>
      <Input
        inputMode="numeric"
        className="pl-8"
        placeholder={placeholder}
        value={value ? maskMoney(value) : ""}
        onChange={(e) => onChange(parseMoney(e.target.value))}
      />
    </div>
  );
}

function PhotoPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground hover:border-blue-500 hover:text-blue-500"
    >
      {value ? (
        <img src={value} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-6 w-6" />
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onChange((await readFile(f)) || "");
        }}
      />
    </button>
  );
}

// ---------- CSV parse (vendas import) ----------
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((ln) => {
    const cols = ln.split(/[,;]/);
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = (cols[i] || "").trim()));
    return o;
  });
}

// ============================================================
type Cat = "produtos" | "servicos" | "info" | null;

const MeuNegocio = () => {
  const [cat, setCat] = useState<Cat>(null);
  const [addOpen, setAddOpen] = useState<Cat>(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const [products, setProducts] = useStorage<Product[]>("d21.mn.products", []);
  const [services, setServices] = useStorage<Service[]>("d21.mn.services", []);
  const [infos, setInfos] = useStorage<Infoproduct[]>("d21.mn.infoproducts", []);
  const [sales] = useStorage<Sale[]>("d21.mn.sales", []);
  const [extraPlatforms] = useStorage<string[]>("d21.mn.platforms", []);
  const platforms = [...FIXED_PLATFORMS, ...extraPlatforms];

  const addProduct = (p: Product) => {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev],
    );
    setAddOpen(null);
    toast.success("Produto salvo");
  };
  const addService = (s: Service) => {
    setServices((prev) =>
      prev.some((x) => x.id === s.id) ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev],
    );
    setAddOpen(null);
    toast.success("Serviço salvo");
  };
  const addInfo = (i: Infoproduct) => {
    setInfos((prev) =>
      prev.some((x) => x.id === i.id) ? prev.map((x) => (x.id === i.id ? i : x)) : [i, ...prev],
    );
    setAddOpen(null);
    toast.success("Infoproduto salvo");
  };

  const updateProduct = (p: Product) =>
    setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  const updateService = (s: Service) =>
    setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const updateInfo = (i: Infoproduct) =>
    setInfos((prev) => prev.map((x) => (x.id === i.id ? i : x)));
  const removeProduct = (id: string) => setProducts((prev) => prev.filter((x) => x.id !== id));
  const removeService = (id: string) => setServices((prev) => prev.filter((x) => x.id !== id));
  const removeInfo = (id: string) => setInfos((prev) => prev.filter((x) => x.id !== id));

  const [editProd, setEditProd] = useState<Product | null>(null);
  const [editServ, setEditServ] = useState<Service | null>(null);
  const [editInfo, setEditInfo] = useState<Infoproduct | null>(null);

  const totalAtivos = products.length + services.length + infos.length;
  const receitaPotencial =
    products.reduce((s, p) => s + p.price, 0) +
    services.reduce((s, x) => s + x.amount, 0) +
    infos.reduce(
      (s, x) =>
        s + (x.commissionType === "percent" ? (x.price * x.commission) / 100 : x.commission),
      0,
    );
  const margens = products
    .filter((p) => p.cost > 0)
    .map((p) => ((p.price - p.cost) / p.cost) * 100);
  const margemMedia = margens.length ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;

  return (
    <MobileShell>
      {cat === null ? (
        <div className="space-y-4">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-extrabold leading-tight">Construa seus ativos.</h1>
              <p className="text-sm text-muted-foreground">
                Crie fontes de renda. Conquiste liberdade.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <Sprout className="h-6 w-6" />
            </div>
          </header>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                Resumo dos negócios
              </p>
              <button className="shrink-0 text-[11px] font-semibold text-blue-600">
                Ver relatório
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase leading-tight text-muted-foreground">
                  Ativos
                </p>
                <p className="text-lg font-extrabold leading-tight">{totalAtivos}</p>
                <p className="truncate text-[9px] leading-tight text-emerald-600">+2 este mês</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase leading-tight text-muted-foreground">
                  Receita/mês
                </p>
                <p className="truncate text-lg font-extrabold leading-tight">
                  {fmtBRL(receitaPotencial)}
                </p>
                <p className="truncate text-[9px] leading-tight text-muted-foreground">Projeção</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase leading-tight text-muted-foreground">
                  Margem
                </p>
                <p className="text-lg font-extrabold leading-tight">{margemMedia.toFixed(0)}%</p>
                <p className="truncate text-[9px] leading-tight text-emerald-600">
                  {margemMedia >= 30 ? "Muito bom" : "Atenção"}
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 text-xs font-bold">
              GC
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-blue-600">
                DICA DO DIA <span className="text-muted-foreground">• Gustavo Cerbasi</span>
              </p>
              <p className="truncate text-xs">
                "Planeje hoje o ativo que vai gerar liberdade amanhã."
              </p>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Volume2 className="h-4 w-4" />
            </button>
          </section>

          <section>
            <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
              Meus ativos por categoria
            </p>
            <div className="grid grid-cols-1 gap-3 px-1">
              <CatCard
                icon={<Package className="h-5 w-5" />}
                color="amber"
                label="Produtos"
                count={products.length}
                countLabel="ativos cadastrados"
                addLabel="Adicionar Produto"
                onOpen={() => setCat("produtos")}
                onAdd={() => setAddOpen("produtos")}
              />
              <CatCard
                icon={<Wrench className="h-5 w-5" />}
                color="blue"
                label="Serviços"
                count={services.length}
                countLabel="ativos cadastrados"
                addLabel="Adicionar Serviço"
                onOpen={() => setCat("servicos")}
                onAdd={() => setAddOpen("servicos")}
              />
              <CatCard
                icon={<GraduationCap className="h-5 w-5" />}
                color="violet"
                label="Infoprodutos"
                count={infos.length}
                countLabel="ativos cadastrados"
                addLabel="Adicionar Infoproduto"
                onOpen={() => setCat("info")}
                onAdd={() => setAddOpen("info")}
              />
              <CatCard
                icon={<TrendingUp className="h-5 w-5" />}
                color="sales"
                label="Vendas"
                count={sales.filter((s) => s.status === "Pago").length}
                countLabel="vendas realizadas"
                addLabel="Adicionar Venda"
                onOpen={() => setSaleOpen(true)}
                onAdd={() => setSaleOpen(true)}
              />
            </div>
          </section>

          <Dialog open={addOpen === "produtos"} onOpenChange={(o) => !o && setAddOpen(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo produto</DialogTitle>
              </DialogHeader>
              <ProductForm initial={null} onSave={addProduct} />
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen === "servicos"} onOpenChange={(o) => !o && setAddOpen(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo serviço</DialogTitle>
              </DialogHeader>
              <ServiceForm initial={null} onSave={addService} />
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen === "info"} onOpenChange={(o) => !o && setAddOpen(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo infoproduto</DialogTitle>
              </DialogHeader>
              <InfoForm initial={null} platforms={platforms} onSave={addInfo} />
            </DialogContent>
          </Dialog>

          <NewSaleDialog open={saleOpen} onOpenChange={setSaleOpen} />
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-muted-foreground">Seus negócios</p>
            </div>
            <ul className="space-y-2">
              {products.map((p) => (
                <BizCard
                  key={`p-${p.id}`}
                  image={p.image}
                  name={p.name}
                  badge="Produto"
                  badgeColor="emerald"
                  lines={[
                    `Preço: ${fmtBRL(p.price)}`,
                    `Margem: ${p.cost > 0 ? (((p.price - p.cost) / p.cost) * 100).toFixed(0) : 0}% • Receita: ${fmtBRL(p.price)}`,
                  ]}
                  onEdit={() => setEditProd(p)}
                  onDelete={() => {
                    if (confirm("Excluir?")) removeProduct(p.id);
                  }}
                />
              ))}
              {services.map((s) => (
                <BizCard
                  key={`s-${s.id}`}
                  image={s.image}
                  name={s.name}
                  badge="Serviço"
                  badgeColor="blue"
                  lines={[
                    `Tipo: ${s.type === "recorrente" ? "Recorrente" : "Único"} • Preço: ${fmtBRL(s.amount)}`,
                    `Receita: ${fmtBRL(s.amount)}`,
                  ]}
                  onEdit={() => setEditServ(s)}
                  onDelete={() => {
                    if (confirm("Excluir?")) removeService(s.id);
                  }}
                />
              ))}
              {infos.map((i) => (
                <BizCard
                  key={`i-${i.id}`}
                  image={i.image}
                  name={i.name}
                  badge="Infoproduto"
                  badgeColor="violet"
                  lines={[
                    `Plataforma: ${i.platform} • Preço: ${fmtBRL(i.price)}`,
                    `Receita: ${fmtBRL(i.price)}`,
                  ]}
                  onEdit={() => setEditInfo(i)}
                  onDelete={() => {
                    if (confirm("Excluir?")) removeInfo(i.id);
                  }}
                />
              ))}
              {totalAtivos === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum negócio ainda.
                </p>
              )}
            </ul>
            {totalAtivos > 6 && <BackToTop />}
          </section>

          <Dialog open={!!editProd} onOpenChange={(o) => !o && setEditProd(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar produto</DialogTitle>
              </DialogHeader>
              {editProd && (
                <ProductForm
                  initial={editProd}
                  onSave={(p) => {
                    updateProduct(p);
                    setEditProd(null);
                    toast.success("Atualizado");
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={!!editServ} onOpenChange={(o) => !o && setEditServ(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar serviço</DialogTitle>
              </DialogHeader>
              {editServ && (
                <ServiceForm
                  initial={editServ}
                  onSave={(s) => {
                    updateService(s);
                    setEditServ(null);
                    toast.success("Atualizado");
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={!!editInfo} onOpenChange={(o) => !o && setEditInfo(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar infoproduto</DialogTitle>
              </DialogHeader>
              {editInfo && (
                <InfoForm
                  initial={editInfo}
                  platforms={platforms}
                  onSave={(i) => {
                    updateInfo(i);
                    setEditInfo(null);
                    toast.success("Atualizado");
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-3">
          <header className="flex items-center gap-2">
            <button onClick={() => setCat(null)} className="rounded-lg p-1.5 hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold capitalize">
              {cat === "info" ? "Infoprodutos" : cat}
            </h1>
          </header>
          {cat === "produtos" && <ProdutosTab />}
          {cat === "servicos" && <ServicosTab />}
          {cat === "info" && <InfoTab />}
        </div>
      )}
    </MobileShell>
  );
};

const CAT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600",
  blue: "bg-blue-500/15 text-blue-600",
  violet: "bg-violet-500/15 text-violet-600",
  amber: "bg-amber-500/15 text-amber-600",
  sales: "bg-emerald-500/15 text-emerald-600",
};

const COUNT_COLOR: Record<string, string> = {
  amber: "text-amber-500",
  blue: "text-blue-600",
  violet: "text-violet-600",
  sales: "text-emerald-600",
  emerald: "text-emerald-600",
};

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

function CatCard({
  icon,
  color,
  label,
  count,
  countLabel,
  addLabel,
  onOpen,
  onAdd,
  onEdit,
  onDelete,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  count: number;
  countLabel: string;
  addLabel: string;
  onOpen: () => void;
  onAdd: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20";
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
      {/* Ícone + Título em destaque */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          CAT_COLORS[color],
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-base font-extrabold leading-tight">{label}</p>
          <p className={cn("text-lg font-extrabold leading-none", COUNT_COLOR[color])}>{count}</p>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{countLabel}</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 text-[11px] font-bold text-emerald-600 hover:underline"
        >
          + {addLabel}
        </button>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Áudio de ${label}`}
          onClick={() => toast.info(`Áudio-tutorial de ${label}: em breve`)}
          className={iconBtn}
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Ajuda ${label}`}
          onClick={() => toast.info(`Ajuda sobre ${label}: em breve`)}
          className={iconBtn}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Ver todos ${label}`}
          onClick={onOpen}
          className={iconBtn}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Menu ${label}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAdd}>Adicionar</DropdownMenuItem>
            {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Excluir
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onOpen}>Ver todos os lançamentos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function BizCard({
  image,
  name,
  badge,
  badgeColor,
  lines,
  onEdit,
  onDelete,
  onView,
}: {
  image?: string;
  name: string;
  badge: string;
  badgeColor: string;
  lines: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
      {image ? (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
          <img src={image} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
            CAT_COLORS[badgeColor],
          )}
        >
          <Briefcase className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{name}</p>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
              CAT_COLORS[badgeColor],
            )}
          >
            {badge}
          </span>
        </div>
        {lines.map((l, i) => (
          <p key={i} className="truncate text-xs text-muted-foreground">
            {l}
          </p>
        ))}
      </div>
      {(onEdit || onDelete || onView) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

// =================== PRODUTOS ===================
function ProdutosTab() {
  const [items, setItems] = useStorage<Product[]>("d21.mn.products", []);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => items.filter((p) => q === "" || p.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const save = (p: Product) => {
    setItems((prev) =>
      prev.find((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev],
    );
    setOpen(false);
    setEditing(null);
    toast.success("Produto salvo");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="pl-8"
        />
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            Novo produto
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} produto</DialogTitle>
          </DialogHeader>
          <ProductForm initial={editing} onSave={save} />
        </DialogContent>
      </Dialog>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto.</p>
        )}
        {filtered.map((p) => {
          const margin = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
          return (
            <li
              key={p.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
            >
              {p.image ? (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Briefcase className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtBRL(p.cost)} → {fmtBRL(p.price)}
                </p>
                <p className="text-xs">
                  Frete: {fmtBRL(p.shipping)}{" "}
                  <span
                    className={cn(
                      "ml-1 font-semibold",
                      margin >= 0 ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    ({margin.toFixed(0)}%)
                  </span>
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => {
                      if (confirm("Excluir?")) {
                        setItems(items.filter((x) => x.id !== p.id));
                        toast.success("Excluído");
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductForm({
  initial,
  onSave,
}: {
  initial: Product | null;
  onSave: (p: Product) => void;
}) {
  const [f, setF] = useState<Product>(
    initial ?? {
      id: uid(),
      name: "",
      description: "",
      cost: 0,
      price: 0,
      shipping: 0,
      image: "",
      supplier: { name: "" },
    },
  );
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setF((p) => ({ ...p, [k]: v }));
  const setSup = <K extends keyof Contact>(k: K, v: Contact[K]) =>
    setF((p) => ({ ...p, supplier: { ...(p.supplier || { name: "" }), [k]: v } }));

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <PhotoPicker value={f.image} onChange={(v) => set("image", v)} />
        <div className="flex-1">
          <Label>Nome do produto</Label>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Valor de compra</Label>
          <MoneyInput value={f.cost} onChange={(v) => set("cost", v)} />
        </div>
        <div>
          <Label>Valor de venda</Label>
          <MoneyInput value={f.price} onChange={(v) => set("price", v)} />
        </div>
      </div>
      <div>
        <Label>Entrega / Frete</Label>
        <MoneyInput value={f.shipping} onChange={(v) => set("shipping", v)} />
      </div>
      <div className="rounded-xl border border-border p-3">
        <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
          Fornecedor / Proprietário
        </p>
        <div className="space-y-2">
          <Input
            placeholder="Nome"
            value={f.supplier?.name || ""}
            onChange={(e) => setSup("name", e.target.value)}
          />
          <Input
            placeholder="Email"
            value={f.supplier?.email || ""}
            onChange={(e) => setSup("email", e.target.value)}
          />
          <Input
            placeholder="Telefone"
            value={f.supplier?.phone || ""}
            onChange={(e) => setSup("phone", e.target.value)}
          />
          <Input
            placeholder="Endereço"
            value={f.supplier?.address || ""}
            onChange={(e) => setSup("address", e.target.value)}
          />
        </div>
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={() => {
          if (!f.name.trim()) {
            toast.error("Informe o nome do produto");
            return;
          }
          if (!f.price || f.price <= 0) {
            toast.error("Informe o valor de venda do produto");
            return;
          }
          onSave({
            ...f,
            name: f.name.trim(),
            supplier: f.supplier ? { ...f.supplier, name: f.supplier.name.trim() } : f.supplier,
          });
        }}
      >
        Salvar
      </Button>
    </div>
  );
}

// =================== SERVIÇOS ===================
function ServicosTab() {
  const [items, setItems] = useStorage<Service[]>("d21.mn.services", []);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const save = (s: Service) => {
    setItems((prev) =>
      prev.find((x) => x.id === s.id) ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev],
    );
    setOpen(false);
    setEditing(null);
    toast.success("Serviço salvo");
  };

  return (
    <div className="space-y-3">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            Novo serviço
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm initial={editing} onSave={save} />
        </DialogContent>
      </Dialog>
      <ul className="space-y-2">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum serviço.</p>
        )}
        {items.map((s) => (
          <li
            key={s.id}
            className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
          >
            {s.image ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                <img src={s.image} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Briefcase className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{s.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {s.type === "recorrente" ? `Recorrente • ${s.recurrence}` : "Pagamento único"}
              </p>
              <p className="text-xs">
                {fmtBRL(s.amount)} • {s.hireDate}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => {
                    if (confirm("Excluir?")) setItems(items.filter((x) => x.id !== s.id));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceForm({
  initial,
  onSave,
}: {
  initial: Service | null;
  onSave: (s: Service) => void;
}) {
  const [f, setF] = useState<Service>(
    initial ?? {
      id: uid(),
      name: "",
      image: "",
      type: "unico",
      amount: 0,
      hireDate: new Date().toISOString().slice(0, 10),
      description: "",
      methods: ["pix"],
    },
  );
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleMethod = (m: PayMethod) =>
    set("methods", f.methods.includes(m) ? f.methods.filter((x) => x !== m) : [...f.methods, m]);

  const RECS: { v: Recurrence; l: string }[] = [
    { v: "diario", l: "Diário" },
    { v: "semanal", l: "Semanal" },
    { v: "mensal", l: "Mensal" },
    { v: "trimestral", l: "Trimestral" },
    { v: "semestral", l: "Semestral" },
    { v: "anual", l: "Anual" },
    { v: "personalizado", l: "Personalizado" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <PhotoPicker value={f.image} onChange={(v) => set("image", v)} />
        <div className="flex-1">
          <Label>Nome do serviço</Label>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Pagamento</Label>
          <Select value={f.type} onValueChange={(v) => set("type", v as Service["type"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unico">Único</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor</Label>
          <MoneyInput value={f.amount} onChange={(v) => set("amount", v)} />
        </div>
      </div>
      {f.type === "recorrente" && (
        <div>
          <Label>Periodicidade</Label>
          <Select value={f.recurrence || "mensal"} onValueChange={(v) => set("recurrence", v as Recurrence)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECS.map((r) => (
                <SelectItem key={r.v} value={r.v}>
                  {r.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Data de contratação</Label>
        <Input type="date" value={f.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div>
        <Label>Formas de recebimento</Label>
        <div className="mt-1 flex gap-2">
          {(["pix", "credito", "boleto"] as PayMethod[]).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => toggleMethod(m)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold capitalize",
                f.methods.includes(m)
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {m === "credito" ? "Crédito" : m === "pix" ? "Pix" : "Boleto"}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 text-[11px] text-blue-700 dark:text-blue-300">
        Os dados do cliente são coletados ao registrar uma <strong>venda</strong> deste serviço.
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={() => {
          if (!f.name.trim()) {
            toast.error("Informe o nome do serviço");
            return;
          }
          if (!f.amount || f.amount <= 0) {
            toast.error("Informe o valor do serviço");
            return;
          }
          if (!f.hireDate) {
            toast.error("Informe a data de contratação");
            return;
          }
          if (f.methods.length === 0) {
            toast.error("Selecione uma forma de recebimento");
            return;
          }
          onSave({
            ...f,
            name: f.name.trim(),
            recurrence: f.type === "recorrente" ? f.recurrence || "mensal" : undefined,
          });
        }}
      >
        Salvar
      </Button>
    </div>
  );
}

// =================== INFOPRODUTOS ===================
function InfoTab() {
  const [extraPlatforms, setExtraPlatforms] = useStorage<string[]>("d21.mn.platforms", []);
  const [view, setView] = useState<"plataformas" | "taxas">("plataformas");

  const platforms = [...FIXED_PLATFORMS, ...extraPlatforms];
  const addPlatform = () => {
    const n = prompt("Nome da plataforma");
    if (n && n.trim()) setExtraPlatforms([...extraPlatforms, n.trim()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["plataformas", "taxas"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize",
              view === v ? "bg-background shadow" : "text-muted-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "plataformas" && (
        <div className="space-y-2">
          <Button onClick={addPlatform} className="w-full bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" />
            Adicionar plataforma
          </Button>
          <ul className="space-y-1">
            {platforms.map((p) => {
              const fixed = FIXED_PLATFORMS.includes(p);
              return (
                <li
                  key={p}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <span className="text-sm font-semibold">{p}</span>
                  {fixed ? (
                    <span className="text-[10px] uppercase text-muted-foreground">Fixa</span>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const n = prompt("Editar", p);
                          if (n && n.trim())
                            setExtraPlatforms(extraPlatforms.map((x) => (x === p ? n.trim() : x)));
                        }}
                        className="rounded p-1 hover:bg-primary/10"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setExtraPlatforms(extraPlatforms.filter((x) => x !== p))}
                        className="rounded p-1 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {view === "taxas" && <TaxasView platforms={platforms} />}
    </div>
  );
}

type FeeMethod = { percent: number; fixed: number };
type FeeConfig = {
  pix?: FeeMethod;
  credito?: FeeMethod;
  debito?: FeeMethod;
  boleto?: FeeMethod;
  saque?: number;
  liberacaoDias?: number;
};

function TaxasView({ platforms }: { platforms: string[] }) {
  const [fees, setFees] = useStorage<Record<string, FeeConfig>>("d21.mn.platformFees", {});
  const [active, setActive] = useState(platforms[0] ?? "");
  const cfg = fees[active] ?? {};

  const update = (patch: Partial<FeeConfig>) =>
    setFees({ ...fees, [active]: { ...cfg, ...patch } });

  const updateMethod = (m: keyof FeeConfig, patch: Partial<FeeMethod>) => {
    const cur = (cfg[m] as FeeMethod | undefined) ?? { percent: 0, fixed: 0 };
    update({ [m]: { ...cur, ...patch } } as Partial<FeeConfig>);
  };

  if (!platforms.length)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Cadastre uma plataforma primeiro.
      </p>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              active === p
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border bg-card p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Taxas por método</p>
        {(
          [
            ["pix", "Pix"],
            ["credito", "Crédito"],
            ["debito", "Débito"],
            ["boleto", "Boleto"],
          ] as [keyof FeeConfig, string][]
        ).map(([k, label]) => {
          const m = (cfg[k] as FeeMethod | undefined) ?? { percent: 0, fixed: 0 };
          return (
            <div key={k} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
              <span className="text-xs font-semibold">{label}</span>
              <div className="relative">
                <Input
                  inputMode="decimal"
                  value={m.percent || ""}
                  onChange={(e) =>
                    updateMethod(k, { percent: Number(e.target.value.replace(",", ".")) || 0 })
                  }
                  placeholder="%"
                  className="h-9 pr-6 text-sm"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  %
                </span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  R$
                </span>
                <Input
                  inputMode="decimal"
                  value={m.fixed || ""}
                  onChange={(e) =>
                    updateMethod(k, { fixed: Number(e.target.value.replace(",", ".")) || 0 })
                  }
                  placeholder="0,00"
                  className="h-9 pl-7 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-3">
        <div>
          <Label className="text-xs">Taxa de saque (R$)</Label>
          <Input
            inputMode="decimal"
            value={cfg.saque || ""}
            onChange={(e) => update({ saque: Number(e.target.value.replace(",", ".")) || 0 })}
            placeholder="0,00"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Liberação (dias)</Label>
          <Input
            inputMode="numeric"
            value={cfg.liberacaoDias || ""}
            onChange={(e) =>
              update({ liberacaoDias: Number(e.target.value.replace(/\D/g, "")) || 0 })
            }
            placeholder="0"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Estas taxas são usadas no cálculo automático de lucro e margem em "Nova Venda" e nos
        Relatórios.
      </p>
    </div>
  );
}

function InfoProductsView({
  products,
  setProducts,
  platforms,
}: {
  products: Infoproduct[];
  setProducts: (v: Infoproduct[] | ((p: Infoproduct[]) => Infoproduct[])) => void;
  platforms: string[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Infoproduct | null>(null);
  const save = (p: Infoproduct) => {
    setProducts((prev) =>
      prev.find((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev],
    );
    setOpen(false);
    setEditing(null);
    toast.success("Salvo");
  };
  const calcCommission = (p: Infoproduct) =>
    p.commissionType === "percent" ? (p.price * p.commission) / 100 : p.commission;
  return (
    <div className="space-y-2">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1 h-4 w-4" />
            Novo infoproduto
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} infoproduto</DialogTitle>
          </DialogHeader>
          <InfoForm initial={editing} platforms={platforms} onSave={save} />
        </DialogContent>
      </Dialog>
      <ul className="space-y-2">
        {products.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum infoproduto.</p>
        )}
        {products.map((p) => (
          <li key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            {p.image ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Briefcase className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.platform} • {fmtBRL(p.price)}
              </p>
              <p className="text-xs text-emerald-600 font-semibold">
                Comissão: {fmtBRL(calcCommission(p))}{" "}
                {p.commissionType === "percent" && `(${p.commission}%)`}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => {
                    if (confirm("Excluir?")) setProducts(products.filter((x) => x.id !== p.id));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoForm({
  initial,
  platforms,
  onSave,
}: {
  initial: Infoproduct | null;
  platforms: string[];
  onSave: (p: Infoproduct) => void;
}) {
  const [f, setF] = useState<Infoproduct>(
    initial ?? {
      id: uid(),
      name: "",
      image: "",
      price: 0,
      platform: platforms[0],
      commissionType: "percent",
      commission: 0,
      description: "",
    },
  );
  const set = <K extends keyof Infoproduct>(k: K, v: Infoproduct[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const calcCommission =
    f.commissionType === "percent" ? (f.price * f.commission) / 100 : f.commission;
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <PhotoPicker value={f.image} onChange={(v) => set("image", v)} />
        <div className="flex-1">
          <Label>Nome do infoproduto</Label>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Preço</Label>
        <MoneyInput value={f.price} onChange={(v) => set("price", v)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Tipo comissão</Label>
          <Select value={f.commissionType} onValueChange={(v) => set("commissionType", v as Infoproduct["commissionType"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Porcentagem (%)</SelectItem>
              <SelectItem value="fixed">Valor (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{f.commissionType === "percent" ? "% comissão" : "Valor R$"}</Label>
          {f.commissionType === "percent" ? (
            <Input
              type="number"
              inputMode="decimal"
              value={f.commission || ""}
              onChange={(e) => set("commission", +e.target.value)}
            />
          ) : (
            <MoneyInput value={f.commission} onChange={(v) => set("commission", v)} />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Comissão a receber</p>
        <p className="text-lg font-bold text-blue-600">{fmtBRL(calcCommission)}</p>
      </div>
      <div>
        <Label>Plataforma / Hub de pagamento</Label>
        <Select value={f.platform} onValueChange={(v) => set("platform", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={() => {
          if (!f.name.trim()) {
            toast.error("Informe o nome do infoproduto");
            return;
          }
          if (!f.price || f.price <= 0) {
            toast.error("Informe o preço do infoproduto");
            return;
          }
          if (!f.commission || f.commission <= 0) {
            toast.error("Informe a comissão do infoproduto");
            return;
          }
          if (!f.platform.trim()) {
            toast.error("Selecione uma plataforma");
            return;
          }
          onSave({ ...f, name: f.name.trim(), platform: f.platform.trim() });
        }}
      >
        Salvar
      </Button>
    </div>
  );
}

function SalesView({
  sales,
  setSales,
  products,
}: {
  sales: Sale[];
  setSales: (v: Sale[] | ((p: Sale[]) => Sale[])) => void;
  products: Infoproduct[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    cpf: "",
    from: "",
    to: "",
    payment: "todos",
    status: "todos",
  });

  const filtered = sales.filter((s) => {
    if (filters.name && !s.customer.toLowerCase().includes(filters.name.toLowerCase()))
      return false;
    if (filters.email && !(s.email || "").toLowerCase().includes(filters.email.toLowerCase()))
      return false;
    if (filters.cpf && !(s.cpf || "").includes(filters.cpf)) return false;
    if (filters.from && s.date < filters.from) return false;
    if (filters.to && s.date > filters.to) return false;
    if (filters.payment !== "todos" && s.payment !== filters.payment) return false;
    if (filters.status !== "todos" && s.status !== filters.status) return false;
    return true;
  });

  const save = (s: Sale) => {
    setSales((prev) =>
      prev.find((x) => x.id === s.id) ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev],
    );
    setOpen(false);
    setEditing(null);
    toast.success("Venda salva");
  };

  const importFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Use arquivo CSV");
      return;
    }
    const text = await file.text();
    const rows = parseCSV(text);
    let added = 0;
    const newSales: Sale[] = rows
      .map((r) => {
        const status = (r["status"] || "Pago") as SaleStatus;
        const payment = (r["pagamento"] || r["forma"] || "Pix") as PaymentMethod;
        const sale: Sale = {
          id: uid(),
          productId: r["produto"] || "",
          customer: r["cliente"] || r["nome"] || "",
          email: r["email"],
          phone: r["telefone"],
          cpf: r["cpf"],
          payment,
          status,
          amount: parseFloat((r["valor"] || "0").replace(",", ".")) || 0,
          date: r["data"] || new Date().toISOString().slice(0, 10),
        };
        if (sale.customer) added++;
        return sale;
      })
      .filter((s) => s.customer);
    setSales((prev) => [...newSales, ...prev]);
    toast.success(`${added} vendas importadas`);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-1 h-4 w-4" />
              Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nova"} venda</DialogTitle>
            </DialogHeader>
            <SaleForm initial={editing} products={products} onSave={save} />
          </DialogContent>
        </Dialog>
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-3 text-xs font-semibold">
          <Upload className="h-3.5 w-3.5" />
          Importar
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
        </label>
      </div>

      <details className="rounded-xl border border-border bg-card p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase">Filtros</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
          <Input
            placeholder="CPF"
            value={filters.cpf}
            onChange={(e) => setFilters({ ...filters, cpf: e.target.value })}
          />
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <Select
            value={filters.payment}
            onValueChange={(v) => setFilters({ ...filters, payment: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos pgto</SelectItem>
              {["Pix", "Crédito", "Débito", "Boleto"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {["Pago", "Recusado", "Aguardando", "Reembolsado", "Cancelado"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </details>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma venda.</p>
        )}
        {filtered.map((s) => (
          <li key={s.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{s.customer}</p>
                <p className="text-xs text-muted-foreground">
                  {s.payment} • {s.date} • {fmtBRL(s.amount)}
                </p>
                {s.email && <p className="truncate text-[10px] text-muted-foreground">{s.email}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    s.status === "Pago"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : s.status === "Aguardando"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-red-500/15 text-red-600",
                  )}
                >
                  {s.status}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                    className="rounded p-1 hover:bg-primary/10"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Excluir?")) setSales(sales.filter((x) => x.id !== s.id));
                    }}
                    className="rounded p-1 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SaleForm({
  initial,
  products,
  onSave,
}: {
  initial: Sale | null;
  products: Infoproduct[];
  onSave: (s: Sale) => void;
}) {
  const [f, setF] = useState<Sale>(
    initial ?? {
      id: uid(),
      productId: products[0]?.id || "",
      customer: "",
      email: "",
      phone: "",
      cpf: "",
      payment: "Pix",
      status: "Pago",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      refund: false,
      chargeback: false,
    },
  );
  const set = <K extends keyof Sale>(k: K, v: Sale[K]) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <div>
        <Label>Produto</Label>
        <Select value={f.productId} onValueChange={(v) => set("productId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Cliente</Label>
        <Input value={f.customer} onChange={(e) => set("customer", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Email</Label>
          <Input value={f.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>CPF</Label>
          <Input value={f.cpf} onChange={(e) => set("cpf", e.target.value)} />
        </div>
        <div>
          <Label>Valor</Label>
          <MoneyInput value={f.amount} onChange={(v) => set("amount", v)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Pagamento</Label>
          <Select value={f.payment} onValueChange={(v) => set("payment", v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Pix", "Crédito", "Débito", "Boleto"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => set("status", v as SaleStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Pago", "Recusado", "Aguardando", "Reembolsado", "Cancelado"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Data</Label>
        <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
      </div>
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!f.refund}
            onChange={(e) => set("refund", e.target.checked)}
          />
          Reembolso
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!f.chargeback}
            onChange={(e) => set("chargeback", e.target.checked)}
          />
          Chargeback
        </label>
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={() => {
          if (!f.customer.trim()) {
            toast.error("Informe o nome do cliente");
            return;
          }
          if (!f.productId) {
            toast.error("Selecione um infoproduto");
            return;
          }
          if (!f.amount || f.amount <= 0) {
            toast.error("Informe o valor da venda");
            return;
          }
          onSave({ ...f, customer: f.customer.trim() });
        }}
      >
        Salvar
      </Button>
    </div>
  );
}

export default MeuNegocio;
