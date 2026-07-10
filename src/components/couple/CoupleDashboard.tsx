import { useMemo, useState } from "react";
import { Heart, TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Landmark, LineChart, CalendarClock, HeartPulse, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCoupleList, brl, type Couple, startOfWeek } from "@/hooks/useCouple";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IncomesSection } from "./sections/IncomesSection";
import { ExpensesSection } from "./sections/ExpensesSection";
import { DreamsSection } from "./sections/DreamsSection";
import { InvestmentsSection } from "./sections/InvestmentsSection";
import { AssetsSection } from "./sections/AssetsSection";
import { TimelineSection } from "./sections/TimelineSection";
import { CheckinSection } from "./sections/CheckinSection";
import { AchievementsSection } from "./sections/AchievementsSection";
import { CoupleInsights } from "./CoupleInsights";
import { CoupleSettings } from "./CoupleSettings";
import { MembersBreakdown } from "./MembersBreakdown";
import { cn } from "@/lib/utils";

interface Props { couple: Couple; }

interface CardData { icon: React.ElementType; label: string; value: string; hint?: string; accent?: string; }

const StatCard = ({ icon: Icon, label, value, hint, accent }: CardData) => (
  <Card className="group overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg">
    <CardContent className="space-y-1.5 p-4">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", accent || "bg-muted")}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

export const CoupleDashboard = ({ couple }: Props) => {
  const { user } = useAuth();
  const { data: incomes = [] } = useCoupleList<{ amount: number; recurrence: string }>("couple_incomes", couple.id);
  const { data: expenses = [] } = useCoupleList<{ amount: number; status: string; expense_date: string; recurrence: string }>("couple_expenses", couple.id, { column: "expense_date", ascending: false });
  const { data: dreams = [] } = useCoupleList<{ name: string; target_amount: number; current_amount: number; achieved: boolean }>("couple_dreams", couple.id);
  const { data: investments = [] } = useCoupleList<{ invested_amount: number; current_amount: number }>("couple_investments", couple.id);
  const { data: assets = [] } = useCoupleList<{ value: number }>("couple_assets", couple.id);

  const memberIds = [couple.owner_id, couple.partner_id].filter(Boolean) as string[];
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ["couple-members", memberIds.join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", memberIds);
      return data || [];
    },
    enabled: memberIds.length > 0,
  });

  const stats = useMemo(() => {
    const monthlyIncome = incomes.reduce((s, i) => s + Number(i.amount) * (i.recurrence === "weekly" ? 4 : i.recurrence === "yearly" ? 1 / 12 : 1), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = expenses.filter((e) => new Date(e.expense_date) >= monthStart);
    const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const fixedExpenses = monthExpenses.filter((e) => e.recurrence !== "one_time").reduce((s, e) => s + Number(e.amount), 0);
    const savings = monthlyIncome - totalExpenses;

    const investmentTotal = investments.reduce((s, i) => s + Number(i.current_amount), 0);
    const assetTotal = assets.reduce((s, a) => s + Number(a.value), 0) + investmentTotal;

    const upcoming = expenses.filter((e) => e.status !== "paid" && new Date(e.expense_date) >= new Date()).sort((a, b) => a.expense_date.localeCompare(b.expense_date))[0];

    const health = Math.max(0, Math.min(100, Math.round((savings / Math.max(monthlyIncome, 1)) * 100 + 50)));

    const weekStart = startOfWeek();
    const weekExpenses = expenses.filter((e) => new Date(e.expense_date) >= weekStart);
    const weekIncome = monthlyIncome / 4;
    const weekExpense = weekExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const paidCount = monthExpenses.filter((e) => e.status === "paid").length;
    const pendingCount = monthExpenses.filter((e) => e.status !== "paid").length;
    const overdue = monthExpenses.filter((e) => e.status === "overdue").length;

    const dreamsAchieved = dreams.filter((d) => d.achieved).length;

    return {
      monthlyIncome, totalExpenses, fixedExpenses, savings, investmentTotal, assetTotal, upcoming, health,
      weekIncome, weekExpense, paidCount, pendingCount, overdue, dreamsAchieved,
    };
  }, [incomes, expenses, investments, assets, dreams]);

  const loading = false; // Sub-queries are hot; skeletons live in each section already.

  const memberName = (id: string) => memberProfiles.find((p) => p.id === id)?.full_name?.split(" ")[0] || "Membro";

  return (
    <div className="space-y-6">
      {/* Couple header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {memberProfiles.slice(0, 2).map((p) => (
              <Avatar key={p.id} className="h-12 w-12 border-2 border-background">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback>{p.full_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
            ))}
            {memberProfiles.length < 2 && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-rose-500/40 bg-background text-rose-500">
                <Heart className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
              <span className="text-xs font-medium uppercase tracking-wide text-rose-500">+2 · Espaço do casal</span>
            </div>
            <h1 className="text-2xl font-bold">{couple.couple_name}</h1>
            <p className="text-sm text-muted-foreground">
              {memberProfiles.length === 2
                ? `${memberName(couple.owner_id)} & ${memberName(couple.partner_id!)}`
                : "Aguardando parceiro(a) aceitar o convite"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo do mês</p>
          <p className={cn("text-3xl font-bold tracking-tight", stats.savings >= 0 ? "text-green-500" : "text-red-500")}>
            {brl(stats.savings)}
          </p>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={TrendingUp} label="Receita do casal" value={brl(stats.monthlyIncome)} accent="bg-green-500/10 text-green-500" />
          <StatCard icon={TrendingDown} label="Despesas do mês" value={brl(stats.totalExpenses)} accent="bg-red-500/10 text-red-500" />
          <StatCard icon={Wallet} label="Saldo atual" value={brl(stats.savings)} accent="bg-blue-500/10 text-blue-500" />
          <StatCard icon={PiggyBank} label="Economia do mês" value={brl(Math.max(0, stats.savings))} accent="bg-emerald-500/10 text-emerald-500" />
          <StatCard icon={Target} label="Sonhos" value={`${stats.dreamsAchieved}/${dreams.length}`} hint="conquistados" accent="bg-amber-500/10 text-amber-500" />
          <StatCard icon={Landmark} label="Patrimônio" value={brl(stats.assetTotal)} accent="bg-purple-500/10 text-purple-500" />
          <StatCard icon={LineChart} label="Investimentos" value={brl(stats.investmentTotal)} accent="bg-indigo-500/10 text-indigo-500" />
          <StatCard
            icon={CalendarClock}
            label="Próximo vencimento"
            value={stats.upcoming ? new Date(stats.upcoming.expense_date).toLocaleDateString("pt-BR") : "—"}
            hint={stats.upcoming ? brl(Number(stats.upcoming.amount)) : "nenhum"}
            accent="bg-orange-500/10 text-orange-500"
          />
          <StatCard icon={HeartPulse} label="Saúde financeira" value={`${stats.health}/100`} accent="bg-rose-500/10 text-rose-500" />
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-2xl bg-card/70 p-1.5 backdrop-blur-xl">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="incomes">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="dreams">Sonhos</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
          <TabsTrigger value="assets">Patrimônio</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <CoupleInsights
            totalIncome={stats.monthlyIncome}
            totalExpenses={stats.totalExpenses}
            fixedExpenses={stats.fixedExpenses}
            savings={stats.savings}
            dreams={dreams}
            investmentTotal={stats.investmentTotal}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <TimelineSection coupleId={couple.id} />
            <CheckinSection coupleId={couple.id} weekIncome={stats.weekIncome} weekExpense={stats.weekExpense} paidCount={stats.paidCount} pendingCount={stats.pendingCount} />
          </div>
        </TabsContent>
        <TabsContent value="incomes" className="mt-6"><IncomesSection coupleId={couple.id} ownerId={couple.owner_id} partnerId={couple.partner_id} /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesSection coupleId={couple.id} /></TabsContent>
        <TabsContent value="dreams" className="mt-6"><DreamsSection coupleId={couple.id} /></TabsContent>
        <TabsContent value="investments" className="mt-6"><InvestmentsSection coupleId={couple.id} /></TabsContent>
        <TabsContent value="assets" className="mt-6"><AssetsSection coupleId={couple.id} /></TabsContent>
        <TabsContent value="timeline" className="mt-6"><TimelineSection coupleId={couple.id} /></TabsContent>
        <TabsContent value="checkin" className="mt-6"><CheckinSection coupleId={couple.id} weekIncome={stats.weekIncome} weekExpense={stats.weekExpense} paidCount={stats.paidCount} pendingCount={stats.pendingCount} /></TabsContent>
        <TabsContent value="achievements" className="mt-6">
          <AchievementsSection
            coupleId={couple.id}
            totalInvested={stats.investmentTotal}
            monthsSaving={stats.savings > 0 ? 1 : 0}
            dreamsAchieved={stats.dreamsAchieved}
            paidThisMonth={stats.paidCount}
            overdueThisMonth={stats.overdue}
            coupleStartedAt={couple.started_at}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
