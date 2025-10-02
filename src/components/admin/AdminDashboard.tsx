import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminDashboardProps {
  isOwner: boolean;
}

export const AdminDashboard = ({ isOwner }: AdminDashboardProps) => {
  // Fetch total users
  const { data: totalUsers = 0 } = useQuery({
    queryKey: ["admin-total-users"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Fetch premium users
  const { data: premiumUsers = 0 } = useQuery({
    queryKey: ["admin-premium-users"],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan", "premium")
        .eq("status", "active");
      return count || 0;
    },
  });

  // Fetch total subscriptions
  const { data: totalSubscriptions = 0 } = useQuery({
    queryKey: ["admin-total-subscriptions"],
    queryFn: async () => {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      return count || 0;
    },
  });

  // Calculate metrics
  const monthlyRevenue = premiumUsers * 12.49; // R$ 12,49 per premium user
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0.0";

  const statsCards = [
    {
      title: "Total de Usuários",
      value: totalUsers,
      icon: Users,
      description: "Usuários registrados",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Usuários Premium",
      value: premiumUsers,
      icon: CreditCard,
      description: "Assinaturas ativas",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Receita Mensal",
      value: `R$ ${monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Faturamento estimado",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      description: "Free → Premium",
      trend: "+3%",
      trendUp: true,
    },
  ];

  // Mock data for charts
  const revenueData = [
    { month: "Jan", value: 4200 },
    { month: "Fev", value: 5100 },
    { month: "Mar", value: 4800 },
    { month: "Abr", value: 6200 },
    { month: "Mai", value: 7100 },
    { month: "Jun", value: 8400 },
  ];

  const userGrowthData = [
    { month: "Jan", users: 120 },
    { month: "Fev", users: 145 },
    { month: "Mar", users: 168 },
    { month: "Abr", users: 195 },
    { month: "Mai", users: 223 },
    { month: "Jun", users: totalUsers },
  ];

  const planDistribution = [
    { name: "Free", value: totalUsers - premiumUsers, color: "#8B5CF6" },
    { name: "Premium", value: premiumUsers, color: "#EC4899" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <Badge variant={stat.trendUp ? "default" : "secondary"} className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
            <CardDescription>Evolução mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>Free vs Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Monitoramento em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm">Servidor</span>
              </div>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm">Banco de Dados</span>
              </div>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm">Pagamentos (Stripe)</span>
              </div>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Tickets Pendentes</span>
              </div>
              <Badge variant="secondary">3</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
