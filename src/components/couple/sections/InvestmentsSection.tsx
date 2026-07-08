import { useState, useMemo } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Investment = { id: string; name: string; type: string; institution: string | null; invested_amount: number; current_amount: number };

const TYPES = ["reserva", "tesouro", "cdb", "etf", "fundos", "caixinha", "cripto", "outro"];
const COLORS = ["#f43f5e", "#ec4899", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

interface Props { coupleId: string; }

export const InvestmentsSection = ({ coupleId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useCoupleList<Investment>("couple_investments", coupleId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "reserva", institution: "", invested_amount: "", current_amount: "" });

  const distribution = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i.type, (map.get(i.type) || 0) + Number(i.current_amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  const save = async () => {
    if (!user) return;
    const { error } = await db.from("couple_investments").insert({
      couple_id: coupleId, created_by: user.id, name: form.name, type: form.type,
      institution: form.institution || null, invested_amount: Number(form.invested_amount),
      current_amount: Number(form.current_amount || form.invested_amount),
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await logCoupleActivity(coupleId, user.id, "adicionou investimento", "investment", undefined, { name: form.name });
    qc.invalidateQueries({ queryKey: ["couple_investments", coupleId] });
    setOpen(false); setForm({ name: "", type: "reserva", institution: "", invested_amount: "", current_amount: "" });
  };
  const remove = async (id: string) => { await db.from("couple_investments").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["couple_investments", coupleId] }); };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Investimentos</CardTitle>
          <CardDescription>Nosso patrimônio investido</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum investimento cadastrado.</p>
        : <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-3">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{i.type}{i.institution ? ` · ${i.institution}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{brl(Number(i.current_amount))}</span>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {distribution.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => brl(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo investimento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Instituição</Label><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></div>
            <div><Label>Investido</Label><Input type="number" value={form.invested_amount} onChange={(e) => setForm({ ...form, invested_amount: e.target.value })} /></div>
            <div><Label>Atual</Label><Input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="= investido" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name || !form.invested_amount}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
