import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCoupleList, brl, type Couple } from "@/hooks/useCouple";
import { cn } from "@/lib/utils";

interface Props { couple: Couple; open: boolean; onOpenChange: (v: boolean) => void; }

type Income = { id: string; member_id: string; name: string; amount: number; recurrence: string };
type Expense = { id: string; name: string; amount: number; created_by: string; responsible: string; status: string; expense_date: string; category: string | null };

const monthlyize = (v: number, r: string) => v * (r === "weekly" ? 4 : r === "yearly" ? 1 / 12 : r === "one_time" ? 0 : 1);

export const MembersBreakdown = ({ couple, open, onOpenChange }: Props) => {
  const { data: incomes = [] } = useCoupleList<Income>("couple_incomes", couple.id);
  const { data: expenses = [] } = useCoupleList<Expense>("couple_expenses", couple.id, { column: "expense_date", ascending: false });

  const memberIds = [couple.owner_id, couple.partner_id].filter(Boolean) as string[];
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["members-breakdown", memberIds.join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", memberIds);
      return data || [];
    },
    enabled: open && memberIds.length > 0,
  });

  const monthStart = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }, []);

  const byMember = (id: string) => {
    const mIncomes = incomes.filter((i) => i.member_id === id);
    const monthly = mIncomes.reduce((s, i) => s + monthlyize(Number(i.amount), i.recurrence), 0);
    const mExpenses = expenses.filter((e) => e.created_by === id && new Date(e.expense_date) >= monthStart);
    const totalExp = mExpenses.reduce((s, e) => s + Number(e.amount), 0);
    return { mIncomes, monthly, mExpenses, totalExp, balance: monthly - totalExp };
  };

  const first = memberIds[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Visão individual</DialogTitle>
          <DialogDescription>Veja as receitas e despesas de cada um separadamente.</DialogDescription>
        </DialogHeader>

        {isLoading || profiles.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue={first} className="w-full">
            <TabsList className="w-full">
              {profiles.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="flex items-center gap-2">
                  <Avatar className="h-5 w-5"><AvatarImage src={p.avatar_url || undefined} /><AvatarFallback>{p.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                  {p.full_name?.split(" ")[0] || "Membro"}
                </TabsTrigger>
              ))}
            </TabsList>
            {profiles.map((p) => {
              const s = byMember(p.id);
              return (
                <TabsContent key={p.id} value={p.id} className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Card><CardContent className="space-y-1 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3 w-3 text-green-500" /> Receita mensal</div>
                      <p className="text-lg font-semibold">{brl(s.monthly)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="space-y-1 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="h-3 w-3 text-red-500" /> Gastos do mês</div>
                      <p className="text-lg font-semibold">{brl(s.totalExp)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="space-y-1 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3 w-3" /> Saldo</div>
                      <p className={cn("text-lg font-semibold", s.balance >= 0 ? "text-green-500" : "text-red-500")}>{brl(s.balance)}</p>
                    </CardContent></Card>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold">Receitas ({s.mIncomes.length})</p>
                    {s.mIncomes.length === 0 ? (
                      <p className="rounded-lg border bg-card/40 py-4 text-center text-xs text-muted-foreground">Nenhuma receita.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {s.mIncomes.map((i) => (
                          <div key={i.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-2.5 text-sm">
                            <span>{i.name} <Badge variant="outline" className="ml-1 text-[10px]">{i.recurrence}</Badge></span>
                            <span className="font-medium text-green-500">{brl(Number(i.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold">Despesas do mês ({s.mExpenses.length})</p>
                    {s.mExpenses.length === 0 ? (
                      <p className="rounded-lg border bg-card/40 py-4 text-center text-xs text-muted-foreground">Nenhuma despesa criada por essa pessoa.</p>
                    ) : (
                      <div className="max-h-64 space-y-1.5 overflow-y-auto">
                        {s.mExpenses.map((e) => (
                          <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-2.5 text-sm">
                            <div>
                              <span>{e.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{new Date(e.expense_date).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <span className="font-medium">{brl(Number(e.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
