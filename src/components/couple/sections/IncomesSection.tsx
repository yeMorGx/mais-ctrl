import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useCoupleMembers, memberFirstName } from "@/hooks/useCoupleMembers";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Income = {
  id: string;
  member_id: string;
  name: string;
  amount: number;
  recurrence: string;
};

interface Props { coupleId: string; ownerId: string; partnerId: string | null; }

export const IncomesSection = ({ coupleId, ownerId, partnerId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: incomes = [], isLoading } = useCoupleList<Income>("couple_incomes", coupleId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ member_id: user?.id || ownerId, name: "", amount: "", recurrence: "monthly" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await db.from("couple_incomes").insert({
        couple_id: coupleId,
        member_id: form.member_id,
        name: form.name,
        amount: Number(form.amount),
        recurrence: form.recurrence,
      });
      if (error) throw error;
      await logCoupleActivity(coupleId, user.id, "adicionou receita", "income", undefined, { name: form.name, amount: Number(form.amount) });
      qc.invalidateQueries({ queryKey: ["couple_incomes", coupleId] });
      setOpen(false);
      setForm({ member_id: user.id, name: "", amount: "", recurrence: "monthly" });
      toast({ title: "Receita adicionada" });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await db.from("couple_incomes").delete().eq("id", id);
    if (user) await logCoupleActivity(coupleId, user.id, "removeu receita", "income", id);
    qc.invalidateQueries({ queryKey: ["couple_incomes", coupleId] });
  };

  const memberLabel = (id: string) => (id === ownerId ? "Dono" : id === partnerId ? "Parceiro(a)" : "Membro");

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Receitas do casal</CardTitle>
          <CardDescription>Cadastre as receitas de cada um</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : incomes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma receita cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {incomes.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-3 transition hover:bg-card">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{memberLabel(i.member_id)} · {i.recurrence}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-green-600 dark:text-green-400">{brl(Number(i.amount))}</span>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova receita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>De quem é?</Label>
              <Select value={form.member_id} onValueChange={(v) => setForm({ ...form, member_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ownerId}>{user?.id === ownerId ? "Minha" : "Do parceiro"}</SelectItem>
                  {partnerId && <SelectItem value={partnerId}>{user?.id === partnerId ? "Minha" : "Do parceiro"}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salário, Freelance..." /></div>
            <div><Label>Valor</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div>
              <Label>Recorrência</Label>
              <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="one_time">Única</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.amount}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
