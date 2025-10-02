import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSubscriptionLogo } from "@/lib/subscriptionLogos";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  payment_method: string;
  renewal_date: string;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
}

export const SubscriptionList = ({ subscriptions, onUpdate }: SubscriptionListProps) => {
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${name}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura excluída",
        description: `${name} foi removida com sucesso`,
      });
      onUpdate();
    }
  };

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit: "Crédito",
      debit: "Débito",
      pix: "PIX",
      boleto: "Boleto"
    };
    return labels[method] || method;
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency === "monthly" ? "Mensal" : "Anual";
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Suas Assinaturas ({subscriptions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const logo = getSubscriptionLogo(sub.name);
            const IconComponent = logo.icon;
            
            return (
              <div 
                key={sub.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`${logo.bgColor} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6" style={{ color: logo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{sub.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        Próximo: {format(new Date(sub.renewal_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentMethodLabel(sub.payment_method)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent">
                      R$ {Number(sub.value).toFixed(2)}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {getFrequencyLabel(sub.frequency)}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(sub.id, sub.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
