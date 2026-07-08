import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Expense = {
  id: string; name: string; category: string | null; amount: number;
  expense_date: string; responsible: string; status: string; recurrence: string;
  installments_current: number | null; installments_total: number | null; notes: string | null;
};

interface Props { coupleId: string; }

const RESPONSIBLES = { owner: "Eu", partner: "Parceiro(a)", both: "Ambos" } as const;
const STATUSES = { paid: { label: "Pago", icon: CheckCircle2, cls: "text-green-500" }, pending: { label: "Pendente", icon: Clock, cls: "text-amber-500" }, overdue: { label: "Atrasado", icon: AlertCircle, cls: "text-red-500" } };

export const ExpensesSection = ({ coupleId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useCoupleList<Expense>("couple_expenses", coupleId, { column: "expense_date", ascending: false });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), responsible: "both", status: "pending", recurrence: "one_time", notes: "" });

  const filtered = useMemo(() => filter === "all" ? expenses : expenses.filter((e) => e.status === filter), [expenses, filter]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await db.from("couple_expenses").insert({
        couple_id: coupleId, created_by: user.id, name: form.name, category: form.category || null,
        amount: Number(form.amount), expense_date: form.expense_date, responsible: form.responsible,
        status: form.status, recurrence: form.recurrence, notes: form.notes || null,
      });
      if (error) throw error;
      await logCoupleActivity(coupleId, user.id, "adicionou despesa", "expense", undefined, { name: form.name, amount: Number(form.amount) });
      qc.invalidateQueries({ queryKey: ["couple_expenses", coupleId] });
      setOpen(false);
      setForm({ name: "", category: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), responsible: "both", status: "pending", recurrence: "one_time", notes: "" });
      toast({ title: "Despesa adicionada" });
    } catch (e) { toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const togglePaid = async (e: Expense) => {
    await db.from("couple_expenses").update({ status: e.status === "paid" ? "pending" : "paid" }).eq("id", e.id);
    if (user) await logCoupleActivity(coupleId, user.id, e.status === "paid" ? "marcou como pendente" : "pagou", "expense", e.id, { name: e.name });
    qc.invalidateQueries({ queryKey: ["couple_expenses", coupleId] });
  };
  const remove = async (id: string) => { await db.from("couple_expenses").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["couple_expenses", coupleId] }); };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Gastos do casal</CardTitle>
          <CardDescription>Todas as despesas em um só lugar</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <Plus className="mr-1 h-4 w-4" /> Nova despesa
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="overdue">Atrasados</TabsTrigger>
          </TabsList>
        </Tabs>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma despesa aqui.</p>
        : <div className="space-y-2">
            {filtered.map((e) => {
              const S = STATUSES[e.status as keyof typeof STATUSES] || STATUSES.pending;
              const Icon = S.icon;
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-3 transition hover:bg-card">
                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePaid(e)} className={S.cls}><Icon className="h-5 w-5" /></button>
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.expense_date).toLocaleDateString("pt-BR")} · {RESPONSIBLES[e.responsible as keyof typeof RESPONSIBLES]}
                        {e.category ? ` · ${e.category}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{S.label}</Badge>
                    <span className="font-semibold">{brl(Number(e.amount))}</span>
                    <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Casa, Lazer..." /></div>
            <div><Label>Valor</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div><Label>Responsável</Label>
              <Select value={form.responsible} onValueChange={(v) => setForm({ ...form, responsible: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Eu</SelectItem><SelectItem value="partner">Parceiro(a)</SelectItem><SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="paid">Pago</SelectItem><SelectItem value="overdue">Atrasado</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Recorrência</Label>
              <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="one_time">Única</SelectItem><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.amount}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
