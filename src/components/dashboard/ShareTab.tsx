import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Share2, CheckCircle, XCircle, Clock } from "lucide-react";

export const ShareTab = () => {
  // Mock data
  const sharedSubscriptions = [
    {
      id: "1",
      name: "Netflix Premium",
      totalValue: 55.90,
      partners: [
        { name: "João Silva", status: "paid", value: 13.98 },
        { name: "Maria Santos", status: "pending", value: 13.98 },
        { name: "Pedro Costa", status: "paid", value: 13.98 },
        { name: "Você", status: "paid", value: 13.96 },
      ],
    },
    {
      id: "2",
      name: "Spotify Família",
      totalValue: 34.90,
      partners: [
        { name: "Ana Lima", status: "paid", value: 17.45 },
        { name: "Você", status: "paid", value: 17.45 },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "overdue":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-6 w-6 text-primary" />
                +Share
              </CardTitle>
              <CardDescription>
                Compartilhe assinaturas e divida custos
              </CardDescription>
            </div>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta Compartilhada
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Assinaturas Compartilhadas */}
      {sharedSubscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{subscription.name}</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {subscription.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="h-4 w-4" />
                <span>{subscription.partners.length} participantes</span>
              </div>

              {subscription.partners.map((partner, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                      {partner.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getStatusIcon(partner.status)}
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(partner.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={partner.status === "paid" ? "secondary" : "destructive"}
                    className="font-bold"
                  >
                    R$ {partner.value.toFixed(2)}
                  </Badge>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Adicionar Parceiro
                </Button>
                <Button variant="outline" className="flex-1">
                  Ver Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o +Share?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Crie uma conta compartilhada para uma assinatura específica</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Adicione parceiros através de convite por e-mail ou link</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Defina a divisão do valor (igualitária ou personalizada)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Cada parceiro paga sua parte via Stripe</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>Acompanhe o status de pagamento de todos em tempo real</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};