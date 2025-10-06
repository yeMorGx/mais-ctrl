import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingDown, TrendingUp, Lightbulb } from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
}

interface FinancialAnalysisProps {
  subscriptions: Subscription[];
}

export const FinancialAnalysis = ({ subscriptions }: FinancialAnalysisProps) => {
  // Cálculos
  const monthlyTotal = subscriptions.reduce((sum, sub) => {
    const monthlyValue = sub.frequency === "annual" ? sub.value / 12 : sub.value;
    return sum + monthlyValue;
  }, 0);

  const annualTotal = subscriptions.reduce((sum, sub) => {
    const annualValue = sub.frequency === "monthly" ? sub.value * 12 : sub.value;
    return sum + annualValue;
  }, 0);

  // Dados para gráfico de pizza
  const pieData = subscriptions.map(sub => ({
    name: sub.name,
    value: sub.frequency === "monthly" ? sub.value : sub.value / 12,
  }));

  // Dados para gráfico de barras (baseado em dados reais)
  const barData = subscriptions.length > 0 ? [
    { month: "Mês atual", value: monthlyTotal }
  ] : [];

  const COLORS = [
    "hsl(262 83% 58%)",
    "hsl(189 94% 43%)",
    "hsl(262 83% 68%)",
    "hsl(189 94% 53%)",
    "hsl(262 83% 48%)",
  ];

  // Insights baseados em dados reais
  const monthlySubscriptions = subscriptions.filter(s => s.frequency === "monthly").length;
  const annualSubscriptions = subscriptions.filter(s => s.frequency === "annual").length;
  
  const insights = [];
  
  if (monthlySubscriptions >= 2) {
    insights.push({
      icon: TrendingDown,
      title: "Oportunidade de economia",
      description: `Você tem ${monthlySubscriptions} assinaturas mensais. Considere planos anuais para economizar até 20%`,
      color: "text-secondary",
    });
  }
  
  if (subscriptions.length > 0) {
    insights.push({
      icon: Lightbulb,
      title: "Total de assinaturas",
      description: `Você gerencia ${subscriptions.length} assinatura${subscriptions.length !== 1 ? 's' : ''} (${monthlySubscriptions} mensais, ${annualSubscriptions} anuais)`,
      color: "text-primary",
    });
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Mensal</CardTitle>
                <CardDescription>Quanto você gasta por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  R$ {monthlyTotal.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Assinatura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {barData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Gastos</CardTitle>
                <CardDescription>Baseado nas suas assinaturas ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="annual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Anual</CardTitle>
              <CardDescription>Projeção de gastos no ano</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                R$ {annualTotal.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Média mensal: R$ {(annualTotal / 12).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Insights Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <insight.icon className={`h-5 w-5 ${insight.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};