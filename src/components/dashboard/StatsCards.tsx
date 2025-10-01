import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  renewal_date: string;
}

interface StatsCardsProps {
  subscriptions: Subscription[];
}

export const StatsCards = ({ subscriptions }: StatsCardsProps) => {
  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const value = Number(sub.value);
      if (sub.frequency === "annual") {
        return total + (value / 12);
      }
      return total + value;
    }, 0);
  };

  const getNextPayment = () => {
    if (subscriptions.length === 0) return null;
    
    const sorted = [...subscriptions].sort((a, b) => 
      new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );
    
    return sorted[0];
  };

  const getPendingAlerts = () => {
    const today = new Date();
    return subscriptions.filter(sub => {
      const renewalDate = new Date(sub.renewal_date);
      const daysUntil = differenceInDays(renewalDate, today);
      return daysUntil <= 3 && daysUntil >= 0;
    }).length;
  };

  const monthlyTotal = calculateMonthlyTotal();
  const nextPayment = getNextPayment();
  const alertsCount = getPendingAlerts();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={<CreditCard className="w-6 h-6" />}
        title="Total mensal"
        value={`R$ ${monthlyTotal.toFixed(2)}`}
        subtitle={`${subscriptions.length} assinatura${subscriptions.length !== 1 ? 's' : ''} ativa${subscriptions.length !== 1 ? 's' : ''}`}
        gradient="from-purple-500 to-purple-600"
      />
      
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        title="Gasto anual"
        value={`R$ ${(monthlyTotal * 12).toFixed(2)}`}
        subtitle="Projeção baseada no mês atual"
        gradient="from-cyan-500 to-cyan-600"
      />
      
      <StatCard
        icon={<Calendar className="w-6 h-6" />}
        title="Próximo pagamento"
        value={nextPayment ? format(new Date(nextPayment.renewal_date), "dd/MM", { locale: ptBR }) : "--"}
        subtitle={nextPayment ? nextPayment.name : "Nenhuma data próxima"}
        gradient="from-indigo-500 to-indigo-600"
      />
      
      <StatCard
        icon={<AlertCircle className="w-6 h-6" />}
        title="Alertas pendentes"
        value={alertsCount.toString()}
        subtitle={alertsCount === 0 ? "Tudo em dia" : `${alertsCount} pagamento${alertsCount !== 1 ? 's' : ''} próximo${alertsCount !== 1 ? 's' : ''}`}
        gradient="from-pink-500 to-pink-600"
      />
    </div>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) => {
  return (
    <Card className="border-border hover:shadow-elegant transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
            {icon}
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};
