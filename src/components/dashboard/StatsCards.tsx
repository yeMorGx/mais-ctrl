import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export const StatsCards = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={<CreditCard className="w-6 h-6" />}
        title="Total mensal"
        value="R$ 0,00"
        subtitle="0 assinaturas ativas"
        gradient="from-purple-500 to-purple-600"
      />
      
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        title="Economia possível"
        value="R$ 0,00"
        subtitle="Nenhuma duplicata detectada"
        gradient="from-cyan-500 to-cyan-600"
      />
      
      <StatCard
        icon={<Calendar className="w-6 h-6" />}
        title="Próximo pagamento"
        value="--"
        subtitle="Nenhuma data próxima"
        gradient="from-indigo-500 to-indigo-600"
      />
      
      <StatCard
        icon={<AlertCircle className="w-6 h-6" />}
        title="Alertas pendentes"
        value="0"
        subtitle="Tudo em dia"
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
