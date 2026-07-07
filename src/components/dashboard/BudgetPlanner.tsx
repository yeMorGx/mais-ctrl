import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Target, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type MethodId = "70_20_10" | "80_10_10" | "50_30_20" | "custom";

interface MethodDef {
  id: MethodId;
  label: string;
  description: string;
  needs: number;   // essenciais / fixos
  wants: number;   // desejos / lazer
  savings: number; // investir / poupar
}

const METHODS: MethodDef[] = [
  { id: "70_20_10", label: "70 / 20 / 10", description: "70% essenciais · 20% investir · 10% lazer", needs: 70, wants: 10, savings: 20 },
  { id: "80_10_10", label: "80 / 10 / 10", description: "80% essenciais · 10% investir · 10% lazer", needs: 80, wants: 10, savings: 10 },
  { id: "50_30_20", label: "50 / 30 / 20", description: "50% essenciais · 30% desejos · 20% investir", needs: 50, wants: 30, savings: 20 },
  { id: "custom",   label: "Personalizado", description: "Defina seus próprios percentuais", needs: 60, wants: 20, savings: 20 },
];

function monthlyValue(value: number, frequency?: string) {
  const v = Number(value) || 0;
  switch (frequency) {
    case "annual": return v / 12;
    case "quarterly": return v / 3;
    case "weekly": return v * 4;
    case "daily": return v * 30;
    default: return v;
  }
}

interface BudgetPlannerProps {
  subscriptions: any[];
}

export function BudgetPlanner({ subscriptions }: BudgetPlannerProps) {
  const { user } = useAuth();
  const storageKey = user?.id ? `budgetPlanner_${user.id}` : "budgetPlanner";

  const [income, setIncome] = useState<number>(0);
  const [method, setMethod] = useState<MethodId>("50_30_20");
  const [custom, setCustom] = useState({ needs: 60, wants: 20, savings: 20 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setIncome(parsed.income ?? 0);
        setMethod(parsed.method ?? "50_30_20");
        if (parsed.custom) setCustom(parsed.custom);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ income, method, custom }));
  }, [income, method, custom, storageKey]);

  const { data: installments = [] } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("card_installments").select("*").eq("user_id", user?.id).eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: financings = [] } = useQuery({
    queryKey: ["financings", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("financings").select("*").eq("user_id", user?.id).eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const fixedSpend = useMemo(() => {
    const subs = subscriptions.reduce((s, x) => s + monthlyValue(Number(x.value), x.frequency), 0);
    const inst = installments.reduce((s: number, x: any) => s + Number(x.installment_value || 0), 0);
    const fin  = financings.reduce((s: number, x: any) => s + Number(x.monthly_payment ?? x.installment_value ?? 0), 0);
    return subs + inst + fin;
  }, [subscriptions, installments, financings]);

  const selected = METHODS.find(m => m.id === method)!;
  const pct = method === "custom" ? custom : { needs: selected.needs, wants: selected.wants, savings: selected.savings };
  const totalPct = pct.needs + pct.wants + pct.savings;

  const budget = {
    needs: (income * pct.needs) / 100,
    wants: (income * pct.wants) / 100,
    savings: (income * pct.savings) / 100,
  };

  const needsUsedPct = budget.needs > 0 ? Math.min(100, (fixedSpend / budget.needs) * 100) : 0;
  const overNeeds = fixedSpend > budget.needs;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          Planejador de orçamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Métodos de divisão da sua renda para equilibrar essenciais, desejos e poupança.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Income input */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="income">Sua renda mensal (R$)</Label>
            <Input
              id="income"
              type="number"
              inputMode="decimal"
              placeholder="Ex: 5000"
              value={income || ""}
              onChange={(e) => setIncome(Number(e.target.value) || 0)}
            />
          </div>
          {income > 0 && (
            <div className="text-sm text-muted-foreground">
              Você já tem <span className="font-semibold text-foreground">R$ {fixedSpend.toFixed(2)}</span> em gastos fixos
            </div>
          )}
        </div>

        {/* Method selector */}
        <div className="space-y-2">
          <Label>Método de divisão</Label>
          <Tabs value={method} onValueChange={(v) => setMethod(v as MethodId)}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              {METHODS.map(m => (
                <TabsTrigger key={m.id} value={m.id}>{m.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">{selected.description}</p>
        </div>

        {/* Custom inputs */}
        {method === "custom" && (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Essenciais %</Label>
              <Input type="number" value={custom.needs} onChange={(e) => setCustom({ ...custom, needs: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desejos %</Label>
              <Input type="number" value={custom.wants} onChange={(e) => setCustom({ ...custom, wants: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Poupar %</Label>
              <Input type="number" value={custom.savings} onChange={(e) => setCustom({ ...custom, savings: Number(e.target.value) || 0 })} />
            </div>
            {totalPct !== 100 && (
              <p className="col-span-3 text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Os percentuais somam {totalPct}%. O ideal é 100%.
              </p>
            )}
          </div>
        )}

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BudgetBlock
            title="Essenciais"
            subtitle="Contas fixas, moradia, transporte"
            percent={pct.needs}
            amount={budget.needs}
            used={fixedSpend}
            tone="primary"
          />
          <BudgetBlock
            title="Desejos / Lazer"
            subtitle="Streaming extra, restaurantes, hobbies"
            percent={pct.wants}
            amount={budget.wants}
            tone="accent"
          />
          <BudgetBlock
            title="Investir / Poupar"
            subtitle="Reserva, investimentos, metas"
            percent={pct.savings}
            amount={budget.savings}
            tone="emerald"
          />
        </div>

        {/* Fixed spend vs needs budget */}
        {income > 0 && (
          <div className="p-4 rounded-xl border bg-card/40 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Gastos fixos vs orçamento de essenciais
              </span>
              <span className={overNeeds ? "text-destructive font-semibold" : "text-emerald-500 font-semibold"}>
                R$ {fixedSpend.toFixed(2)} / R$ {budget.needs.toFixed(2)}
              </span>
            </div>
            <Progress value={needsUsedPct} className={overNeeds ? "[&>div]:bg-destructive" : ""} />
            {overNeeds ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Seus fixos ultrapassam o orçamento de essenciais em R$ {(fixedSpend - budget.needs).toFixed(2)}. Reveja assinaturas e parcelas.
              </p>
            ) : (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sobram R$ {(budget.needs - fixedSpend).toFixed(2)} dentro dos essenciais.
              </p>
            )}
          </div>
        )}

        {income === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Informe sua renda mensal para ver o plano personalizado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetBlock({
  title,
  subtitle,
  percent,
  amount,
  used,
  tone,
}: {
  title: string;
  subtitle: string;
  percent: number;
  amount: number;
  used?: number;
  tone: "primary" | "accent" | "emerald";
}) {
  const toneClass = {
    primary: "from-primary/10 to-primary/5 border-primary/20",
    accent: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  }[tone];
  return (
    <div className={`p-4 rounded-xl border bg-gradient-to-br ${toneClass}`}>
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">{title}</p>
        <span className="text-xs opacity-70">{percent}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
      <p className="text-2xl font-bold">R$ {amount.toFixed(2)}</p>
      {typeof used === "number" && (
        <p className="text-xs text-muted-foreground mt-1">Uso atual: R$ {used.toFixed(2)}</p>
      )}
    </div>
  );
}
