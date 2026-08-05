import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  Wallet,
  TrendingUp,
  Calendar,
  CheckSquare,
  DollarSign,
  PiggyBank,
  Receipt,
  Building2,
  Flame,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  format,
  differenceInDays,
  startOfMonth,
  subMonths,
  addMonths,
  parseISO,
  isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  renewal_date: string;
}

interface FinancialOverviewProps {
  subscriptions: Subscription[];
}

type SourceKey = "subscription" | "installment" | "financing" | "card" | "debt";

const SOURCES: { key: SourceKey; label: string; color: string }[] = [
  { key: "subscription", label: "Assinaturas", color: "hsl(var(--primary))" },
  { key: "installment", label: "Parcelas", color: "#10b981" },
  { key: "financing", label: "Financiamentos", color: "#8b5cf6" },
  { key: "card", label: "Faturas de cartão", color: "#f59e0b" },
  { key: "debt", label: "Debtos", color: "#ef4444" },
];

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`;

function monthlyValue(value: number, frequency?: string) {
  const v = Number(value) || 0;
  switch (frequency) {
    case "annual":
      return v / 12;
    case "quarterly":
      return v / 3;
    case "weekly":
      return v * 4;
    case "daily":
      return v * 30;
    default:
      return v;
  }
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};

export function FinancialOverview({ subscriptions }: FinancialOverviewProps) {
  const { user } = useAuth();
  const [months, setMonths] = useState("12");
  const [active, setActive] = useState<SourceKey[]>(SOURCES.map((s) => s.key));

  const toggle = (key: SourceKey) =>
    setActive((prev) =>
      prev.includes(key) ? (prev.length === 1 ? prev : prev.filter((k) => k !== key)) : [...prev, key],
    );
  const isOn = (key: SourceKey) => active.includes(key);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("user_id", user?.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: installments = [] } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_installments")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: financings = [] } = useQuery({
    queryKey: ["financings", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("financings")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("debts").select("*").eq("user_id", user?.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const { data: cardBills = [] } = useQuery({
    queryKey: ["credit_card_bills", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credit_card_bills")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  /* ---------------- Consolidated monthly totals ---------------- */
  const totals = useMemo(() => {
    const subscription = subscriptions.reduce((t, s) => t + monthlyValue(Number(s.value), s.frequency), 0);
    const installment = installments.reduce((t, i) => t + Number(i.installment_value || 0), 0);
    const financing = financings.reduce(
      (t, f) => t + Number(f.installment_value ?? f.monthly_payment ?? 0),
      0,
    );
    const thisMonth = startOfMonth(new Date());
    const card = cardBills
      .filter((b) => b.reference_month && isSameMonth(parseISO(b.reference_month), thisMonth))
      .reduce((t, b) => t + Number(b.amount || 0), 0);
    const debt = debts
      .filter((d) => !d.is_paid && d.type !== "me_devem")
      .reduce((t, d) => t + Number(d.installment_value || d.total_value || 0), 0);
    return { subscription, installment, financing, card, debt } as Record<SourceKey, number>;
  }, [subscriptions, installments, financings, cardBills, debts]);

  const filteredTotal = active.reduce((t, k) => t + (totals[k] || 0), 0);

  const pieData = SOURCES.filter((s) => isOn(s.key) && totals[s.key] > 0).map((s) => ({
    name: s.label,
    value: totals[s.key],
    color: s.color,
  }));

  /* ---------------- Monthly history (evolution + heatmap) ---------------- */
  const history = useMemo(() => {
    const span = Number(months);
    const base = startOfMonth(new Date());
    const rows: { date: Date; label: string; total: number } & Record<string, any> = [] as any;
    const list: any[] = [];

    for (let i = span - 1; i >= 0; i--) {
      const m = subMonths(base, i);
      const values: Record<SourceKey, number> = {
        subscription: 0,
        installment: 0,
        financing: 0,
        card: 0,
        debt: 0,
      };

      // Subscriptions: active recurring cost applies to every month in range
      values.subscription = subscriptions.reduce(
        (t, s) => t + monthlyValue(Number(s.value), s.frequency),
        0,
      );

      // Installments: only months inside the installment plan window
      values.installment = installments.reduce((t, inst) => {
        if (!inst.start_date) return t;
        const start = startOfMonth(parseISO(inst.start_date));
        const end = addMonths(start, Number(inst.total_installments || 1) - 1);
        if (m >= start && m <= end) return t + Number(inst.installment_value || 0);
        return t;
      }, 0);

      // Financings: months inside the term
      values.financing = financings.reduce((t, f) => {
        if (!f.start_date) return t;
        const start = startOfMonth(parseISO(f.start_date));
        const end = addMonths(start, Number(f.term_months || 1) - 1);
        if (m >= start && m <= end)
          return t + Number(f.installment_value ?? f.monthly_payment ?? 0);
        return t;
      }, 0);

      // Card bills: real registered amount per reference month
      values.card = cardBills
        .filter((b) => b.reference_month && isSameMonth(parseISO(b.reference_month), m))
        .reduce((t, b) => t + Number(b.amount || 0), 0);

      // Debts I owe, by payment month
      values.debt = debts
        .filter(
          (d) =>
            d.type !== "me_devem" &&
            d.payment_date &&
            isSameMonth(parseISO(d.payment_date), m),
        )
        .reduce((t, d) => t + Number(d.installment_value || d.total_value || 0), 0);

      const total = active.reduce((t, k) => t + values[k], 0);
      list.push({
        date: m,
        label: format(m, "MMM/yy", { locale: ptBR }),
        monthName: format(m, "MMMM yyyy", { locale: ptBR }),
        total,
        ...values,
      });
    }
    return list;
  }, [months, active, subscriptions, installments, financings, cardBills, debts]);

  const maxMonth = history.reduce(
    (best, cur) => (cur.total > (best?.total ?? -1) ? cur : best),
    null as any,
  );
  const avgMonth = history.length ? history.reduce((t, h) => t + h.total, 0) / history.length : 0;
  const periodTotal = history.reduce((t, h) => t + h.total, 0);
  const maxHeat = Math.max(...history.map((h) => h.total), 1);

  /* ---------------- Top items (all sources) ---------------- */
  const topItems = useMemo(() => {
    const items: { name: string; valor: number; source: SourceKey }[] = [];
    if (isOn("subscription"))
      subscriptions.forEach((s) =>
        items.push({
          name: s.name,
          valor: monthlyValue(Number(s.value), s.frequency),
          source: "subscription",
        }),
      );
    if (isOn("installment"))
      installments.forEach((i) =>
        items.push({ name: i.name, valor: Number(i.installment_value || 0), source: "installment" }),
      );
    if (isOn("financing"))
      financings.forEach((f) =>
        items.push({
          name: f.name,
          valor: Number(f.installment_value ?? f.monthly_payment ?? 0),
          source: "financing",
        }),
      );
    if (isOn("card"))
      cardBills
        .filter((b) => b.reference_month && isSameMonth(parseISO(b.reference_month), startOfMonth(new Date())))
        .forEach((b) => items.push({ name: b.card_name, valor: Number(b.amount || 0), source: "card" }));
    if (isOn("debt"))
      debts
        .filter((d) => !d.is_paid && d.type !== "me_devem")
        .forEach((d) =>
          items.push({
            name: d.debt_name || d.person_name,
            valor: Number(d.installment_value || d.total_value || 0),
            source: "debt",
          }),
        );
    return items
      .filter((i) => i.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
      .map((i) => ({
        ...i,
        name: i.name?.length > 12 ? i.name.slice(0, 12) + "…" : i.name,
        color: SOURCES.find((s) => s.key === i.source)!.color,
      }));
  }, [active, subscriptions, installments, financings, cardBills, debts]);

  /* ---------------- Secondary stats ---------------- */
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const highPriorityTasks = tasks.filter((t) => !t.completed && t.priority === "high").length;

  const totalRemainingInstallments = installments.reduce(
    (t, i) =>
      t + (Number(i.total_installments || 0) - Number(i.current_installment || 0)) * Number(i.installment_value || 0),
    0,
  );

  const today = new Date();
  const upcomingPayments = subscriptions.filter((sub) => {
    const days = differenceInDays(new Date(sub.renewal_date), today);
    return days <= 7 && days >= 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtros
            </span>
            {SOURCES.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={isOn(s.key) ? "default" : "outline"}
                className="h-7 rounded-full text-xs"
                onClick={() => toggle(s.key)}
              >
                <span
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: s.color, opacity: isOn(s.key) ? 1 : 0.4 }}
                />
                {s.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 24 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setActive(SOURCES.map((s) => s.key))}
            >
              Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Total Mensal (filtrado)"
          value={brl(filteredTotal)}
          subtitle={`${active.length}/${SOURCES.length} fontes`}
          gradient="from-zinc-800 to-zinc-950"
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5" />}
          title="Assinaturas"
          value={brl(totals.subscription)}
          subtitle={`${subscriptions.length} ativas`}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          title="Parcelas + Financ."
          value={brl(totals.installment + totals.financing)}
          subtitle={`${installments.length + financings.length} em andamento`}
          gradient="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          title="Faturas do mês"
          value={brl(totals.card)}
          subtitle={`${cardBills.length} lançadas`}
          gradient="from-amber-500 to-amber-600"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="Projeção Anual"
          value={brl(filteredTotal * 12)}
          color="text-blue-500"
        />
        <MiniStatCard
          icon={<BarChart3 className="w-4 h-4" />}
          title="Média do período"
          value={brl(avgMonth)}
          color="text-violet-500"
        />
        <MiniStatCard
          icon={<Flame className="w-4 h-4" />}
          title="Mês que mais gastou"
          value={maxMonth ? `${maxMonth.label} · ${brl(maxMonth.total)}` : "—"}
          color="text-red-500"
        />
        <MiniStatCard
          icon={<PiggyBank className="w-4 h-4" />}
          title="Total do período"
          value={brl(periodTotal)}
          color="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<Building2 className="w-4 h-4" />}
          title="Restante Parcelas"
          value={brl(totalRemainingInstallments)}
          color="text-emerald-500"
        />
        <MiniStatCard
          icon={<Calendar className="w-4 h-4" />}
          title="Pagamentos Próximos"
          value={`${upcomingPayments}`}
          color="text-amber-500"
        />
        <MiniStatCard
          icon={<CheckSquare className="w-4 h-4" />}
          title="Tarefas Pendentes"
          value={`${pendingTasks} (${highPriorityTasks} urgentes)`}
          color="text-amber-500"
        />
        <MiniStatCard
          icon={<Receipt className="w-4 h-4" />}
          title="Tarefas Concluídas"
          value={`${completedTasks}/${tasks.length}`}
          color="text-green-500"
        />
      </div>

      {/* Evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução dos gastos consolidados
          </CardTitle>
          <CardDescription className="text-xs">
            Todas as fontes selecionadas, mês a mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#totalFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Mapa de calor dos gastos
          </CardTitle>
          <CardDescription className="text-xs">
            Quanto mais escuro, maior o gasto do mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {history.map((h) => {
              const intensity = h.total / maxHeat;
              return (
                <div
                  key={h.label}
                  title={`${h.monthName}: ${brl(h.total)}`}
                  className="rounded-lg border border-border/60 p-2 text-center transition-transform hover:scale-105"
                  style={{ backgroundColor: `hsl(var(--primary) / ${0.08 + intensity * 0.85})` }}
                >
                  <p
                    className="text-[10px] font-medium capitalize"
                    style={{ color: intensity > 0.55 ? "hsl(var(--primary-foreground))" : undefined }}
                  >
                    {h.label}
                  </p>
                  <p
                    className="text-[10px] tabular-nums opacity-80"
                    style={{ color: intensity > 0.55 ? "hsl(var(--primary-foreground))" : undefined }}
                  >
                    {h.total >= 1000 ? `${(h.total / 1000).toFixed(1)}k` : h.total.toFixed(0)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>menos</span>
              {[0.1, 0.3, 0.5, 0.7, 0.93].map((o) => (
                <span
                  key={o}
                  className="w-4 h-3 rounded-sm inline-block"
                  style={{ backgroundColor: `hsl(var(--primary) / ${o})` }}
                />
              ))}
              <span>mais</span>
            </div>
            {maxMonth && (
              <Badge variant="secondary" className="text-xs capitalize">
                Pico: {maxMonth.monthName} · {brl(maxMonth.total)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Distribuição por fonte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty label="Nenhum gasto registrado" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Maiores gastos (todas as fontes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {topItems.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty label="Nenhum lançamento" />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Composição mensal por fonte
            </CardTitle>
            <CardDescription className="text-xs">Empilhado por tipo de gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  {SOURCES.filter((s) => isOn(s.key)).map((s) => (
                    <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-primary-foreground shadow-lg`}
          >
            {icon}
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-sm font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
