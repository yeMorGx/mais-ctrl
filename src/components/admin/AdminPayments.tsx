import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, DollarSign, TrendingUp, CreditCard, Calendar, FileText } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const AdminPayments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  // Fetch all user subscriptions (payments data)
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      // First get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      // Then fetch profile data for each subscription
      const paymentsWithProfiles = await Promise.all(
        (subscriptions || []).map(async (sub) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", sub.user_id)
            .maybeSingle();

          return {
            ...sub,
            profiles: profile,
          };
        })
      );

      return paymentsWithProfiles;
    },
  });

  // Calculate metrics
  const totalRevenue = payments
    .filter(p => p.plan === "premium" && p.status === "active")
    .length * 12.49;

  const monthlyRecurring = payments
    .filter(p => p.plan === "premium" && p.status === "active")
    .length * 12.49;

  const activeSubscriptions = payments.filter(p => p.status === "active").length;
  const cancelledSubscriptions = payments.filter(p => p.status === "cancelled").length;

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;

    let matchesPeriod = true;
    if (filterPeriod !== "all") {
      const paymentDate = new Date(payment.created_at);
      const now = new Date();
      const daysAgo = parseInt(filterPeriod);
      const periodDate = new Date(now.setDate(now.getDate() - daysAgo));
      matchesPeriod = paymentDate >= periodDate;
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Mock revenue data for charts
  const revenueData = [
    { month: "Jan", revenue: 4200, subscriptions: 34 },
    { month: "Fev", revenue: 5100, subscriptions: 41 },
    { month: "Mar", revenue: 4800, subscriptions: 38 },
    { month: "Abr", revenue: 6200, subscriptions: 50 },
    { month: "Mai", revenue: 7100, subscriptions: 57 },
    { month: "Jun", revenue: totalRevenue, subscriptions: activeSubscriptions },
  ];

  const statusDistribution = [
    { name: "Ativo", value: activeSubscriptions, color: "#10B981" },
    { name: "Cancelado", value: cancelledSubscriptions, color: "#EF4444" },
    { name: "Expirado", value: payments.filter(p => p.status === "expired").length, color: "#F59E0B" },
  ];

  const exportToCSV = () => {
    const csv = [
      ["Data", "Usuário", "Email", "Plano", "Status", "Valor"],
      ...filteredPayments.map(p => [
        new Date(p.created_at).toLocaleDateString(),
        p.profiles?.full_name || "Sem nome",
        p.profiles?.email || "",
        p.plan,
        p.status,
        p.plan === "premium" ? "R$ 12,49" : "R$ 0,00",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", text: string }> = {
      active: { variant: "default", text: "Ativo" },
      cancelled: { variant: "destructive", text: "Cancelado" },
      expired: { variant: "secondary", text: "Expirado" },
      pending: { variant: "secondary", text: "Pendente" },
    };
    
    const config = variants[status] || { variant: "secondary", text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagamentos & Relatórios</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os pagamentos e transações
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12.5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Recorrente
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {monthlyRecurring.toFixed(2)}/mês</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSubscriptions} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Transações
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length > 0 ? ((activeSubscriptions / payments.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Free para Premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
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
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Receita (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Visão geral das assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as transações e alterações de plano
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Período</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando pagamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {payment.profiles?.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.plan === "premium" ? "default" : "outline"}>
                          {payment.plan === "premium" ? "Premium" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="font-medium">
                        {payment.plan === "premium" ? "R$ 12,49" : "R$ 0,00"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.current_period_start && payment.current_period_end ? (
                          <>
                            {new Date(payment.current_period_start).toLocaleDateString()} -{" "}
                            {new Date(payment.current_period_end).toLocaleDateString()}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
