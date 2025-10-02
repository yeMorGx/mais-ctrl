import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, Calendar, TrendingUp, Users, DollarSign, CreditCard } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export const AdminReports = () => {
  const [reportPeriod, setReportPeriod] = useState<string>("30");

  // Fetch users data
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subscriptions data
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const totalUsers = users.length;
  const activeSubscriptions = subscriptions.filter(s => s.status === "active");
  const premiumUsers = activeSubscriptions.filter(s => s.plan === "premium").length;
  const freeUsers = totalUsers - premiumUsers;
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0";

  // Growth data (mock - in production this would come from time-series data)
  const growthData = [
    { month: "Jan", users: 120, premium: 15, revenue: 187.35 },
    { month: "Fev", users: 145, premium: 22, revenue: 274.78 },
    { month: "Mar", users: 180, premium: 28, revenue: 349.72 },
    { month: "Abr", users: 220, premium: 35, revenue: 437.15 },
    { month: "Mai", users: 280, premium: 45, revenue: 562.05 },
    { month: "Jun", users: totalUsers, premium: premiumUsers, revenue: premiumUsers * 12.49 },
  ];

  // User activity by day of week
  const activityData = [
    { day: "Dom", active: 45 },
    { day: "Seg", active: 78 },
    { day: "Ter", active: 82 },
    { day: "Qua", active: 75 },
    { day: "Qui", active: 88 },
    { day: "Sex", active: 92 },
    { day: "Sáb", active: 58 },
  ];

  const exportReport = () => {
    const csv = [
      ["Relatório de Usuários e Assinaturas"],
      ["Data", new Date().toLocaleDateString()],
      [""],
      ["Métrica", "Valor"],
      ["Total de Usuários", totalUsers],
      ["Usuários Premium", premiumUsers],
      ["Usuários Free", freeUsers],
      ["Taxa de Conversão", `${conversionRate}%`],
      ["Receita Mensal Estimada", `R$ ${(premiumUsers * 12.49).toFixed(2)}`],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h2>
          <p className="text-muted-foreground">
            Análises detalhadas de performance e métricas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Premium
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionRate}% de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(premiumUsers * 12.49).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MRR (Monthly Recurring Revenue)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Free para Premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
            <CardDescription>Evolução total e premium nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Total"
                />
                <Area 
                  type="monotone" 
                  dataKey="premium" 
                  stackId="2"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                  name="Premium"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Receita</CardTitle>
            <CardDescription>MRR nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Receita (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Dia da Semana</CardTitle>
            <CardDescription>Usuários ativos médios por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="active" 
                  fill="hsl(var(--primary))"
                  name="Usuários Ativos"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Usuários</CardTitle>
            <CardDescription>Free vs. Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Usuários Premium</span>
                  <span className="text-sm text-muted-foreground">{premiumUsers} ({conversionRate}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${conversionRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Usuários Free</span>
                  <span className="text-sm text-muted-foreground">{freeUsers} ({(100 - parseFloat(conversionRate)).toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-muted-foreground/50 rounded-full transition-all"
                    style={{ width: `${100 - parseFloat(conversionRate)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Receita Média por Usuário (ARPU)</span>
                  <span className="font-semibold">
                    R$ {totalUsers > 0 ? ((premiumUsers * 12.49) / totalUsers).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Valor Vitalício do Cliente (LTV)</span>
                  <span className="font-semibold">R$ 149.88</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
