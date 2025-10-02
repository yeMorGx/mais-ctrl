import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, PiggyBank, Target, AlertTriangle, CheckCircle } from "lucide-react";

export const FinancialTips = () => {
  const tips = [
    {
      icon: <TrendingDown className="h-5 w-5" />,
      title: "Reduza Assinaturas Não Utilizadas",
      description: "Cancele serviços que você não usa há mais de 2 meses. Em média, pessoas economizam R$ 150/mês fazendo isso.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <PiggyBank className="h-5 w-5" />,
      title: "Negocie Planos Anuais",
      description: "Planos anuais costumam ter desconto de 20-50%. Considere mudar para anual nas assinaturas que você realmente usa.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Defina um Limite Mensal",
      description: "Estabeleça um teto de gastos com assinaturas (ex: 5% da sua renda) e monitore mensalmente.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Evite Renovações Automáticas",
      description: "Configure alertas 7 dias antes de renovações para avaliar se ainda vale a pena manter o serviço.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Use o +Share",
      description: "Divida custos de assinaturas com familiares ou amigos. Economize até 75% em serviços de streaming.",
      color: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <Card className="mt-8 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          Dicas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow bg-card"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tip.color} flex items-center justify-center text-white flex-shrink-0`}>
                  {tip.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};