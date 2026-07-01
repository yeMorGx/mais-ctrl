import { useState } from "react";
import { Share2, FlaskConical, Crown, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CreditCard, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSubscriptionLogo, getBrandLogoUrl } from "@/lib/subscriptionLogos";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  payment_method: string;
  renewal_date: string;
  is_shared?: boolean;
  trial_end_date?: string | null;
}

export interface PremiumPlanCard {
  isLifetime: boolean;
  status: string;
  endDate: string | null;
  userName: string;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
  showEdit?: boolean;
  premiumPlan?: PremiumPlanCard | null;
  onViewPlan?: () => void;
}


export const SubscriptionList = ({ subscriptions, onUpdate, showEdit = false, premiumPlan = null, onViewPlan }: SubscriptionListProps) => {
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
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

  const renderPremiumCard = () => {
    if (!premiumPlan) return null;
    const endDate = premiumPlan.endDate ? new Date(premiumPlan.endDate) : null;
    const statusLabel = premiumPlan.isLifetime
      ? "Vitalícia"
      : premiumPlan.status === "canceled"
        ? "(cancelado)"
        : "Ativo";
    const subtitle = premiumPlan.isLifetime
      ? "Acesso vitalício — concedido pela equipe +Ctrl"
      : endDate
        ? `${premiumPlan.status === "canceled" ? "Acesso até" : "Renova em"} ${format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
        : "Plano ativo";
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">+Ctrl Premium</h4>
              <Badge className="bg-gradient-primary text-white border-0 text-[10px] px-2 py-0.5">
                {statusLabel}
              </Badge>
              {premiumPlan.isLifetime && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 border-primary/40">
                  <InfinityIcon className="w-3 h-3" />
                  Vitalícia
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {onViewPlan && (
            <Button variant="outline" size="sm" className="border-primary/40" onClick={onViewPlan}>
              Ver plano
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (subscriptions.length === 0 && !premiumPlan) {
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

  const totalCount = subscriptions.length + (premiumPlan ? 1 : 0);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Suas Assinaturas ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderPremiumCard()}
          {subscriptions.map((sub) => {

            const logo = getSubscriptionLogo(sub.name);
            const IconComponent = logo.icon;
            const brandUrl = getBrandLogoUrl(sub.name);
            const useBrandImage = brandUrl && !failedLogos[sub.id];
            const renewalDate = new Date(sub.renewal_date);
            const daysUntilRenewal = differenceInDays(renewalDate, new Date());
            const isPaymentDay = daysUntilRenewal <= 0; // Mostra botão no dia ou se atrasado
            const isPaid = daysUntilRenewal > 0;
            const trialEnd = sub.trial_end_date ? new Date(sub.trial_end_date) : null;
            const isOnTrial = trialEnd ? trialEnd > new Date() : false;
            const trialDaysLeft = trialEnd ? differenceInDays(trialEnd, new Date()) : 0;

            return (
              <div
                key={sub.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all gap-4 ${isOnTrial ? 'border-amber-500/50 bg-amber-500/5' : 'border-border'}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {useBrandImage ? (
                    <div className="bg-muted/40 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                      <img
                        src={brandUrl!}
                        alt={sub.name}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain"
                        onError={() => setFailedLogos((prev) => ({ ...prev, [sub.id]: true }))}
                      />
                    </div>
                  ) : (
                    <div className={`${logo.bgColor} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6" style={{ color: logo.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{sub.name}</h4>
                      {isOnTrial && (
                        <Badge className="text-xs flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                          <FlaskConical className="w-3 h-3" />
                          Em teste{trialDaysLeft > 0 ? ` · ${trialDaysLeft}d` : ''}
                        </Badge>
                      )}
                      {sub.is_shared && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Compartilhada
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {isOnTrial ? 'Fim do teste' : 'Próximo'}: {format(isOnTrial && trialEnd ? trialEnd : renewalDate, "dd/MM/yyyy", { locale: ptBR })}
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
