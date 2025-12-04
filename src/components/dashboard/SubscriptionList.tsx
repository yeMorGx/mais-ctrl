import { useState } from "react";
import { Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CreditCard, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSubscriptionLogo } from "@/lib/subscriptionLogos";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  payment_method: string;
  renewal_date: string;
  is_shared?: boolean;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
  showEdit?: boolean;
}

export const SubscriptionList = ({ subscriptions, onUpdate, showEdit = false }: SubscriptionListProps) => {
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const handleDelete = async (id: string, name: string, isShared?: boolean) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${name}"?`);
    if (!confirmed) return;

    // Extrair o UUID real removendo prefixos
    let realId = id;
    let isSharedSub = isShared;
    
    if (id.startsWith("shared-")) {
      realId = id.replace("shared-", "");
      isSharedSub = true;
    } else if (id.startsWith("partner-")) {
      toast({
        title: "Não é possível excluir",
        description: "Você é parceiro desta assinatura. Apenas o dono pode excluí-la.",
        variant: "destructive",
      });
      return;
    }

    let error;
    if (isSharedSub) {
      const result = await supabase
        .from("shared_subscriptions")
        .delete()
        .eq("id", realId);
      error = result.error;
    } else {
      const result = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", realId);
      error = result.error;
    }

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

  const handleMarkAsPaid = async (subId: string, subName: string, isShared?: boolean) => {
    const subscription = subscriptions.find(s => s.id === subId);
    if (!subscription) return;

    // Extrair o UUID real removendo prefixos
    let realId = subId;
    let isSharedSub = isShared;
    
    if (subId.startsWith("shared-")) {
      realId = subId.replace("shared-", "");
      isSharedSub = true;
    } else if (subId.startsWith("partner-")) {
      toast({
        title: "Não é possível marcar como paga",
        description: "Apenas o dono pode marcar a assinatura como paga.",
        variant: "destructive",
      });
      return;
    }

    const currentRenewalDate = new Date(subscription.renewal_date);
    const nextRenewalDate = new Date(currentRenewalDate);
    
    if (subscription.frequency === 'monthly') {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    } else {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    }

    let error;
    if (isSharedSub) {
      const result = await supabase
        .from("shared_subscriptions")
        .update({ renewal_date: nextRenewalDate.toISOString().split('T')[0] })
        .eq("id", realId);
      error = result.error;
    } else {
      const result = await supabase
        .from("subscriptions")
        .update({ renewal_date: nextRenewalDate.toISOString().split('T')[0] })
        .eq("id", realId);
      error = result.error;
    }

    if (error) {
      toast({
        title: "Erro ao marcar como paga",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura marcada como paga",
        description: `${subName} foi marcada como paga. Próximo pagamento: ${format(nextRenewalDate, "dd/MM/yyyy", { locale: ptBR })}`,
      });
      onUpdate();
    }
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
            const renewalDate = new Date(sub.renewal_date);
            const daysUntilRenewal = differenceInDays(renewalDate, new Date());
            const isPaymentDay = daysUntilRenewal <= 0; // Mostra botão no dia ou se atrasado
            const isPaid = daysUntilRenewal > 0;
            
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{sub.name}</h4>
                      {sub.is_shared && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Compartilhada
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        Próximo: {format(renewalDate, "dd/MM/yyyy", { locale: ptBR })}
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
                    {isPaid ? (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paga
                      </Badge>
                    ) : isPaymentDay ? (
                      <Button 
                        variant="default"
                        size="sm"
                        className="bg-gradient-primary"
                        onClick={() => handleMarkAsPaid(sub.id, sub.name, sub.is_shared)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    ) : null}
                    
                    {showEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingSubscription(sub);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(sub.id, sub.name, sub.is_shared)}
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

      <EditSubscriptionDialog
        subscription={editingSubscription}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onUpdate}
      />
    </Card>
  );
};
