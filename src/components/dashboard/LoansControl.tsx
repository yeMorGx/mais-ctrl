import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Banknote,
  CheckCircle2,
  HandCoins,
  Landmark,
  Loader2,
  Pencil,
  Percent,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LoanType = "personal" | "bank" | "consigned" | "friend" | "overdraft" | "other";
type LoanStatus = "active" | "paused" | "paid_off";

interface Loan {
  id: string;
  user_id: string;
  name: string;
  lender: string | null;
  loan_type: LoanType;
  principal_amount: number;
  total_amount: number;
  interest_rate: number;
  installment_value: number;
  total_installments: number;
  paid_installments: number;
  due_day: number;
  start_date: string;
  status: LoanStatus;
  notes: string | null;
}

const TYPE_META: Record<LoanType, { label: string; icon: React.ElementType }> = {
  personal: { label: "Empréstimo pessoal", icon: Wallet },
  bank: { label: "Banco / financeira", icon: Landmark },
  consigned: { label: "Consignado", icon: Banknote },
  friend: { label: "Amigo / familiar", icon: Users },
  overdraft: { label: "Cheque especial", icon: Percent },
  other: { label: "Outro", icon: HandCoins },
};

const STATUS_META: Record<LoanStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Em pagamento", variant: "default" },
  paused: { label: "Pausado", variant: "outline" },
  paid_off: { label: "Quitado", variant: "secondary" },
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

const emptyForm = {
  name: "",
  lender: "",
  loan_type: "personal" as LoanType,
  principal_amount: "",
  total_amount: "",
  interest_rate: "",
  installment_value: "",
  total_installments: "12",
  paid_installments: "0",
  due_day: "5",
  start_date: format(new Date(), "yyyy-MM-dd"),
  status: "active" as LoanStatus,
  notes: "",
};

