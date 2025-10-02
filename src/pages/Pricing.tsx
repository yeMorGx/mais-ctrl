import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/DashboardHeader";

const Pricing = () => {
  const features = [
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

  const freeFeatures = [
    "Até 5 assinaturas",
    "Notificações básicas",
    "Relatórios simples",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Tenha controle total das suas assinaturas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plano Mensal */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Mensal</CardTitle>
              <CardDescription>Pague mês a mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
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

          {/* Plano Anual - Destaque */}
          <Card className="border-primary shadow-glow relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary border-0 px-4 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Mais Popular
            </Badge>
            
            <CardHeader>
              <CardTitle className="text-2xl">Anual</CardTitle>
              <CardDescription>Melhor custo-benefício</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    R$ 12,49
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cobrado anualmente: R$ 149,90/ano
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-primary">
                  💰 Economize 58% comparado ao mensal!
                </p>
              </div>
              
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-primary" size="lg">
                Assinar Agora
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Plano Free */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-xl">Plano Gratuito</CardTitle>
              <CardDescription>Para começar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pricing;