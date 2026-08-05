import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CreditCard, Wallet, Building2, DollarSign, CalendarDays, Repeat, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, isAfter, differenceInDays, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

type BillKind = "subscription" | "installment" | "financing" | "debt" | "card";
type Nature = "fixed" | "variable";

interface UnifiedBill {
  id: string;
  name: string;
  value: number;
  dueDate: Date;
  kind: BillKind;
  nature: Nature;
  meta?: string;
}

const KIND_META: Record<BillKind, { label: string; icon: React.ReactNode; className: string }> = {
  subscription: { label: "Assinatura", icon: <CreditCard className="w-4 h-4" />, className: "text-blue-500 bg-blue-500/10" },
  installment:  { label: "Parcela",    icon: <Wallet className="w-4 h-4" />,     className: "text-emerald-500 bg-emerald-500/10" },
  financing:    { label: "Financiamento", icon: <Building2 className="w-4 h-4" />, className: "text-violet-500 bg-violet-500/10" },
  card:         { label: "Fatura de cartão", icon: <Receipt className="w-4 h-4" />, className: "text-primary bg-primary/10" },
  debt:         { label: "Debto",      icon: <DollarSign className="w-4 h-4" />,  className: "text-amber-500 bg-amber-500/10" },
};

function monthlyValue(value: number, frequency?: string) {
  const v = Number(value) || 0;
  switch (frequency) {
    case "annual": return v / 12;
    case "quarterly": return v / 3;
    case "weekly": return v * 4;
    case "daily": return v * 30;
    default: return v;
  }
}

function nextRenewal(dateStr: string): Date {
  const d = parseISO(dateStr);
  const now = new Date();
  let next = d;
  while (isAfter(now, next)) next = addMonths(next, 1);
  return next;
}

interface UnifiedBillsProps {
  subscriptions: any[];
}

export function UnifiedBills({ subscriptions }: UnifiedBillsProps) {
  const { user } = useAuth();
  const [view, setView] = useState<"all" | "fixed" | "variable">("all");

  const { data: installments = [] } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("card_installments").select("*").eq("user_id", user?.id).eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: financings = [] } = useQuery({
    queryKey: ["financings", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("financings").select("*").eq("user_id", user?.id).eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("debts").select("*").eq("user_id", user?.id).eq("is_paid", false);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: cardBills = [] } = useQuery({
    queryKey: ["credit_card_bills", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("credit_card_bills").select("*").eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const bills = useMemo<UnifiedBill[]>(() => {
    const list: UnifiedBill[] = [];
    const now = new Date();

    subscriptions.forEach((s: any) => {
      list.push({
        id: `s-${s.id}`,
        name: s.name,
        value: monthlyValue(Number(s.value), s.frequency),
        dueDate: s.renewal_date ? nextRenewal(s.renewal_date) : now,
        kind: "subscription",
        nature: "fixed",
        meta: s.frequency,
      });
    });

    installments.forEach((i: any) => {
      const day = Math.min(Math.max(i.due_day || 1, 1), 28);
      const due = new Date(now.getFullYear(), now.getMonth(), day);
      if (isAfter(now, due)) due.setMonth(due.getMonth() + 1);
      list.push({
        id: `i-${i.id}`,
        name: i.name,
        value: Number(i.installment_value) || 0,
        dueDate: due,
        kind: "installment",
        nature: "fixed",
        meta: `${i.current_installment}/${i.total_installments}`,
      });
    });

    financings.forEach((f: any) => {
      const day = Math.min(Math.max(f.due_day || 1, 1), 28);
      const due = new Date(now.getFullYear(), now.getMonth(), day);
      if (isAfter(now, due)) due.setMonth(due.getMonth() + 1);
      list.push({
        id: `f-${f.id}`,
        name: f.name,
        value: Number(f.monthly_payment ?? f.installment_value ?? 0),
        dueDate: due,
        kind: "financing",
        nature: "fixed",
        meta: f.institution || undefined,
      });
    });

    debts.forEach((d: any) => {
      list.push({
        id: `d-${d.id}`,
        name: d.debt_name || d.person_name,
        value: Number(d.amount) || 0,
        dueDate: d.payment_date ? parseISO(d.payment_date) : now,
        kind: "debt",
        nature: "variable",
        meta: d.debt_type === "i_owe" ? "Eu devo" : "Me devem",
      });
    });

    cardBills.forEach((c: any) => {
      if (c.is_paid) return;
      const ref = parseISO(c.reference_month);
      list.push({
        id: `c-${c.id}`,
        name: `${c.card_name} · ${format(ref, "MMM/yy", { locale: ptBR })}`,
        value: Number(c.amount) || 0,
        dueDate: c.due_date ? parseISO(c.due_date) : ref,
        kind: "card",
        nature: "variable",
        meta: "fatura do mês",
      });
    });

    return list.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [subscriptions, installments, financings, debts, cardBills]);

  const filtered = view === "all" ? bills : bills.filter(b => b.nature === view);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthBills = bills.filter(b => b.dueDate >= monthStart && b.dueDate <= monthEnd);

  const totals = {
    fixed: bills.filter(b => b.nature === "fixed").reduce((s, b) => s + b.value, 0),
    variable: bills.filter(b => b.nature === "variable").reduce((s, b) => s + b.value, 0),
    month: monthBills.reduce((s, b) => s + b.value, 0),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Todas as faturas
            <Badge variant="secondary" className="ml-1">{bills.length}</Badge>
          </CardTitle>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Tudo</TabsTrigger>
              <TabsTrigger value="fixed" className="gap-1"><Repeat className="w-3 h-3" /> Fixos</TabsTrigger>
              <TabsTrigger value="variable" className="gap-1"><Zap className="w-3 h-3" /> Avulsos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TotalPill label="Gastos fixos / mês" value={totals.fixed} icon={<Repeat className="w-4 h-4" />} tone="primary" />
          <TotalPill label="Avulsos abertos" value={totals.variable} icon={<Zap className="w-4 h-4" />} tone="accent" />
          <TotalPill label="Este mês" value={totals.month} icon={<CalendarDays className="w-4 h-4" />} tone="emerald" />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma fatura para exibir</div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map((b) => {
              const km = KIND_META[b.kind];
              const days = differenceInDays(b.dueDate, new Date());
              const dueLabel = days < 0 ? `Atrasada ${Math.abs(days)}d` : days === 0 ? "Hoje" : days <= 7 ? `Em ${days}d` : format(b.dueDate, "dd MMM", { locale: ptBR });
              const urgent = days >= 0 && days <= 3;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card/40 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${km.className}`}>
                      {km.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{km.label}</span>
                        {b.meta && <span>• {b.meta}</span>}
                        <span>• {b.nature === "fixed" ? "Fixo" : "Avulso"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">R$ {b.value.toFixed(2)}</p>
                    <p className={`text-xs ${urgent ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>{dueLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TotalPill({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "primary" | "accent" | "emerald" }) {
  const toneClass = {
    primary: "from-primary/10 to-primary/5 text-primary",
    accent: "from-amber-500/10 to-amber-500/5 text-amber-500",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-500",
  }[tone];
  return (
    <div className={`p-3 rounded-xl bg-gradient-to-br ${toneClass} border`}>
      <div className="flex items-center gap-2 text-xs opacity-80">{icon}<span>{label}</span></div>
      <p className="text-xl font-bold mt-1">R$ {value.toFixed(2)}</p>
    </div>
  );
}