export function LoansControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("loans")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Loan[];
    },
    enabled: !!user?.id,
  });

  const totals = useMemo(() => {
    const active = loans.filter((l) => l.status === "active");
    const monthly = active.reduce((s, l) => s + Number(l.installment_value || 0), 0);
    const borrowed = loans.reduce((s, l) => s + Number(l.principal_amount || 0), 0);
    const totalToPay = loans.reduce(
      (s, l) => s + Number(l.total_amount || l.installment_value * l.total_installments || 0),
      0,
    );
    const paid = loans.reduce((s, l) => s + Number(l.installment_value || 0) * Number(l.paid_installments || 0), 0);
    return { monthly, borrowed, totalToPay, remaining: Math.max(0, totalToPay - paid), activeCount: active.length };
  }, [loans]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (loan: Loan) => {
    setEditing(loan);
    setForm({
      name: loan.name,
      lender: loan.lender || "",
      loan_type: loan.loan_type,
      principal_amount: String(loan.principal_amount ?? ""),
      total_amount: String(loan.total_amount ?? ""),
      interest_rate: String(loan.interest_rate ?? ""),
      installment_value: String(loan.installment_value ?? ""),
      total_installments: String(loan.total_installments ?? 1),
      paid_installments: String(loan.paid_installments ?? 0),
      due_day: String(loan.due_day ?? 1),
      start_date: loan.start_date,
      status: loan.status,
      notes: loan.notes || "",
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Sessão expirada");
      if (!form.name.trim()) throw new Error("Informe o nome do empréstimo");
      const totalInstallments = Math.max(1, Number(form.total_installments) || 1);
      const installment = Number(form.installment_value) || 0;
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        lender: form.lender.trim() || null,
        loan_type: form.loan_type,
        principal_amount: Number(form.principal_amount) || 0,
        total_amount: Number(form.total_amount) || installment * totalInstallments,
        interest_rate: Number(form.interest_rate) || 0,
        installment_value: installment,
        total_installments: totalInstallments,
        paid_installments: Math.min(totalInstallments, Math.max(0, Number(form.paid_installments) || 0)),
        due_day: Math.min(28, Math.max(1, Number(form.due_day) || 1)),
        start_date: form.start_date,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await (supabase as any).from("loans").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("loans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      setDialogOpen(false);
      toast({ title: editing ? "Empréstimo atualizado" : "Empréstimo adicionado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const payMutation = useMutation({
    mutationFn: async (loan: Loan) => {
      const next = Math.min(loan.total_installments, (loan.paid_installments || 0) + 1);
      const { error } = await (supabase as any)
        .from("loans")
        .update({ paid_installments: next, status: next >= loan.total_installments ? "paid_off" : loan.status })
        .eq("id", loan.id);
      if (error) throw error;
      await (supabase as any).from("loan_payments").insert({
        loan_id: loan.id,
        user_id: loan.user_id,
        installment_number: next,
        amount: Number(loan.installment_value) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      toast({ title: "Parcela registrada" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans", user?.id] });
      setDeleteId(null);
      toast({ title: "Empréstimo removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Empréstimos</h1>
          <p className="text-sm text-muted-foreground">Controle valores, juros e parcelas de cada empréstimo.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo empréstimo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={Wallet} label="Parcelas por mês" value={brl(totals.monthly)} hint={`${totals.activeCount} ativo(s)`} />
        <SummaryCard icon={HandCoins} label="Total emprestado" value={brl(totals.borrowed)} />
        <SummaryCard icon={Banknote} label="Total a pagar" value={brl(totals.totalToPay)} />
        <SummaryCard icon={Percent} label="Saldo devedor" value={brl(totals.remaining)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HandCoins className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nenhum empréstimo cadastrado</p>
            <p className="text-sm text-muted-foreground">Adicione seus empréstimos para acompanhar parcelas e juros.</p>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {loans.map((loan) => {
            const Icon = TYPE_META[loan.loan_type]?.icon || HandCoins;
            const total = Number(loan.total_amount) || Number(loan.installment_value) * loan.total_installments;
            const progress = loan.total_installments
              ? Math.round((loan.paid_installments / loan.total_installments) * 100)
              : 0;
            const remaining = Math.max(0, total - Number(loan.installment_value) * loan.paid_installments);
            return (
              <Card key={loan.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{loan.name}</CardTitle>
                        <CardDescription>
                          {TYPE_META[loan.loan_type]?.label}
                          {loan.lender ? ` · ${loan.lender}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={STATUS_META[loan.status].variant}>{STATUS_META[loan.status].label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Parcela" value={brl(loan.installment_value)} />
                    <Info label="Vencimento" value={`dia ${loan.due_day}`} />
                    <Info label="Juros" value={`${Number(loan.interest_rate || 0).toFixed(2)}% a.m.`} />
                    <Info label="Saldo devedor" value={brl(remaining)} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {loan.paid_installments}/{loan.total_installments} parcelas
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Início em {format(parseISO(loan.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {loan.notes && <p className="text-sm text-muted-foreground">{loan.notes}</p>}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={loan.paid_installments >= loan.total_installments || payMutation.isPending}
                      onClick={() => payMutation.mutate(loan)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Pagar parcela
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(loan)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => setDeleteId(loan.id)}>
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar empréstimo" : "Novo empréstimo"}</DialogTitle>
            <DialogDescription>Preencha os dados para acompanhar as parcelas e o saldo devedor.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="loan-name">Nome</Label>
              <Input id="loan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Empréstimo reforma" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.loan_type} onValueChange={(v) => setForm({ ...form, loan_type: v as LoanType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-lender">Credor</Label>
                <Input id="loan-lender" value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} placeholder="Banco, pessoa..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-principal">Valor emprestado (R$)</Label>
                <Input id="loan-principal" type="number" step="0.01" value={form.principal_amount} onChange={(e) => setForm({ ...form, principal_amount: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-total">Total a pagar (R$)</Label>
                <Input id="loan-total" type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-installment">Valor da parcela (R$)</Label>
                <Input id="loan-installment" type="number" step="0.01" value={form.installment_value} onChange={(e) => setForm({ ...form, installment_value: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-rate">Juros (% a.m.)</Label>
                <Input id="loan-rate" type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-total-inst">Total de parcelas</Label>
                <Input id="loan-total-inst" type="number" min="1" value={form.total_installments} onChange={(e) => setForm({ ...form, total_installments: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-paid-inst">Parcelas pagas</Label>
                <Input id="loan-paid-inst" type="number" min="0" value={form.paid_installments} onChange={(e) => setForm({ ...form, paid_installments: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-due-day">Dia de vencimento</Label>
                <Input id="loan-due-day" type="number" min="1" max="28" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-start">Início</Label>
                <Input id="loan-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Situação</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LoanStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-notes">Observações</Label>
              <Textarea id="loan-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empréstimo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação também remove os pagamentos registrados e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1.5 p-4">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
