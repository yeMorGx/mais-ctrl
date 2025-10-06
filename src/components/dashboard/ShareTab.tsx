import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Share2, CheckCircle, XCircle, Clock, UserPlus, CreditCard, Eye, Link2, Sparkles } from "lucide-react";

export const ShareTab = () => {
  // Dados reais - vazio por padrão
  const sharedSubscriptions: any[] = [];

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
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta Compartilhada
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Assinaturas Compartilhadas */}
      {sharedSubscriptions.length === 0 && (
        <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <CardContent className="py-16 text-center">
            {/* Ilustração Animada */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-2 bg-gradient-primary rounded-full opacity-30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Share2 className="h-12 w-12 text-primary animate-float" />
                  <Sparkles className="h-5 w-5 text-secondary absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h3 className="font-semibold text-xl mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Nenhuma assinatura compartilhada
            </h3>
            <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
              Economize junto. Crie sua primeira conta compartilhada e divida custos com segurança.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-8 max-w-sm mx-auto">
              Compartilhe Netflix, Spotify, Prime e mais com amigos e família
            </p>
            
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-base px-8 py-6 h-auto">
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeira Conta Compartilhada
            </Button>
          </CardContent>
        </Card>
      )}
      
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
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Como funciona o +Share?
          </CardTitle>
          <CardDescription>
            Simples, seguro e rápido - comece a economizar em minutos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="font-medium">Crie uma conta compartilhada</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para uma assinatura específica (Netflix, Spotify, etc)
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span className="font-medium">Adicione parceiros</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Através de convite por e-mail ou link compartilhável
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Defina a divisão</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Do valor (igualitária ou personalizada)
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Pagamento seguro</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cada parceiro paga sua parte via Stripe
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-medium">Acompanhe em tempo real</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Status de pagamento de todos os participantes
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};