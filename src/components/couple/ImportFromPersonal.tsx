import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logCoupleActivity, brl } from "@/hooks/useCouple";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Props { coupleId: string; open: boolean; onOpenChange: (v: boolean) => void; }

type Sub = { id: string; name: string; value: number; frequency: string; renewal_date: string };

const mapFreq = (f: string) => (f === "monthly" || f === "weekly" || f === "yearly" ? f : f === "annual" ? "yearly" : "monthly");

export const ImportFromPersonal = ({ coupleId, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["personal-subs-for-import", user?.id],
    queryFn: async (): Promise<Sub[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from("subscriptions")
        .select("id, name, value, frequency, renewal_date")
        .eq("user_id", user.id)
        .eq("is_active", true);
      return (data as Sub[]) || [];
    },
    enabled: open && !!user,
  });

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    const allOn = subs.every((s) => selected[s.id]);
    const next: Record<string, boolean> = {};
    if (!allOn) subs.forEach((s) => { next[s.id] = true; });
    setSelected(next);
  };

  const importSelected = async () => {
    if (!user) return;
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    setSaving(true);
    try {
      const chosen = subs.filter((s) => ids.includes(s.id));
      const rows = chosen.map((s) => ({
        couple_id: coupleId,
        created_by: user.id,
        name: s.name,
        category: "Assinatura",
        amount: Number(s.value),
        expense_date: s.renewal_date,
        responsible: "both",
        status: "pending",
        recurrence: mapFreq(s.frequency),
      }));
      const { error } = await db.from("couple_expenses").insert(rows);
      if (error) throw error;
      await logCoupleActivity(coupleId, user.id, `importou ${rows.length} assinatura(s) do Meu Espaço`, "expense");
      qc.invalidateQueries({ queryKey: ["couple_expenses", coupleId] });
      toast({ title: "Importado", description: `${rows.length} item(ns) adicionados ao +2` });
      setSelected({});
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const count = Object.values(selected).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Importar do Meu Espaço</DialogTitle>
          <DialogDescription>Traga suas assinaturas pessoais para o +2 como despesas do casal.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : subs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura ativa em Meu Espaço.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{subs.length} assinatura(s) encontradas</span>
              <button type="button" onClick={toggleAll} className="font-medium text-rose-500 hover:underline">
                {subs.every((s) => selected[s.id]) ? "Desmarcar todas" : "Selecionar todas"}
              </button>
            </div>
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {subs.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card/50 p-3 hover:bg-card">
                  <Checkbox checked={!!selected[s.id]} onCheckedChange={() => toggle(s.id)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.frequency} · {brl(Number(s.value))}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={importSelected} disabled={saving || count === 0} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Importar ${count > 0 ? `(${count})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
