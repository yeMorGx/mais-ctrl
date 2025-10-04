import { useState } from "react";
import { Check, Sparkles, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MONTHLY_PRICE_ID = "price_1SEa8gRx6z0kwL9Sc54pVBXG";
const ANNUAL_PRICE_ID = "price_1SEa8pRx6z0kwL9SQgV247Ne";

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
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

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoading(priceId);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        // Add success parameter to redirect URL
        const successUrl = `${window.location.origin}/dashboard?success=true`;
        const checkoutUrl = new URL(data.url);
        // The success_url is already configured in the edge function, 
        // but we'll ensure it's correct
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erro ao iniciar pagamento",
        description: "Não foi possível processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

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
              <Badge className="mb-2 mx-auto w-fit bg-primary/10 text-primary border-primary/20">
                7 Dias Grátis
              </Badge>
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
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => handleSubscribe(MONTHLY_PRICE_ID, "Mensal")}
                disabled={loading !== null}
              >
                {loading === MONTHLY_PRICE_ID ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Assinar Mensal"
                )}
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
              <Badge className="mb-3 mx-auto w-fit bg-gradient-primary border-0 text-white shadow-lg animate-pulse">
                7 Dias Grátis
              </Badge>
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
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg h-14 font-bold shadow-lg" 
                size="lg"
                onClick={() => handleSubscribe(ANNUAL_PRICE_ID, "Anual")}
                disabled={loading !== null}
              >
                {loading === ANNUAL_PRICE_ID ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                    Assinar Agora
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Informação adicional */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              🎉 Teste Grátis por 7 Dias
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Experimente todos os recursos Premium sem compromisso. Você só será cobrado após o período de teste. 
              Cancele quando quiser, sem taxas ou multas.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>💳 Cartão solicitado mas não cobrado no trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>🔒 Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span>✨ Acesso completo por 7 dias</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;