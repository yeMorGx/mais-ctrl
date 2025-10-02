import { Check, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/DashboardHeader";

const Pricing = () => {
  const premiumFeatures = [
    "Assinaturas ilimitadas",
    "Relatórios detalhados em PDF",
    "Notificações inteligentes",
    "Análise financeira avançada",
    "+Share - Compartilhe assinaturas",
    "Gráficos e insights",
    "Calendário de pagamentos",
    "Suporte prioritário",
    "Exportação Excel/PDF",
    "Backup automático",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Tenha controle total das suas assinaturas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano Mensal - Simples */}
          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Mensal</CardTitle>
              <CardDescription>Pague mês a mês, sem compromisso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="lg">
                Assinar Mensal
              </Button>
            </CardFooter>
          </Card>

          {/* Plano Anual - DESTAQUE COM ANIMAÇÃO */}
          <Card className="relative border-2 border-primary shadow-glow animate-glow-pulse overflow-hidden">
            {/* Selo de destaque */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-gradient-primary border-0 px-6 py-2 text-base font-bold shadow-lg animate-float">
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Mais Popular
              </Badge>
            </div>

            {/* Brilho de fundo animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 animate-border-flow" />
            
            <CardHeader className="text-center relative z-10 pt-10">
              <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
                Anual
              </CardTitle>
              <CardDescription className="text-base">
                Melhor custo-benefício • 58% de economia
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <div className="text-center py-6 bg-card/80 rounded-xl border border-primary/20">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    R$ 12,49
                  </span>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Equivale a <span className="font-semibold">R$ 149,90/ano</span>
                </p>
              </div>

              {/* Destaque de economia */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl p-4 animate-pulse">
                <p className="text-center font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Economize 58% comparado ao mensal!
                </p>
              </div>
              
              <ul className="space-y-3">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="relative z-10">
              <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg h-14 font-bold shadow-lg" size="lg">
                <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                Assinar Agora
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Informação adicional */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            💳 Pagamento seguro via Stripe • 🔒 Cancele quando quiser • ✨ Teste grátis por 7 dias
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;