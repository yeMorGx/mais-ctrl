import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, AlertCircle } from "lucide-react";
import { differenceInDays, parseISO, isPast } from "date-fns";
import { getSubscriptionLogo } from "@/lib/subscriptionLogos";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  name: string;
  value: number;
  renewal_date: string;
}

interface AlertsPanelProps {
  subscriptions: Subscription[];
}

export const AlertsPanel = ({ subscriptions }: AlertsPanelProps) => {
  // Categorizar alertas por urgência - excluir assinaturas já pagas (com data futura)
  const alerts = subscriptions
    .filter((sub) => {
      const renewalDate = parseISO(sub.renewal_date);
      const daysUntil = differenceInDays(renewalDate, new Date());
      return daysUntil <= 7; // Mostrar apenas alertas dos próximos 7 dias ou vencidos
    })
    .map((sub) => {
      const renewalDate = parseISO(sub.renewal_date);
      const daysUntil = differenceInDays(renewalDate, new Date());
      const isOverdue = isPast(renewalDate) && daysUntil < 0;

      let urgency: "critical" | "warning" | "info" = "info";
      if (isOverdue) urgency = "critical";
      else if (daysUntil <= 1) urgency = "critical";
      else if (daysUntil <= 3) urgency = "warning";

      return {
        ...sub,
        daysUntil,
        isOverdue,
        urgency,
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

  const getAlertColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-destructive/10 border-destructive text-destructive";
      case "warning":
        return "bg-orange-500/10 border-orange-500 text-orange-500";
      default:
        return "bg-muted border-muted-foreground/20";
    }
  };

  const getAlertIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alertas de Renovação
        </CardTitle>
        <CardDescription>Pagamentos próximos e vencidos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const logo = getSubscriptionLogo(alert.name);
              const LogoIcon = logo.icon;
              const AlertIcon = getAlertIcon(alert.urgency);

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                    getAlertColor(alert.urgency),
                    alert.urgency === "critical" && "animate-pulse"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: logo.bgColor }}
                    >
                      <LogoIcon className="w-5 h-5" style={{ color: logo.color }} />
                    </div>
                    <div>
                      <p className="font-semibold">{alert.name}</p>
                      <p className="text-xs flex items-center gap-1">
                        <AlertIcon className="h-3 w-3" />
                        {alert.isOverdue
                          ? `Vencido há ${Math.abs(alert.daysUntil)} dia(s)`
                          : alert.daysUntil === 0
                          ? "Vence hoje!"
                          : `Vence em ${alert.daysUntil} dia(s)`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={alert.urgency === "critical" ? "destructive" : "secondary"}
                    className="font-bold"
                  >
                    R$ {alert.value.toFixed(2)}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum alerta no momento</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};