import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CreditCard } from "lucide-react";

export const SubscriptionList = () => {
  // TODO: Replace with real data from database
  const subscriptions = [];

  if (subscriptions.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Suas Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura cadastrada</h3>
              <p className="text-muted-foreground">
                Comece adicionando sua primeira assinatura para ter controle total dos seus gastos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Suas Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((sub: any) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SubscriptionCard = ({ subscription }: { subscription: any }) => {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold">
          {subscription.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-semibold">{subscription.name}</h4>
          <p className="text-sm text-muted-foreground">
            Próximo pagamento: {subscription.nextPayment}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent">
            R$ {subscription.value}
          </p>
          <Badge variant="secondary" className="text-xs">
            {subscription.frequency}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
};
