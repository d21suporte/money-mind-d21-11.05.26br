import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStorage } from "@/hooks/useStorage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  Wrench,
  GraduationCap,
  Calendar,
  FileText,
  Tag,
  Info,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Percent,
  Check,
} from "lucide-react";

// ---- Tipos compartilhados (mantêm compat com d21.mn.*) ----
type SaleCategory = "produtos" | "servicos" | "info";
type Payment = "Pix" | "Crédito" | "Débito" | "Boleto";
type SaleStatus = "Pago" | "Aguardando" | "Recusado" | "Reembolsado" | "Cancelado";

type Asset = { id: string; name: string; price?: number; cost?: number; amount?: number; platform?: string };

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  doc?: string; // CPF/CNPJ
  createdAt: string;
  lastSaleAt: string;
  salesCount: number;
  totalSpent: number;
};

type Sale = {
  id: string;
  category: SaleCategory;
  assetId: string;
  productId: string; // legacy
  date: string;
  amount: number;
  quantity: number;
  payment: Payment;
  fees: number;
  profit: number;
  note?: string;
  status: SaleStatus;
  customerId?: string;
  customer?: string;
  email?: string;
  phone?: string;
  cpf?: string;
};

type FeeMethod = { percent: number; fixed: number };
type FeeConfig = {
  pix?: FeeMethod;
  credito?: FeeMethod;
  debito?: FeeMethod;
  boleto?: FeeMethod;
  saque?: number;
  liberacaoDias?: number;
};

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseMoney = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d ? Number(d) / 100 : 0;
};
const maskMoney = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const maskPhone = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskDoc = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const customerKey = (c: { doc?: string; email?: string; phone?: string; name: string }) =>
  c.doc?.replace(/\D/g, "") ||
  c.email?.trim().toLowerCase() ||
  (c.phone ? c.name.trim().toLowerCase() + "|" + c.phone.replace(/\D/g, "") : c.name.trim().toLowerCase());
const CATS: { key: SaleCategory; label: string; icon: any; color: string }[] = [
  { key: "produtos", label: "Produtos", icon: Package, color: "bg-amber-500/15 text-amber-600" },
  { key: "servicos", label: "Serviços", icon: Wrench, color: "bg-blue-500/15 text-blue-600" },
  { key: "info", label: "Infoprodutos", icon: GraduationCap, color: "bg-violet-500/15 text-violet-600" },
];

