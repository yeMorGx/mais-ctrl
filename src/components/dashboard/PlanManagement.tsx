import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Calendar, XCircle, RotateCcw, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { toast } from "sonner";

interface PlanManagementProps {
  isPremium?: boolean;
  subscriptionEnd?: string | null;
  status?: string;
  hasStripeSubscription?: boolean;
}

export const PlanManagement = ({ 
  isPremium = false, 
  subscriptionEnd, 
  status,
  hasStripeSubscription = false 
}: PlanManagementProps) => {
  const navigate = useNavigate();
  const { invokeFunction } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenCustomerPortal = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeFunction('customer-portal');
      
      console.log('Customer portal response:', { data, error });
      
      // Check for URL first (success case)
      if (data?.url) {
        window.open(data.url, '_blank');
        return;
      }
      
      // Get error message from various possible sources
      const errorMessage = data?.error || error?.message || '';
      console.log('Error message:', errorMessage);
      
      if (errorMessage) {
        if (errorMessage.includes('authenticated') || errorMessage.includes('session') || errorMessage.includes('401')) {
          toast.error("Sessão expirada. Faça login novamente.");
          navigate('/auth');
          return;
        }
        
        if (errorMessage.includes('No Stripe customer') || errorMessage.includes('not found')) {
          toast.info("Você ainda não possui uma assinatura ativa no Stripe. Assine o plano Premium primeiro.");
          navigate('/pricing');
          return;
        }
        
        toast.error(errorMessage);
        return;
      }
      
      toast.error("Erro ao abrir portal de gerenciamento");
    } catch (err) {
      console.error('Portal error:', err);
      toast.error("Erro ao conectar com o serviço de pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const isCancelled = status === 'canceled' || status === 'cancelled';
  const subscriptionEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
  const isExpired = subscriptionEndDate ? subscriptionEndDate < new Date() : false;
  const formattedEndDate = subscriptionEndDate 
    ? subscriptionEndDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  
  // Calculate days remaining
  const daysRemaining = subscriptionEndDate 
    ? Math.max(0, Math.ceil((subscriptionEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Alerta de Cancelamento */}
      {isCancelled && isPremium && !isExpired && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            <strong>Assinatura cancelada</strong> - Você ainda tem acesso aos recursos premium até{' '}
            <strong>{formattedEndDate}</strong>
            {daysRemaining > 0 && (
              <span> ({daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'})</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Expiração */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sua assinatura expirou</strong> - Renove agora para recuperar o acesso aos recursos premium.
          </AlertDescription>
        </Alert>
      )}

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPremium && !isExpired ? (
                  <>
                    <Crown className="h-5 w-5 text-primary" />
                    +Premium
                  </>
                ) : (
                  "Plano Gratuito"
                )}
              </CardTitle>
              <CardDescription>
                {isPremium && !isExpired
                  ? isCancelled 
                    ? "Assinatura cancelada - acesso até o fim do período"
                    : "Todos os recursos liberados"
                  : "Recursos limitados"}
              </CardDescription>
            </div>
            <Badge
              variant={isPremium && !isExpired ? (isCancelled ? "destructive" : "default") : "secondary"}
              className={isPremium && !isCancelled && !isExpired ? "bg-gradient-primary" : ""}
            >
              {isExpired ? "Expirado" : isPremium ? (isCancelled ? "Cancelado" : "Ativo") : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPremium && !isExpired ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Plano Anual</p>
                  <p className="text-sm text-muted-foreground">R$ 12,49/mês</p>
                </div>
                <p className="text-2xl font-bold">R$ 149,90/ano</p>
              </div>
              {formattedEndDate && (
                <div className={`flex items-center gap-2 text-sm ${isCancelled ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground'}`}>
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isCancelled 
                      ? `Acesso até: ${formattedEndDate}`
                      : `Próxima renovação: ${formattedEndDate}`
                    }
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça upgrade para o plano +Premium e desbloqueie todos os recursos
              </p>
              <Button
                className="w-full bg-gradient-primary"
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/pricing");
                }}
              >
                <Crown className="mr-2 h-5 w-5" />
                Fazer Upgrade para +Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gerenciar Assinatura - só mostra se tem assinatura real no Stripe */}
      {isPremium && hasStripeSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>
              {isCancelled 
                ? "Renove sua assinatura para continuar usando os recursos premium"
                : "Opções de gerenciamento do seu plano"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCancelled ? (
              <Button 
                className="w-full justify-start bg-gradient-primary"
                onClick={handleOpenCustomerPortal}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Renovar Assinatura
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleOpenCustomerPortal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Desativar Cobrança Recorrente
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleOpenCustomerPortal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Cancelar Assinatura
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do +Premium</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              "Assinaturas ilimitadas",
              "Relatórios detalhados",
              "Análise financeira avançada",
              "+Share - Divida assinaturas",
              "Gráficos e insights",
              "Suporte prioritário",
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};