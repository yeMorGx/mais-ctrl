import { useState } from "react";
import { Plus, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type Dream = {
  id: string; name: string; image_url: string | null;
  target_amount: number; current_amount: number; deadline: string | null; achieved: boolean;
};

interface Props { coupleId: string; }

export const DreamsSection = ({ coupleId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: dreams = [], isLoading } = useCoupleList<Dream>("couple_dreams", coupleId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", image_url: "", target_amount: "", deadline: "" });
  const [contribOpen, setContribOpen] = useState<Dream | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  const save = async () => {
    if (!user) return;
    const { error } = await db.from("couple_dreams").insert({
      couple_id: coupleId, created_by: user.id, name: form.name, image_url: form.image_url || null,
      target_amount: Number(form.target_amount), deadline: form.deadline || null,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await logCoupleActivity(coupleId, user.id, "criou sonho", "dream", undefined, { name: form.name });
    qc.invalidateQueries({ queryKey: ["couple_dreams", coupleId] });
    setOpen(false); setForm({ name: "", image_url: "", target_amount: "", deadline: "" });
    toast({ title: "Sonho adicionado ✨" });
  };

  const contribute = async () => {
    if (!user || !contribOpen) return;
    const amount = Number(contribAmount);
    if (!amount) return;
    const newCurrent = Number(contribOpen.current_amount) + amount;
    const achieved = newCurrent >= Number(contribOpen.target_amount);
    await db.from("couple_dream_contributions").insert({
      couple_id: coupleId, dream_id: contribOpen.id, member_id: user.id, amount,
    });
    await db.from("couple_dreams").update({ current_amount: newCurrent, achieved, achieved_at: achieved ? new Date().toISOString() : null }).eq("id", contribOpen.id);
    await logCoupleActivity(coupleId, user.id, "contribuiu para sonho", "dream", contribOpen.id, { amount, name: contribOpen.name });
    if (achieved) await logCoupleActivity(coupleId, user.id, "conquistou o sonho", "dream", contribOpen.id, { name: contribOpen.name });
    qc.invalidateQueries({ queryKey: ["couple_dreams", coupleId] });
    setContribOpen(null); setContribAmount("");
    toast({ title: achieved ? "Sonho conquistado! 🎉" : "Aporte registrado" });
  };

  const remove = async (id: string) => {
    await db.from("couple_dreams").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["couple_dreams", coupleId] });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Nossos sonhos</CardTitle>
          <CardDescription>O que estamos construindo juntos</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <Plus className="mr-1 h-4 w-4" /> Novo sonho
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : dreams.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Sonhe grande! Adicione o primeiro objetivo.</p>
        : <div className="grid gap-4 sm:grid-cols-2">
            {dreams.map((d) => {
              const pct = Math.min(100, (Number(d.current_amount) / Math.max(Number(d.target_amount), 1)) * 100);
              return (
                <div key={d.id} className="group overflow-hidden rounded-xl border bg-card/50 transition hover:shadow-lg">
                  {d.image_url ? (
                    <img src={d.image_url} alt={d.name} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                      <Sparkles className="h-8 w-8 text-rose-500" />
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{d.name}{d.achieved && " 🎉"}</p>
                      <Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{brl(Number(d.current_amount))}</span>
                      <span>de {brl(Number(d.target_amount))}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    {d.deadline && <p className="text-xs text-muted-foreground">Até {new Date(d.deadline).toLocaleDateString("pt-BR")}</p>}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setContribOpen(d)}>Contribuir</Button>
                  </div>
                </div>
              );
            })}
          </div>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo sonho</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Japão, Casa..." /></div>
            <div><Label>URL da imagem (opcional)</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Valor desejado</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} /></div>
            <div><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name || !form.target_amount}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contribOpen} onOpenChange={(o) => !o && setContribOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contribuir para {contribOpen?.name}</DialogTitle></DialogHeader>
          <div><Label>Valor do aporte</Label><Input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribOpen(null)}>Cancelar</Button>
            <Button onClick={contribute} disabled={!contribAmount}>Contribuir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
