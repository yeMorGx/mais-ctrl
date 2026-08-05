import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Plus, ChevronLeft, ChevronRight, Trash2, Pencil, CheckCircle2, Clock, Wallet } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, startOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBrandLogo } from "@/lib/subscriptionLogos";

interface CardBill {
  id: string;
  card_name: string;
  reference_month: string;
  amount: number;
  due_date: string | null;
  is_paid: boolean;
  notes: string | null;
}

const brl = (v: number) => `R$ ${Number(v || 0).toFixed(2)}`;
const monthKey = (d: Date) => format(startOfMonth(d), "yyyy-MM-dd");

const emptyForm = { card_name: "", amount: "", due_date: "", notes: "", is_paid: false };

export function CardBills() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CardBill | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["credit_card_bills", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("credit_card_bills")
        .select("*")
        .eq("user_id", user?.id)
        .order("reference_month", { ascending: false });
      if (error) throw error;
      return (data || []) as CardBill[];
    },
    enabled: !!user?.id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["credit_card_bills", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["credit_card_bills"] });
  };

  const currentKey = monthKey(month);
  const monthBills = useMemo(() => bills.filter((b) => b.reference_month === currentKey), [bills, currentKey]);

  const totals = useMemo(() => {
    const total = monthBills.reduce((s, b) => s + Number(b.amount), 0);
    const paid = monthBills.filter((b) => b.is_paid).reduce((s, b) => s + Number(b.amount), 0);
    const prevKey = monthKey(addMonths(month, -1));
    const prevTotal = bills.filter((b) => b.reference_month === prevKey).reduce((s, b) => s + Number(b.amount), 0);
    const yearTotal = bills
      .filter((b) => b.reference_month.slice(0, 4) === currentKey.slice(0, 4))
      .reduce((s, b) => s + Number(b.amount), 0);
    return { total, paid, open: total - paid, prevTotal, diff: prevTotal ? ((total - prevTotal) / prevTotal) * 100 : 0, yearTotal };
  }, [monthBills, bills, month, currentKey]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (bill: CardBill) => {
    setEditing(bill);
    setForm({
      card_name: bill.card_name,
      amount: String(bill.amount),
      due_date: bill.due_date || "",
      notes: bill.notes || "",
      is_paid: bill.is_paid,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.card_name.trim() || !form.amount) {
      toast({ title: "Preencha o cartão e o valor da fatura", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user?.id,
      card_name: form.card_name.trim(),
      reference_month: currentKey,
      amount: Number(form.amount),
      due_date: form.due_date || null,
      notes: form.notes || null,
      is_paid: form.is_paid,
      paid_at: form.is_paid ? new Date().toISOString() : null,
    };
    const query = editing
      ? (supabase as any).from("credit_card_bills").update(payload).eq("id", editing.id)
      : (supabase as any).from("credit_card_bills").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) {
      toast({
        title: "Não foi possível salvar",
        description: error.code === "23505" ? "Já existe uma fatura desse cartão neste mês." : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: editing ? "Fatura atualizada" : "Fatura adicionada" });
    setOpen(false);
    setForm(emptyForm);
    setEditing(null);
    refresh();
  };

  const togglePaid = async (bill: CardBill) => {
    await (supabase as any)
      .from("credit_card_bills")
      .update({ is_paid: !bill.is_paid, paid_at: !bill.is_paid ? new Date().toISOString() : null })
      .eq("id", bill.id);
    refresh();
  };

  const remove = async (bill: CardBill) => {
    await (supabase as any).from("credit_card_bills").delete().eq("id", bill.id);
    toast({ title: "Fatura removida" });
    refresh();
  };

  const copyPrevious = async () => {
    const prevKey = monthKey(addMonths(month, -1));
    const prev = bills.filter((b) => b.reference_month === prevKey);
    if (prev.length === 0) {
      toast({ title: "Nenhuma fatura no mês anterior para copiar" });
      return;
    }
    const existing = new Set(monthBills.map((b) => b.card_name));
    const rows = prev
      .filter((b) => !existing.has(b.card_name))
      .map((b) => ({
        user_id: user?.id,
        card_name: b.card_name,
        reference_month: currentKey,
        amount: b.amount,
        due_date: b.due_date ? format(addMonths(parseISO(b.due_date), 1), "yyyy-MM-dd") : null,
        is_paid: false,
      }));
    if (rows.length === 0) {
      toast({ title: "Todos os cartões já estão lançados neste mês" });
      return;
    }
    const { error } = await (supabase as any).from("credit_card_bills").insert(rows);
    if (error) {
      toast({ title: "Erro ao copiar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${rows.length} fatura(s) copiada(s) do mês anterior` });
    refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Faturas de cartão
              <Badge variant="secondary">{monthBills.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[110px] text-center text-sm font-medium capitalize">
                  {format(month, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={copyPrevious}>Repetir mês anterior</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openNew}>
                    <Plus className="mr-1 h-4 w-4" /> Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editing ? "Editar fatura" : `Nova fatura · ${format(month, "MMMM yyyy", { locale: ptBR })}`}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cartão</Label>
                      <Input
                        placeholder="Ex: Nubank, Itaú Black, Inter"
                        value={form.card_name}
                        onChange={(e) => setForm({ ...form, card_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Valor da fatura</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vencimento</Label>
                        <Input
                          type="date"
                          value={form.due_date}
                          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        rows={2}
                        placeholder="Opcional"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Fatura já paga</p>
                        <p className="text-xs text-muted-foreground">Some no total, mas conta como quitada</p>
                      </div>
                      <Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <SummaryPill label="Total do mês" value={brl(totals.total)} icon={<CreditCard className="h-4 w-4" />} tone="primary" />
            <SummaryPill label="Em aberto" value={brl(totals.open)} icon={<Clock className="h-4 w-4" />} tone="amber" />
            <SummaryPill label="Pago" value={brl(totals.paid)} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
            <SummaryPill
              label="Total no ano"
              value={brl(totals.yearTotal)}
              icon={<Wallet className="h-4 w-4" />}
              tone="violet"
              hint={
                totals.prevTotal
                  ? `${totals.diff >= 0 ? "+" : ""}${totals.diff.toFixed(0)}% vs mês anterior`
                  : undefined
              }
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : monthBills.length === 0 ? (
            <div className="py-10 text-center">
              <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma fatura lançada em {format(month, "MMMM yyyy", { locale: ptBR })}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> Lançar primeira fatura
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {monthBills.map((b) => {
                const logo = getBrandLogo?.(b.card_name);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/40 p-3 transition-colors hover:bg-card/70">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {logo ? <img src={logo} alt="" className="h-5 w-5 object-contain" /> : <CreditCard className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.card_name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {b.due_date && <span>Vence {format(parseISO(b.due_date), "dd MMM", { locale: ptBR })}</span>}
                          {b.notes && <span className="truncate">• {b.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold">{brl(Number(b.amount))}</p>
                        <button
                          type="button"
                          onClick={() => togglePaid(b)}
                          className={`text-xs font-medium ${b.is_paid ? "text-emerald-500" : "text-amber-500"} hover:underline`}
                        >
                          {b.is_paid ? "Paga" : "Marcar como paga"}
                        </button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(b)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "primary" | "amber" | "emerald" | "violet";
  hint?: string;
}) {
  const toneClass = {
    primary: "from-primary/10 to-primary/5 text-primary",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-500",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-500",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-500",
  }[tone];
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs opacity-80">{icon}<span>{label}</span></div>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs opacity-70">{hint}</p>}
    </div>
  );
}
