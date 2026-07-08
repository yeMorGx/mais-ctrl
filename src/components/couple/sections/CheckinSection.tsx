import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfWeek, brl, logCoupleActivity } from "@/hooks/useCouple";
import { useToast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Props {
  coupleId: string;
  weekIncome: number; weekExpense: number; paidCount: number; pendingCount: number;
}

export const CheckinSection = ({ coupleId, weekIncome, weekExpense, paidCount, pendingCount }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const weekStart = startOfWeek().toISOString().slice(0, 10);

  const { data: checkin } = useQuery({
    queryKey: ["couple-checkin", coupleId, weekStart],
    queryFn: async () => {
      const { data } = await db.from("couple_checkins").select("*").eq("couple_id", coupleId).eq("week_start", weekStart).maybeSingle();
      return data;
    },
    enabled: !!coupleId,
  });

  const complete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await db.from("couple_checkins").upsert({
        couple_id: coupleId, completed_by: user.id, week_start: weekStart,
        summary: { weekIncome, weekExpense, paidCount, pendingCount },
        completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: "couple_id,week_start" });
      await logCoupleActivity(coupleId, user.id, "concluiu o check-in semanal", "checkin");
      qc.invalidateQueries({ queryKey: ["couple-checkin", coupleId, weekStart] });
      toast({ title: "Check-in concluído ❤️" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="animate-fade-in border-rose-500/20">
      <CardHeader>
        <CardTitle>Revisão financeira da semana</CardTitle>
        <CardDescription>Um momento para conversar sobre as finanças, juntos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card/50 p-3"><p className="text-xs text-muted-foreground">Receitas</p><p className="font-semibold text-green-500">{brl(weekIncome)}</p></div>
          <div className="rounded-lg border bg-card/50 p-3"><p className="text-xs text-muted-foreground">Despesas</p><p className="font-semibold text-red-500">{brl(weekExpense)}</p></div>
          <div className="rounded-lg border bg-card/50 p-3"><p className="text-xs text-muted-foreground">Contas pagas</p><p className="font-semibold">{paidCount}</p></div>
          <div className="rounded-lg border bg-card/50 p-3"><p className="text-xs text-muted-foreground">Pendências</p><p className="font-semibold">{pendingCount}</p></div>
        </div>
        {checkin?.completed ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" /> Revisão desta semana concluída.
          </div>
        ) : (
          <Button onClick={complete} disabled={saving} className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Concluir revisão"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
