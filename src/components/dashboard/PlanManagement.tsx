import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, CreditCard, Calendar, XCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanManagementProps {
  isPremium?: boolean;
}

export const PlanManagement = ({ isPremium = false }: PlanManagementProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPremium ? (
                  <>
                    <Crown className="h-5 w-5 text-primary" />
                    +Premium
                  </>
                ) : (
                  "Plano Gratuito"
                )}
              </CardTitle>
              <CardDescription>
                {isPremium
                  ? "Todos os recursos liberados"
                  : "Recursos limitados"}
              </CardDescription>
            </div>
            <Badge
              variant={isPremium ? "default" : "secondary"}
              className={isPremium ? "bg-gradient-primary" : ""}
            >
              {isPremium ? "Ativo" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">Plano Anual</p>
                  <p className="text-sm text-muted-foreground">R$ 12,49/mês</p>
                </div>
                <p className="text-2xl font-bold">R$ 149,90/ano</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Próxima renovação: 15 de Fevereiro de 2026</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça upgrade para o plano +Premium e desbloqueie todos os recursos
              </p>
              <Button
                className="w-full bg-gradient-primary"
                size="lg"
                onClick={() => navigate("/pricing")}
              >
                <Crown className="mr-2 h-5 w-5" />
                Fazer Upgrade para +Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Seus pagamentos do plano +Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "15/01/2025", amount: "R$ 149,90", status: "Pago" },
                { date: "15/01/2024", amount: "R$ 149,90", status: "Pago" },
              ].map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{payment.date}</p>
                      <Badge variant="secondary" className="mt-1">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="font-bold">{payment.amount}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gerenciar Assinatura */}
      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>Opções de gerenciamento do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <RotateCcw className="mr-2 h-4 w-4" />
              Renovar Agora
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <XCircle className="mr-2 h-4 w-4" />
              Desativar Cobrança Recorrente
            </Button>
            <Button variant="destructive" className="w-full justify-start">
              Cancelar Assinatura
            </Button>
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