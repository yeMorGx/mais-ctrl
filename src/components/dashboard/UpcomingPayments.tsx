import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSubscriptionLogo } from "@/lib/subscriptionLogos";

interface Subscription {
  id: string;
  name: string;
  value: number;
  renewal_date: string;
  payment_method: string;
}

interface UpcomingPaymentsProps {
  subscriptions: Subscription[];
}

export const UpcomingPayments = ({ subscriptions }: UpcomingPaymentsProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Encontrar assinaturas na data selecionada
  const paymentsOnDate = selectedDate
    ? subscriptions.filter((sub) =>
        isSameDay(parseISO(sub.renewal_date), selectedDate)
      )
    : [];

  // Destacar datas com pagamentos no calendário
  const datesWithPayments = subscriptions.map((sub) => parseISO(sub.renewal_date));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Pagamentos</CardTitle>
          <CardDescription>Selecione uma data para ver os pagamentos</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="rounded-md border"
            modifiers={{
              payment: datesWithPayments,
            }}
            modifiersStyles={{
              payment: {
                backgroundColor: "hsl(var(--primary))",
                color: "white",
                fontWeight: "bold",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
              : "Selecione uma data"}
          </CardTitle>
          <CardDescription>
            {paymentsOnDate.length > 0
              ? `${paymentsOnDate.length} pagamento(s) agendado(s)`
              : "Nenhum pagamento nesta data"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsOnDate.length > 0 ? (
            <div className="space-y-3">
              {paymentsOnDate.map((sub) => {
                const logo = getSubscriptionLogo(sub.name);
                const LogoIcon = logo.icon;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: logo.bgColor }}
                      >
                        <LogoIcon className="w-5 h-5" style={{ color: logo.color }} />
                      </div>
                      <div>
                        <p className="font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.payment_method}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      R$ {sub.value.toFixed(2)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum pagamento agendado para esta data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};