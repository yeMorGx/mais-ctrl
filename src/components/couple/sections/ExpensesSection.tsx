import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, Clock, AlertCircle, Download, Repeat, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useCoupleMembers, memberFirstName } from "@/hooks/useCoupleMembers";
import { useAuth } from "@/hooks/useAuth";
import { ImportFromPersonal } from "../ImportFromPersonal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Expense = {
  id: string; name: string; category: string | null; amount: number;
  expense_date: string; responsible: string; status: string; recurrence: string;
  installments_current: number | null; installments_total: number | null; notes: string | null;
  created_by: string;
};

interface Props { coupleId: string; ownerId: string; partnerId: string | null; }

const STATUSES = { paid: { label: "Pago", icon: CheckCircle2, cls: "text-green-500" }, pending: { label: "Pendente", icon: Clock, cls: "text-amber-500" }, overdue: { label: "Atrasado", icon: AlertCircle, cls: "text-red-500" } };

const isFixed = (r: string) => r !== "one_time";

export const ExpensesSection = ({ coupleId, ownerId, partnerId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useCoupleList<Expense>("couple_expenses", coupleId, { column: "expense_date", ascending: false });
  const { data: members = [] } = useCoupleMembers(ownerId, partnerId);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [status, setStatus] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [kind, setKind] = useState<"all" | "fixed" | "one_time">("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), responsible: "both", status: "pending", recurrence: "monthly", notes: "" });

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (kind === "fixed" && !isFixed(e.recurrence)) return false;
      if (kind === "one_time" && e.recurrence !== "one_time") return false;
      return true;
    });
  }, [expenses, status, kind]);

  const totals = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExp = expenses.filter((e) => new Date(e.expense_date) >= monthStart);
    return {
      fixed: monthExp.filter((e) => isFixed(e.recurrence)).reduce((s, e) => s + Number(e.amount), 0),
      one_time: monthExp.filter((e) => e.recurrence === "one_time").reduce((s, e) => s + Number(e.amount), 0),
    };
  }, [expenses]);

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
      setForm({ name: "", category: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), responsible: "both", status: "pending", recurrence: "monthly", notes: "" });
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

  const openFixed = () => { setForm({ ...form, recurrence: "monthly" }); setOpen(true); };
  const openOneTime = () => { setForm({ ...form, recurrence: "one_time" }); setOpen(true); };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Gastos do casal</CardTitle>
          <CardDescription>Todas as despesas em um só lugar</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Download className="mr-1 h-4 w-4" /> Importar do Meu Espaço
          </Button>
          <Button size="sm" variant="outline" onClick={openOneTime}>
            <Zap className="mr-1 h-4 w-4" /> Avulso
          </Button>
          <Button size="sm" onClick={openFixed} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <Repeat className="mr-1 h-4 w-4" /> Fixa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Totals */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Repeat className="h-3 w-3" /> Fixas do mês</div>
            <p className="text-lg font-semibold">{brl(totals.fixed)}</p>
          </div>
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-3 w-3" /> Avulsas do mês</div>
            <p className="text-lg font-semibold">{brl(totals.one_time)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="fixed"><Repeat className="mr-1 h-3 w-3" /> Fixas</TabsTrigger>
              <TabsTrigger value="one_time"><Zap className="mr-1 h-3 w-3" /> Avulsas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
              <TabsTrigger value="overdue">Atrasados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma despesa aqui.</p>
        : <div className="space-y-2">
            {filtered.map((e) => {
              const S = STATUSES[e.status as keyof typeof STATUSES] || STATUSES.pending;
              const Icon = S.icon;
              const author = memberById.get(e.created_by);
              const fixed = isFixed(e.recurrence);
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-3 transition hover:bg-card">
                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePaid(e)} className={S.cls}><Icon className="h-5 w-5" /></button>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={author?.avatar_url || undefined} />
                      <AvatarFallback>{(author?.full_name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {memberFirstName(author)} · {new Date(e.expense_date).toLocaleDateString("pt-BR")}
                        {e.category ? ` · ${e.category}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {fixed ? <><Repeat className="mr-1 h-3 w-3" /> Fixa</> : <><Zap className="mr-1 h-3 w-3" /> Avulsa</>}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{S.label}</Badge>
                    <span className="font-semibold">{brl(Number(e.amount))}</span>
                    <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>}
      </CardContent>

      <ImportFromPersonal coupleId={coupleId} open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isFixed(form.recurrence) ? "Nova despesa fixa" : "Nova despesa avulsa"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Casa, Lazer..." /></div>
            <div><Label>Valor</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={isFixed(form.recurrence) ? "fixed" : "one_time"} onValueChange={(v) => setForm({ ...form, recurrence: v === "fixed" ? "monthly" : "one_time" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed">Fixa (recorrente)</SelectItem><SelectItem value="one_time">Avulsa (única)</SelectItem></SelectContent>
              </Select>
            </div>
            {isFixed(form.recurrence) && (
              <div><Label>Recorrência</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="paid">Pago</SelectItem><SelectItem value="overdue">Atrasado</SelectItem></SelectContent>
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
