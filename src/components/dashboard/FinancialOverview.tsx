import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  AlertCircle,
  CheckSquare,
  DollarSign,
  PiggyBank,
  Receipt
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  LineChart,
  Line,
  Area,
  AreaChart
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

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
}

interface Installment {
  id: string;
  name: string;
  installment_value: number;
  total_installments: number;
  current_installment: number;
  is_active: boolean;
  due_day: number;
}

interface FinancialOverviewProps {
  subscriptions: Subscription[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function FinancialOverview({ subscriptions }: FinancialOverviewProps) {
  const { user } = useAuth();

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user?.id,
  });

  // Fetch installments
  const { data: installments = [] } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_installments")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!user?.id,
  });

  // Calculate subscription costs
  const subscriptionMonthly = subscriptions.reduce((total, sub) => {
    const value = Number(sub.value);
    if (sub.frequency === "annual") return total + (value / 12);
    if (sub.frequency === "weekly") return total + (value * 4);
    if (sub.frequency === "daily") return total + (value * 30);
    if (sub.frequency === "quarterly") return total + (value / 3);
    return total + value;
  }, 0);

  // Calculate installment costs
  const installmentMonthly = installments.reduce((total, inst) => {
    return total + Number(inst.installment_value);
  }, 0);

  // Calculate total remaining installments
  const totalRemainingInstallments = installments.reduce((total, inst) => {
    const remaining = inst.total_installments - inst.current_installment;
    return total + (remaining * Number(inst.installment_value));
  }, 0);

  // Calculate pending tasks
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high').length;

  // Total monthly expenses
  const totalMonthly = subscriptionMonthly + installmentMonthly;

  // Upcoming payments count
  const today = new Date();
  const upcomingPayments = subscriptions.filter(sub => {
    const renewalDate = new Date(sub.renewal_date);
    const daysUntil = differenceInDays(renewalDate, today);
    return daysUntil <= 7 && daysUntil >= 0;
  }).length;

  // Pie chart data for expense distribution
  const pieData = [
    { name: 'Assinaturas', value: subscriptionMonthly, color: 'hsl(var(--primary))' },
    { name: 'Parcelas', value: installmentMonthly, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Bar chart data for subscription breakdown
  const topSubscriptions = [...subscriptions]
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 5)
    .map(sub => ({
      name: sub.name.length > 10 ? sub.name.substring(0, 10) + '...' : sub.name,
      valor: Number(sub.value)
    }));

  // Tasks summary for pie
  const tasksPieData = [
    { name: 'Pendentes', value: pendingTasks, color: '#f59e0b' },
    { name: 'Concluídas', value: completedTasks, color: '#10b981' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Total Mensal"
          value={`R$ ${totalMonthly.toFixed(2)}`}
          subtitle="Gastos fixos"
          gradient="from-violet-500 to-violet-600"
          trend={totalMonthly > 0 ? 'up' : undefined}
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5" />}
          title="Assinaturas"
          value={`R$ ${subscriptionMonthly.toFixed(2)}`}
          subtitle={`${subscriptions.length} ativas`}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          title="Parcelas"
          value={`R$ ${installmentMonthly.toFixed(2)}`}
          subtitle={`${installments.length} em andamento`}
          gradient="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          title="Tarefas"
          value={`${pendingTasks}`}
          subtitle={`${highPriorityTasks} urgentes`}
          gradient="from-amber-500 to-amber-600"
          highlight={highPriorityTasks > 0}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="Gasto Anual"
          value={`R$ ${(totalMonthly * 12).toFixed(2)}`}
          color="text-blue-500"
        />
        <MiniStatCard
          icon={<PiggyBank className="w-4 h-4" />}
          title="Restante Parcelas"
          value={`R$ ${totalRemainingInstallments.toFixed(2)}`}
          color="text-emerald-500"
        />
        <MiniStatCard
          icon={<Calendar className="w-4 h-4" />}
          title="Pagamentos Próximos"
          value={`${upcomingPayments}`}
          color="text-amber-500"
        />
        <MiniStatCard
          icon={<Receipt className="w-4 h-4" />}
          title="Tarefas Concluídas"
          value={`${completedTasks}/${tasks.length}`}
          color="text-green-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Distribuição de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum gasto registrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Subscriptions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Top Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSubscriptions.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSubscriptions} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="valor" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma assinatura
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Status das Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksPieData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tasksPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma tarefa
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installments Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Progresso das Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {installments.length > 0 ? (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {installments.slice(0, 5).map((inst) => {
                  const progress = (inst.current_installment / inst.total_installments) * 100;
                  return (
                    <div key={inst.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate max-w-[150px]">{inst.name}</span>
                        <span className="text-muted-foreground">
                          {inst.current_installment}/{inst.total_installments}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma parcela
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
  trend,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  trend?: 'up' | 'down';
  highlight?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${highlight ? 'ring-2 ring-amber-500/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
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
        <div className={`${color}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-sm font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
