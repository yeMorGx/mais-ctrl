import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useCoupleList } from "@/hooks/useCouple";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Ach = { id: string; code: string; progress: number; unlocked: boolean; unlocked_at: string | null };

interface Props {
  coupleId: string;
  totalInvested: number;
  monthsSaving: number;
  dreamsAchieved: number;
  paidThisMonth: number;
  overdueThisMonth: number;
  coupleStartedAt: string;
}

const CATALOG = [
  { code: "no_overdue_month", icon: "🥇", title: "Mês sem atrasos", desc: "Zero contas atrasadas no mês" },
  { code: "emergency_reserve", icon: "💰", title: "Reserva de emergência", desc: "Primeira reserva criada" },
  { code: "first_dream", icon: "🎯", title: "Primeiro sonho", desc: "Conquistou o primeiro sonho" },
  { code: "10k_invested", icon: "🏦", title: "R$10.000 investidos", desc: "Patrimônio investido acima de 10k" },
  { code: "3_months_saving", icon: "📈", title: "3 meses economizando", desc: "Trimestre economizando" },
  { code: "one_year", icon: "❤️", title: "1 ano de +2", desc: "Um ano juntos no espaço" },
  { code: "all_paid_month", icon: "💳", title: "Tudo em dia", desc: "Todas as contas pagas neste mês" },
];

export const AchievementsSection = ({ coupleId, totalInvested, monthsSaving, dreamsAchieved, paidThisMonth, overdueThisMonth, coupleStartedAt }: Props) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: achievements = [] } = useCoupleList<Ach>("couple_achievements", coupleId);

  useEffect(() => {
    if (!coupleId) return;
    const yearsUsing = (Date.now() - new Date(coupleStartedAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const checks: Array<{ code: string; ok: boolean; progress: number }> = [
      { code: "no_overdue_month", ok: overdueThisMonth === 0 && paidThisMonth > 0, progress: overdueThisMonth === 0 ? 100 : 0 },
      { code: "emergency_reserve", ok: totalInvested > 0, progress: Math.min(100, totalInvested / 1000) },
      { code: "first_dream", ok: dreamsAchieved > 0, progress: dreamsAchieved > 0 ? 100 : 0 },
      { code: "10k_invested", ok: totalInvested >= 10000, progress: Math.min(100, (totalInvested / 10000) * 100) },
      { code: "3_months_saving", ok: monthsSaving >= 3, progress: Math.min(100, (monthsSaving / 3) * 100) },
      { code: "one_year", ok: yearsUsing >= 1, progress: Math.min(100, yearsUsing * 100) },
      { code: "all_paid_month", ok: paidThisMonth > 0 && overdueThisMonth === 0, progress: paidThisMonth > 0 && overdueThisMonth === 0 ? 100 : 0 },
    ];

    (async () => {
      let unlockedNew = false;
      for (const c of checks) {
        const existing = achievements.find((a) => a.code === c.code);
        const nowUnlocked = c.ok;
        if (!existing || Math.abs(Number(existing.progress) - c.progress) > 1 || existing.unlocked !== nowUnlocked) {
          const wasUnlocked = existing?.unlocked ?? false;
          await db.from("couple_achievements").upsert({
            couple_id: coupleId, code: c.code, progress: c.progress,
            unlocked: nowUnlocked, unlocked_at: nowUnlocked ? (existing?.unlocked_at || new Date().toISOString()) : null,
          }, { onConflict: "couple_id,code" });
          if (!wasUnlocked && nowUnlocked) {
            unlockedNew = true;
            const meta = CATALOG.find((x) => x.code === c.code);
            if (meta) toast({ title: `${meta.icon} Conquista desbloqueada!`, description: meta.title });
          }
        }
      }
      if (unlockedNew) qc.invalidateQueries({ queryKey: ["couple_achievements", coupleId] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, totalInvested, monthsSaving, dreamsAchieved, paidThisMonth, overdueThisMonth]);

  return (
    <Card className="animate-fade-in">
      <CardHeader><CardTitle>Nossas conquistas</CardTitle><CardDescription>Motivação pra crescer juntos</CardDescription></CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((c) => {
            const state = achievements.find((a) => a.code === c.code);
            const unlocked = state?.unlocked;
            const progress = Number(state?.progress || 0);
            return (
              <div key={c.code} className={`rounded-xl border p-4 transition ${unlocked ? "bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-500/30" : "bg-card/50 opacity-70"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">{c.icon}</span>
                  <p className="font-semibold">{c.title}</p>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{c.desc}</p>
                <Progress value={progress} className="h-1.5" />
                {unlocked && state?.unlocked_at && (
                  <p className="mt-2 text-xs text-rose-500">Desbloqueada em {new Date(state.unlocked_at).toLocaleDateString("pt-BR")}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
