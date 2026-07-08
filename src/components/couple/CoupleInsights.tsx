import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { brl } from "@/hooks/useCouple";

interface Props {
  totalIncome: number;
  totalExpenses: number;
  fixedExpenses: number;
  savings: number;
  dreams: Array<{ name: string; target_amount: number; current_amount: number }>;
  investmentTotal: number;
}

export const CoupleInsights = ({ totalIncome, totalExpenses, fixedExpenses, savings, dreams, investmentTotal }: Props) => {
  const insights: string[] = [];

  if (totalIncome > 0) {
    const fixedPct = Math.round((fixedExpenses / totalIncome) * 100);
    insights.push(`As despesas fixas representam ${fixedPct}% da renda do casal.`);
    const savePct = Math.round((savings / totalIncome) * 100);
    if (savings > 0) insights.push(`Vocês estão economizando ${savePct}% da renda este mês.`);
    if (savings < 0) insights.push(`Atenção: as despesas ultrapassaram a renda em ${brl(Math.abs(savings))}.`);
  }

  if (savings > 200) insights.push(`Vocês têm capacidade para investir aproximadamente ${brl(savings * 0.5)} este mês.`);

  const nextDream = dreams.find((d) => d.current_amount < d.target_amount);
  if (nextDream && savings > 0) {
    const remaining = nextDream.target_amount - nextDream.current_amount;
    const months = Math.ceil(remaining / Math.max(savings, 1));
    insights.push(`No ritmo atual, o sonho "${nextDream.name}" será conquistado em ~${months} ${months === 1 ? "mês" : "meses"}.`);
  }

  if (investmentTotal > 10000) insights.push(`O patrimônio investido já passou de ${brl(investmentTotal)} — parabéns!`);
  if (!insights.length) insights.push("Comece cadastrando receitas e despesas para ver insights personalizados.");

  return (
    <Card className="animate-fade-in border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-rose-500" />
          Insights do casal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((i, k) => (
            <li key={k} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
