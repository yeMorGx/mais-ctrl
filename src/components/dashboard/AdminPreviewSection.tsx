import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  CheckSquare, 
  Bell, 
  Calendar, 
  Wallet, 
  Target,
  TrendingUp,
  Lock
} from "lucide-react";

const upcomingFeatures = [
  {
    icon: CreditCard,
    title: "Parcelas de Cartão",
    description: "Gerencie e acompanhe todas as parcelas do seu cartão de crédito",
    status: "Em Desenvolvimento",
    statusColor: "bg-yellow-500"
  },
  {
    icon: CheckSquare,
    title: "To Do List",
    description: "Lista de tarefas integrada com lembretes e prioridades",
    status: "Planejado",
    statusColor: "bg-blue-500"
  },
  {
    icon: Bell,
    title: "Central de Lembretes",
    description: "Lembretes personalizados para qualquer evento ou compromisso",
    status: "Planejado",
    statusColor: "bg-blue-500"
  },
  {
    icon: Calendar,
    title: "Agenda Financeira",
    description: "Calendário unificado com todas as suas obrigações financeiras",
    status: "Em Análise",
    statusColor: "bg-purple-500"
  },
  {
    icon: Wallet,
    title: "Controle de Gastos",
    description: "Acompanhe seus gastos diários e categorize despesas",
    status: "Em Análise",
    statusColor: "bg-purple-500"
  },
  {
    icon: Target,
    title: "Metas Financeiras",
    description: "Defina e acompanhe suas metas de economia e investimento",
    status: "Futuro",
    statusColor: "bg-gray-500"
  }
];

export function AdminPreviewSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <Lock className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">Área Exclusiva Admin</h3>
          <p className="text-sm text-muted-foreground">
            Preview das funcionalidades em desenvolvimento - visível apenas para administradores
          </p>
        </div>
        <Badge variant="outline" className="ml-auto border-primary text-primary">
          Admin Only
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${feature.statusColor} text-white text-xs`}
                >
                  {feature.status}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-3">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/50 rounded-full transition-all"
                  style={{ 
                    width: feature.status === "Em Desenvolvimento" ? "60%" : 
                           feature.status === "Planejado" ? "30%" : 
                           feature.status === "Em Análise" ? "15%" : "5%" 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Dashboard Completo em Breve</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Estamos trabalhando para transformar este dashboard em uma central completa 
            para gerenciar suas finanças, tarefas e lembretes em um só lugar.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
