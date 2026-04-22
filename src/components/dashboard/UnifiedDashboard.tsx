import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Lock, CreditCard, CheckSquare, Wallet, BarChart3, DollarSign, Users, ArrowRight, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionList } from "./SubscriptionList";
import { TodoList } from "./TodoList";
import { CardInstallments } from "./CardInstallments";
import { DebtoList } from "./DebtoList";
import { FinancialOverview } from "./FinancialOverview";
import { UnifiedSearch, SearchFilters } from "./UnifiedSearch";
import { FinancialTips } from "./FinancialTips";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";

interface UnifiedDashboardProps {
  subscriptions: any[];
  onAddSubscription: () => void;
  onRefetch: () => void;
  isPremium: boolean;
  hasReachedLimit: boolean;
  onTabChange: (tab: string) => void;
}

export const UnifiedDashboard = ({
  subscriptions,
  onAddSubscription,
  onRefetch,
  isPremium,
  hasReachedLimit,
  onTabChange,
}: UnifiedDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: ['subscriptions', 'tasks', 'installments', 'debts', 'financings'],
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    dateRange: 'all',
  });

  // Fetch tasks for unified search
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch installments for unified search
  const { data: installments = [] } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_installments")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch debts for unified search
  const { data: debts = [] } = useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: financings = [] } = useQuery({
    queryKey: ["financings", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("financings")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Apply filters to all data
  const filteredData = useMemo(() => {
    const query = filters.query.toLowerCase();
    
    // Filter subscriptions
    let filteredSubs = filters.types.includes('subscriptions') 
      ? subscriptions.filter(sub => {
          if (query && !sub.name.toLowerCase().includes(query)) return false;
          if (filters.dateRange !== 'all') {
            const date = parseISO(sub.renewal_date);
            if (filters.dateRange === 'today' && !isToday(date)) return false;
            if (filters.dateRange === 'week' && !isThisWeek(date)) return false;
            if (filters.dateRange === 'month' && !isThisMonth(date)) return false;
          }
          return true;
        })
      : [];

    // Filter tasks
    let filteredTasks = filters.types.includes('tasks')
      ? tasks.filter((task: any) => {
          if (query && !task.title.toLowerCase().includes(query)) return false;
          if (filters.dateRange !== 'all' && task.due_date) {
            const date = parseISO(task.due_date);
            if (filters.dateRange === 'today' && !isToday(date)) return false;
            if (filters.dateRange === 'week' && !isThisWeek(date)) return false;
            if (filters.dateRange === 'month' && !isThisMonth(date)) return false;
          }
          return true;
        })
      : [];

    // Filter installments
    let filteredInstallments = filters.types.includes('installments')
      ? installments.filter((inst: any) => {
          if (query && !inst.name.toLowerCase().includes(query)) return false;
          return true;
        })
      : [];

    // Sort
    const sortFn = (a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (filters.sortBy) {
        case 'name':
          aVal = a.name || a.title || '';
          bVal = b.name || b.title || '';
          break;
        case 'value':
          aVal = a.value || a.installment_value || 0;
          bVal = b.value || b.installment_value || 0;
          break;
        case 'date':
          aVal = a.renewal_date || a.due_date || a.start_date || '';
          bVal = b.renewal_date || b.due_date || b.start_date || '';
          break;
        default:
          aVal = a.name || a.title || '';
          bVal = b.name || b.title || '';
      }
      
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      }
      return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    };

    filteredSubs = filteredSubs.sort(sortFn);
    filteredTasks = filteredTasks.sort(sortFn);
    filteredInstallments = filteredInstallments.sort(sortFn);

    // Filter debts
    let filteredDebts = filters.types.includes('debts')
      ? debts.filter((debt: any) => {
          if (query && !debt.debt_name.toLowerCase().includes(query) && !debt.person_name.toLowerCase().includes(query)) return false;
          if (filters.dateRange !== 'all' && debt.payment_date) {
            const date = parseISO(debt.payment_date);
            if (filters.dateRange === 'today' && !isToday(date)) return false;
            if (filters.dateRange === 'week' && !isThisWeek(date)) return false;
            if (filters.dateRange === 'month' && !isThisMonth(date)) return false;
          }
          return true;
        })
      : [];

    let filteredFinancings = filters.types.includes('financings')
      ? financings.filter((financing: any) => {
          if (query && !financing.name.toLowerCase().includes(query) && !(financing.institution || '').toLowerCase().includes(query)) return false;
          if (filters.dateRange !== 'all' && financing.start_date) {
            const date = parseISO(financing.start_date);
            if (filters.dateRange === 'today' && !isToday(date)) return false;
            if (filters.dateRange === 'week' && !isThisWeek(date)) return false;
            if (filters.dateRange === 'month' && !isThisMonth(date)) return false;
          }
          return true;
        })
      : [];

    filteredSubs = filteredSubs.sort(sortFn);
    filteredTasks = filteredTasks.sort(sortFn);
    filteredInstallments = filteredInstallments.sort(sortFn);
    filteredDebts = filteredDebts.sort(sortFn);
    filteredFinancings = filteredFinancings.sort(sortFn);

    return {
      subscriptions: filteredSubs,
      tasks: filteredTasks,
      installments: filteredInstallments,
      debts: filteredDebts,
      financings: filteredFinancings,
      totalCount: filteredSubs.length + filteredTasks.length + filteredInstallments.length + filteredDebts.length + filteredFinancings.length,
    };
  }, [subscriptions, tasks, installments, debts, financings, filters]);

  const hasActiveSearch = filters.query !== '' || filters.types.length < 5 || filters.dateRange !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Controle total das suas finanças
          </p>
        </div>
        <div className="flex gap-2 ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={hasReachedLimit ? "bg-destructive hover:bg-destructive/90" : "bg-gradient-primary"}
                  size="lg"
                  onClick={() => hasReachedLimit ? navigate("/pricing") : onAddSubscription()}
                >
                  {hasReachedLimit ? (
                    <Lock className="w-5 h-5 mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  <span className="hidden sm:inline">{hasReachedLimit ? "Limite atingido" : "Nova assinatura"}</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </TooltipTrigger>
              {hasReachedLimit && (
                <TooltipContent>
                  <p>Desbloqueie</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Unified Search */}
      <Card>
        <CardContent className="pt-4">
          <UnifiedSearch 
            filters={filters} 
            onFiltersChange={setFilters}
            resultCount={hasActiveSearch ? filteredData.totalCount : undefined}
          />
        </CardContent>
      </Card>

      {/* Financial Overview / Charts */}
      <FinancialOverview subscriptions={subscriptions} />

      {/* Section Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Central de Controle
            {hasActiveSearch && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredData.totalCount} resultados)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Assinaturas</span>
                <span className="sm:hidden">Assin.</span>
                {hasActiveSearch && filters.types.includes('subscriptions') && (
                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {filteredData.subscriptions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Tarefas</span>
                {hasActiveSearch && filters.types.includes('tasks') && (
                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {filteredData.tasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="installments" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Parcelas</span>
                {hasActiveSearch && filters.types.includes('installments') && (
                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {filteredData.installments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="debts" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Debto</span>
                {hasActiveSearch && filters.types.includes('debts') && (
                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                    {filteredData.debts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                {/* Quick Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <QuickSummaryCard
                    title="Assinaturas"
                    icon={<CreditCard className="h-5 w-5" />}
                    count={subscriptions.length}
                    items={subscriptions.slice(0, 3).map(s => s.name)}
                    onClick={() => setActiveSection('subscriptions')}
                    gradient="from-blue-500/10 to-blue-600/10"
                    iconColor="text-blue-500"
                  />
                  <QuickSummaryCard
                    title="Tarefas Pendentes"
                    icon={<CheckSquare className="h-5 w-5" />}
                    count={tasks.filter((t: any) => !t.completed).length}
                    items={tasks.filter((t: any) => !t.completed).slice(0, 3).map((t: any) => t.title)}
                    onClick={() => setActiveSection('tasks')}
                    gradient="from-amber-500/10 to-amber-600/10"
                    iconColor="text-amber-500"
                  />
                  <QuickSummaryCard
                    title="Parcelas Ativas"
                    icon={<Wallet className="h-5 w-5" />}
                    count={installments.filter((i: any) => i.is_active).length}
                    items={installments.filter((i: any) => i.is_active).slice(0, 3).map((i: any) => i.name)}
                    onClick={() => setActiveSection('installments')}
                    gradient="from-emerald-500/10 to-emerald-600/10"
                    iconColor="text-emerald-500"
                  />
                  <QuickSummaryCard
                    title="Debto"
                    icon={<DollarSign className="h-5 w-5" />}
                    count={debts.filter((d: any) => !d.is_paid).length}
                    items={debts.filter((d: any) => !d.is_paid).slice(0, 3).map((d: any) => d.debt_name)}
                    onClick={() => setActiveSection('debts')}
                    gradient="from-purple-500/10 to-purple-600/10"
                    iconColor="text-purple-500"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-0">
              <SubscriptionList 
                subscriptions={hasActiveSearch ? filteredData.subscriptions : subscriptions} 
                onUpdate={onRefetch} 
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <TodoList />
            </TabsContent>

            <TabsContent value="installments" className="mt-0">
              <CardInstallments />
            </TabsContent>

            <TabsContent value="debts" className="mt-0">
              <DebtoList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Financial Tips */}
      <FinancialTips />

      {/* Affiliate Program Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ganhe 20% indicando o +Ctrl</h3>
                <p className="text-sm text-muted-foreground">
                  Comissão recorrente enquanto seus indicados usarem a plataforma
                </p>
              </div>
            </div>
            <Link to="/affiliate">
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10 group">
                Quero ser afiliado
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function QuickSummaryCard({
  title,
  icon,
  count,
  items,
  onClick,
  gradient,
  iconColor,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  items: string[];
  onClick: () => void;
  gradient: string;
  iconColor: string;
}) {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${gradient}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${iconColor}`}>{icon}</div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item, idx) => (
              <p key={idx} className="text-sm text-muted-foreground truncate">
                • {item}
              </p>
            ))}
            {count > 3 && (
              <p className="text-xs text-primary">+{count - 3} mais...</p>
            )}
          </div>
        )}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum item</p>
        )}
      </CardContent>
    </Card>
  );
}
