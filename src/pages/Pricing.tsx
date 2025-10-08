import { useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CountdownTimer } from "@/components/CountdownTimer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MONTHLY_PRICE_ID = "price_1SEa8gRx6z0kwL9Sc54pVBXG";
const ANNUAL_PRICE_ID = "price_1SEGLYRx6z0kwL9Seel9fua1";

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
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

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const priceId = isAnnual ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const trialDays = isAnnual ? 3 : 0;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, trialDays }
      });

      if (error) throw error;

      if (data?.url) {
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
      setLoading(false);
    }
  };

  const monthlyPrice = 29.90;
  const annualPrice = 14.99;
  const annualTotal = 179.90;
  const originalAnnualTotal = 249.90;
  const savings = Math.round(((originalAnnualTotal - annualTotal) / originalAnnualTotal) * 100);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Tenha controle total das suas assinaturas
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="billing-toggle" className={`text-lg font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </Label>
            <Switch 
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="billing-toggle" className={`text-lg font-medium transition-colors flex items-center gap-2 ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
              {isAnnual && (
                <Badge className="bg-green-500 text-white border-0 ml-1">
                  Economize {savings}%
                </Badge>
              )}
            </Label>
          </div>
        </div>

        {/* Card Unificado */}
        <div className="max-w-2xl mx-auto">
          <Card className={`relative ${isAnnual ? 'border-2 border-primary shadow-glow' : 'border-border hover:shadow-md'} transition-all`}>
            {isAnnual && (
              <>
                {/* Selo de destaque */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-primary border-0 px-6 py-2.5 text-base font-bold shadow-xl">
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Mais Popular
                  </Badge>
                </div>
                {/* Brilho de fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 pointer-events-none rounded-lg" />
              </>
            )}
            
            <CardHeader className={`text-center relative z-10 ${isAnnual ? 'pt-12' : ''}`}>
              {isAnnual && (
                <Badge className="mb-3 mx-auto w-fit bg-gradient-primary border-0 text-white shadow-lg animate-pulse">
                  3 Dias Grátis
                </Badge>
              )}
              <CardTitle className={`text-3xl ${isAnnual ? 'bg-gradient-primary bg-clip-text text-transparent' : ''}`}>
                Plano {isAnnual ? 'Anual' : 'Mensal'}
              </CardTitle>
              <CardDescription className="text-base">
                {isAnnual ? 'Melhor custo-benefício • Economize 58%' : 'Pague mês a mês, sem compromisso'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              {/* Countdown Timer */}
              {isAnnual && <CountdownTimer />}
              
              {/* Preço */}
              <div className={`text-center py-6 rounded-xl ${isAnnual ? 'bg-card/80 border border-primary/20' : ''}`}>
                {isAnnual && (
                  <div className="mb-3">
                    <span className="text-2xl text-muted-foreground line-through">
                      R$ {originalAnnualTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className={`text-6xl font-bold ${isAnnual ? 'bg-gradient-primary bg-clip-text text-transparent' : ''}`}>
                    R$ {isAnnual ? annualPrice.toFixed(2) : monthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-muted-foreground">
                    Equivale a <span className="font-semibold text-green-600 dark:text-green-400">R$ {annualTotal.toFixed(2)}/ano</span>
                  </p>
                )}
              </div>

              {/* Destaque de economia (apenas anual) */}
              {isAnnual && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl p-4">
                  <p className="text-center font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                    💰 Economize {savings}% com a promoção!
                  </p>
                </div>
              )}
              
              {/* Features */}
              <ul className="space-y-3">
                {premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {isAnnual ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="relative z-10">
              <Button 
                className={`w-full text-lg h-14 font-bold shadow-lg ${
                  isAnnual 
                    ? 'bg-gradient-primary hover:opacity-90 transition-opacity' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
                size="lg"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {isAnnual && <Sparkles className="mr-2 h-5 w-5 animate-pulse" />}
                    Assinar {isAnnual ? 'Anual' : 'Mensal'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Informação adicional */}
        {isAnnual && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                🎉 Teste Grátis por 3 Dias no Plano Anual
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Experimente todos os recursos Premium no plano anual sem compromisso. Você só será cobrado após o período de teste. 
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
                  <span>✨ Acesso completo por 3 dias</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pricing;