export function NewSaleDialog({
  open,
  onOpenChange,
  initialCategory,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialCategory?: SaleCategory;
}) {
  const [products] = useStorage<Asset[]>("d21.mn.products", []);
  const [services] = useStorage<Asset[]>("d21.mn.services", []);
  const [infos] = useStorage<Asset[]>("d21.mn.infoproducts", []);
  const [sales, setSales] = useStorage<Sale[]>("d21.mn.sales", []);
  const [customers, setCustomers] = useStorage<Customer[]>("d21.mn.customers", []);
  const [fees] = useStorage<Record<string, FeeConfig>>("d21.mn.platformFees", {});

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<SaleCategory | "">(initialCategory ?? "");
  const [assetId, setAssetId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<Payment>("Pix");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  // Cliente
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cDoc, setCDoc] = useState("");

  const assetsByCat = useMemo<Asset[]>(() => {
    if (category === "produtos") return products;
    if (category === "servicos") return services;
    if (category === "info") return infos;
    return [];
  }, [category, products, services, infos]);

  const selected = assetsByCat.find((a) => a.id === assetId);
  const unitPrice = selected?.price ?? selected?.amount ?? 0;
  const baseAmount = amount || unitPrice * quantity;

  // Aplica taxas (caso o ativo tenha plataforma e exista FeeConfig)
  const platform = selected?.platform;
  const feeCfg = platform ? fees[platform] : undefined;
  const methodKey: keyof FeeConfig =
    payment === "Pix" ? "pix" : payment === "Crédito" ? "credito" : payment === "Débito" ? "debito" : "boleto";
  const m = feeCfg?.[methodKey] as FeeMethod | undefined;
  const taxas = m ? (baseAmount * (m.percent || 0)) / 100 + (m.fixed || 0) : 0;
  const custo = (selected?.cost ?? 0) * quantity;
  const lucro = baseAmount - taxas - custo;
  const margem = baseAmount > 0 ? (lucro / baseAmount) * 100 : 0;

  const reset = () => {
    setStep(1);
    setCategory(initialCategory ?? "");
    setAssetId("");
    setDate(new Date().toISOString().slice(0, 10));
    setQuantity(1);
    setPayment("Pix");
    setAmount(0);
    setNote("");
    setCName("");
    setCEmail("");
    setCPhone("");
    setCDoc("");
  };

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const canStep1 = category && assetId && cName.trim().length >= 2;
  const canStep2 = baseAmount > 0;

  const save = () => {
    if (!category || !assetId) return;
    if (!cName.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    // Atualiza/insere cliente na base local
    let customerId: string | undefined;
    const nowIso = new Date().toISOString();
    const incoming = { name: cName.trim(), email: cEmail.trim() || undefined, phone: cPhone || undefined, doc: cDoc || undefined };
    const key = customerKey(incoming);
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => customerKey(c) === key);
      if (idx >= 0) {
        const updated = [...prev];
        const cur = updated[idx];
        customerId = cur.id;
        updated[idx] = {
          ...cur,
          name: incoming.name,
          email: incoming.email ?? cur.email,
          phone: incoming.phone ?? cur.phone,
          doc: incoming.doc ?? cur.doc,
          lastSaleAt: nowIso,
          salesCount: (cur.salesCount || 0) + 1,
          totalSpent: (cur.totalSpent || 0) + baseAmount,
        };
        return updated;
      }
      const newC: Customer = {
        id: crypto.randomUUID(),
        ...incoming,
        createdAt: nowIso,
        lastSaleAt: nowIso,
        salesCount: 1,
        totalSpent: baseAmount,
      };
      customerId = newC.id;
      return [newC, ...prev];
    });

    const sale: Sale = {
      id: crypto.randomUUID(),
      category,
      assetId,
      productId: assetId,
      date,
      amount: baseAmount,
      quantity,
      payment,
      fees: taxas,
      profit: lucro,
      note: note.trim() || undefined,
      status: "Pago",
      customerId,
      customer: incoming.name,
      email: incoming.email,
      phone: incoming.phone,
      cpf: incoming.doc,
    };
    setSales([sale, ...sales]);
    toast.success("Venda registrada");
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-lg">Nova Venda</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Registre uma nova venda vinculada a um ativo.
          </p>
        </DialogHeader>

        {/* Stepper */}
        <div className="border-b px-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            {[
              { n: 1, label: "Dados" },
              { n: 2, label: "Financeiro" },
              { n: 3, label: "Confirmação" },
            ].map((s) => (
              <div key={s.n} className="flex flex-1 flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                      step >= s.n
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.n}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      step >= s.n ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-1.5 h-0.5 w-full",
                    step >= s.n ? "bg-emerald-500" : "bg-muted",
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-4 pb-4">
          {step === 1 && (
            <>
              {/* 1. Categoria + ativo */}
              <section className="rounded-2xl border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold">1. Selecione o ativo vendido</p>
                </div>
                <Label className="text-xs">Categoria do ativo *</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CATS.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          setCategory(c.key);
                          setAssetId("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition",
                          active
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border hover:border-emerald-300",
                        )}
                      >
                        <span
                          className={cn("flex h-9 w-9 items-center justify-center rounded-lg", c.color)}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                <Label className="mt-3 block text-xs">Ativo *</Label>
                <Select
                  value={assetId}
                  onValueChange={setAssetId}
                  disabled={!category}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        category ? "Selecione o ativo vendido" : "Escolha a categoria primeiro"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assetsByCat.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground">
                        Nenhum ativo cadastrado nesta categoria.
                      </div>
                    ) : (
                      assetsByCat.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} {(a.price || a.amount) ? `· ${fmtBRL((a.price || a.amount)!)}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="mt-3 flex gap-2 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    As vendas são vinculadas aos ativos cadastrados. Selecione a categoria e o
                    ativo para continuar.
                  </p>
                </div>
              </section>

              {/* 2. Data */}
              <section className="rounded-2xl border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold">2. Data da venda</p>
                </div>
                <Label className="text-xs">Data da venda *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </section>

              {/* 3. Info gerais */}
              <section className="rounded-2xl border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold">3. Informações gerais</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Quantidade *</Label>
                    <div className="mt-1 flex items-center rounded-xl border">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, Number(e.target.value.replace(/\D/g, "") || 1)))
                        }
                        className="h-9 w-full bg-transparent text-center text-sm font-semibold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Forma de pagamento</Label>
                    <Select value={payment} onValueChange={(v) => setPayment(v as Payment)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Pix", "Crédito", "Débito", "Boleto"] as Payment[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Label className="mt-3 block text-xs">Observação (opcional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="Adicione uma observação sobre esta venda..."
                  className="mt-1 min-h-[72px]"
                />
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {note.length}/200
                </p>
              </section>

              {/* 4. Cliente */}
              <section className="rounded-2xl border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold">4. Dados do cliente</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Nome *</Label>
                    <Input
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Telefone</Label>
                      <Input
                        value={cPhone}
                        onChange={(e) => setCPhone(maskPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        inputMode="numeric"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CPF / CNPJ</Label>
                      <Input
                        value={cDoc}
                        onChange={(e) => setCDoc(maskDoc(e.target.value))}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Os dados ficam salvos localmente no seu dispositivo e alimentam sua base de clientes.
                </p>
              </section>
            </>
          )}

          {step === 2 && (
            <section className="rounded-2xl border bg-card p-3">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-bold">Detalhes financeiros</p>
              </div>
              <Label className="text-xs">Valor da venda (unitário) *</Label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <Input
                  inputMode="numeric"
                  className="pl-8"
                  placeholder={unitPrice ? maskMoney(unitPrice) : "0,00"}
                  value={amount ? maskMoney(amount) : ""}
                  onChange={(e) => setAmount(parseMoney(e.target.value))}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sugerido pelo cadastro: {fmtBRL(unitPrice)} · Quantidade: {quantity}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <ResumeCard
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Valor da venda"
                  value={fmtBRL(baseAmount)}
                  color="emerald"
                />
                <ResumeCard
                  icon={<Minus className="h-4 w-4" />}
                  label="Taxas e custos"
                  value={fmtBRL(taxas + custo)}
                  color="rose"
                />
                <ResumeCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Lucro estimado"
                  value={fmtBRL(lucro)}
                  color="violet"
                />
                <ResumeCard
                  icon={<Percent className="h-4 w-4" />}
                  label="Margem"
                  value={`${margem.toFixed(0)}%`}
                  color="blue"
                />
              </div>
              {!feeCfg && platform && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Configure as taxas da plataforma <strong>{platform}</strong> em
                  Infoprodutos → Taxas para um cálculo preciso.
                </p>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border bg-card p-3">
              <div className="mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-bold">Confirmação</p>
              </div>
              <ul className="space-y-1.5 text-sm">
                <Row k="Categoria" v={CATS.find((c) => c.key === category)?.label ?? "—"} />
                <Row k="Ativo" v={selected?.name ?? "—"} />
                <Row k="Data" v={date.split("-").reverse().join("/")} />
                <Row k="Quantidade" v={String(quantity)} />
                <Row k="Pagamento" v={payment} />
                <Row k="Valor" v={fmtBRL(baseAmount)} />
                <Row k="Taxas + custos" v={fmtBRL(taxas + custo)} />
                <Row k="Lucro" v={fmtBRL(lucro)} highlight />
                <Row k="Margem" v={`${margem.toFixed(0)}%`} />
              </ul>
            </section>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {step === 1 ? "Continuar para detalhes financeiros" : "Continuar"}{" "}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={save}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                <Check className="mr-1 h-4 w-4" /> Salvar venda
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResumeCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "rose" | "violet" | "blue";
}) {
  const map = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    rose: "bg-rose-500/10 text-rose-500",
    violet: "bg-violet-500/10 text-violet-600",
    blue: "bg-blue-500/10 text-blue-600",
  } as const;
  return (
    <div className="flex flex-col items-center rounded-xl bg-muted/40 p-2">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", map[color])}>
        {icon}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-extrabold", map[color].split(" ")[1])}>{value}</p>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <li className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-none">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className={cn("text-sm font-semibold", highlight && "text-emerald-600")}>{v}</span>
    </li>
  );
}
