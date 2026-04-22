import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import {
  AlertCircle,
  Bell,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Home,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type AssetType = "home" | "vehicle" | "land" | "business" | "education" | "other";
type FinancingStatus = "active" | "paused" | "paid_off";

interface Financing {
  id: string;
  user_id: string;
  asset_type: AssetType;
  name: string;
  institution: string | null;
  financed_amount: number;
  down_payment: number;
  interest_rate: number;
  term_months: number;
  current_installment: number;
  installment_value: number;
  start_date: string;
  due_day: number;
  status: FinancingStatus;
  alert_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FinancingPayment {
  id: string;
  financing_id: string;
  user_id: string;
  installment_number: number;
  paid_at: string;
  amount_paid: number;
  interest_paid: number;
  principal_paid: number;
  remaining_balance: number;
  notes: string | null;
}

const financingSchema = z.object({
  asset_type: z.enum(["home", "vehicle", "land", "business", "education", "other"]),
  name: z.string().trim().min(2, "Informe um nome").max(120, "Nome muito longo"),
  institution: z.string().trim().max(120, "Instituição muito longa").optional(),
  financed_amount: z.coerce.number().positive("Valor financiado deve ser maior que zero"),
  down_payment: z.coerce.number().min(0, "Entrada não pode ser negativa"),
  interest_rate: z.coerce.number().min(0, "Taxa não pode ser negativa").max(100, "Taxa inválida"),
  term_months: z.coerce.number().int().min(1, "Prazo inválido").max(600, "Prazo máximo de 600 meses"),
  current_installment: z.coerce.number().int().min(1, "Parcela atual inválida"),
  installment_value: z.coerce.number().positive("Valor da parcela deve ser maior que zero"),
  start_date: z.string().min(1, "Informe a data de início"),
  due_day: z.coerce.number().int().min(1, "Dia inválido").max(31, "Dia inválido"),
  status: z.enum(["active", "paused", "paid_off"]),
  alert_enabled: z.boolean(),
  notes: z.string().trim().max(800, "Observações muito longas").optional(),
}).refine((data) => data.current_installment <= data.term_months, {
  message: "Parcela atual não pode ser maior que o prazo",
  path: ["current_installment"],
});

const initialForm = {
  asset_type: "home" as AssetType,
  name: "",
  institution: "",
  financed_amount: "",
  down_payment: "0",
  interest_rate: "0",
  term_months: "360",
  current_installment: "1",
  installment_value: "",
  start_date: format(new Date(), "yyyy-MM-dd"),
  due_day: "10",
  status: "active" as FinancingStatus,
  alert_enabled: true,
  notes: "",
};

const assetOptions = [
  { value: "home", label: "Casa / Apartamento", icon: Home },
  { value: "vehicle", label: "Veículo", icon: Car },
  { value: "land", label: "Terreno", icon: Building2 },
  { value: "business", label: "Negócio", icon: Receipt },
  { value: "education", label: "Educação", icon: Calendar },
  { value: "other", label: "Outros", icon: CircleDollarSign },
] as const;

const statusLabels: Record<FinancingStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  paid_off: "Quitado",
};

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const financingClient = supabase as any;

export function FinancingControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Financing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Financing | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const { data: financings = [], isLoading } = useQuery({
    queryKey: ["financings", user?.id],
    queryFn: async () => {
      const { data, error } = await financingClient
        .from("financings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Financing[];
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["financing_payments", user?.id, selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await financingClient
        .from("financing_payments")
        .select("*")
        .eq("user_id", user?.id)
        .eq("financing_id", selectedId)
        .order("installment_number", { ascending: false });
      if (error) throw error;
      return data as FinancingPayment[];
    },
    enabled: !!user?.id && !!selectedId,
  });

  const summary = useMemo(() => {
    const active = financings.filter((item) => item.status === "active");
    const monthly = active.reduce((sum, item) => sum + Number(item.installment_value), 0);
    const remaining = active.reduce((sum, item) => {
      const remainingInstallments = Math.max(item.term_months - item.current_installment + 1, 0);
      return sum + remainingInstallments * Number(item.installment_value);
    }, 0);
    const principal = financings.reduce((sum, item) => sum + Number(item.financed_amount), 0);
    const paid = financings.reduce((sum, item) => {
      const paidInstallments = Math.max(item.current_installment - 1, 0);
      return sum + paidInstallments * Number(item.installment_value);
    }, 0);

    return { active, monthly, remaining, principal, paid };
  }, [financings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = financingSchema.safeParse(formData);
      if (!parsed.success) throw new Error(parsed.error.errors[0]?.message || "Dados inválidos");

      const payload = {
        ...parsed.data,
        user_id: user?.id,
        institution: parsed.data.institution || null,
        notes: parsed.data.notes || null,
      };

      if (editing) {
        const { error } = await financingClient.from("financings").update(payload).eq("id", editing.id);
        if (error) throw error;
        return;
      }

      const { error } = await financingClient.from("financings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financings"] });
      closeDialog();
      toast({ title: editing ? "Financiamento atualizado" : "Financiamento cadastrado" });
    },
    onError: (error: Error) => {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await financingClient.from("financings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financings"] });
      setDeleteTarget(null);
      toast({ title: "Financiamento removido" });
    },
  });

  const payMutation = useMutation({
    mutationFn: async (financing: Financing) => {
      const current = financing.current_installment;
      const remainingAfterPayment = Math.max(financing.term_months - current, 0) * Number(financing.installment_value);
      const monthlyRate = Number(financing.interest_rate) / 100 / 12;
      const estimatedInterest = Math.max(remainingAfterPayment * monthlyRate, 0);
      const principalPaid = Math.max(Number(financing.installment_value) - estimatedInterest, 0);

      const { error: paymentError } = await financingClient.from("financing_payments").insert({
        financing_id: financing.id,
        user_id: user?.id,
        installment_number: current,
        amount_paid: financing.installment_value,
        interest_paid: estimatedInterest,
        principal_paid: principalPaid,
        remaining_balance: remainingAfterPayment,
      });
      if (paymentError) throw paymentError;

      const isFinal = current >= financing.term_months;
      const { error: financingError } = await financingClient
        .from("financings")
        .update({
          current_installment: isFinal ? financing.term_months : current + 1,
          status: isFinal ? "paid_off" : financing.status,
        })
        .eq("id", financing.id);
      if (financingError) throw financingError;
    },
    onSuccess: (_, financing) => {
      queryClient.invalidateQueries({ queryKey: ["financings"] });
      queryClient.invalidateQueries({ queryKey: ["financing_payments"] });
      toast({ title: financing.current_installment >= financing.term_months ? "Financiamento quitado" : "Parcela registrada" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar pagamento", description: error.message, variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setFormData(initialForm);
  };

  const openEdit = (financing: Financing) => {
    setEditing(financing);
    setFormData({
      asset_type: financing.asset_type,
      name: financing.name,
      institution: financing.institution || "",
      financed_amount: String(financing.financed_amount),
      down_payment: String(financing.down_payment),
      interest_rate: String(financing.interest_rate),
      term_months: String(financing.term_months),
      current_installment: String(financing.current_installment),
      installment_value: String(financing.installment_value),
      start_date: financing.start_date,
      due_day: String(financing.due_day),
      status: financing.status,
      alert_enabled: financing.alert_enabled,
      notes: financing.notes || "",
    });
    setIsDialogOpen(true);
  };

  const getNextDueDate = (financing: Financing) => {
    const base = addMonths(parseISO(financing.start_date), Math.max(financing.current_installment - 1, 0));
    return new Date(base.getFullYear(), base.getMonth(), Math.min(financing.due_day, 28));
  };

  const selectedFinancing = financings.find((item) => item.id === selectedId) || financings[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financiamentos</h2>
          <p className="text-muted-foreground">Casa, veículos, terreno, estudos e outros bens financiados.</p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo financiamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<Building2 className="h-5 w-5" />} title="Contratos ativos" value={String(summary.active.length)} subtitle={`${financings.length} no total`} />
        <SummaryCard icon={<CircleDollarSign className="h-5 w-5" />} title="Parcela mensal" value={money(summary.monthly)} subtitle="Compromisso atual" />
        <SummaryCard icon={<Receipt className="h-5 w-5" />} title="Saldo estimado" value={money(summary.remaining)} subtitle="A pagar" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} title="Pago estimado" value={money(summary.paid)} subtitle={`de ${money(summary.principal)}`} />
      </div>

      {financings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum financiamento cadastrado</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Cadastre imóveis, veículos ou qualquer contrato parcelado de longo prazo para acompanhar saldo, vencimentos e quitação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {financings.map((financing) => {
              const progress = Math.min(((financing.current_installment - 1) / financing.term_months) * 100, 100);
              const nextDue = getNextDueDate(financing);
              const daysUntilDue = differenceInDays(nextDue, new Date());
              const AssetIcon = assetOptions.find((item) => item.value === financing.asset_type)?.icon || CircleDollarSign;

              return (
                <Card key={financing.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="rounded-md bg-primary/10 p-3 text-primary">
                          <AssetIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{financing.name}</CardTitle>
                          <CardDescription>{financing.institution || "Instituição não informada"}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={financing.status === "paid_off" ? "secondary" : "default"}>{statusLabels[financing.status]}</Badge>
                        {financing.alert_enabled && <Badge variant="outline"><Bell className="mr-1 h-3 w-3" />Alertas</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <Metric label="Parcela" value={money(financing.installment_value)} />
                      <Metric label="Atual" value={`${financing.current_installment}/${financing.term_months}`} />
                      <Metric label="Financiado" value={money(financing.financed_amount)} />
                      <Metric label="Taxa a.a." value={`${Number(financing.interest_rate).toFixed(2)}%`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso de quitação</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {daysUntilDue < 0 ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Calendar className="h-4 w-4" />}
                        Próximo vencimento: {format(nextDue, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedId(financing.id)}>Histórico</Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(financing)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                        {financing.status !== "paid_off" && (
                          <Button size="sm" onClick={() => payMutation.mutate(financing)} disabled={payMutation.isPending}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />Pagar parcela
                          </Button>
                        )}
                        <Button variant="destructive" size="icon" onClick={() => setDeleteTarget(financing)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de pagamentos</CardTitle>
              <CardDescription>{selectedFinancing?.name || "Selecione um financiamento"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedFinancing || payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Parcela {payment.installment_number}</span>
                      <span className="text-sm font-semibold">{money(payment.amount_paid)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pago em {format(parseISO(payment.paid_at), "dd/MM/yyyy")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Saldo estimado: {money(payment.remaining_balance)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar financiamento" : "Novo financiamento"}</DialogTitle>
            <DialogDescription>Preencha os dados do contrato para acompanhar parcelas, saldo e vencimentos.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.asset_type} onValueChange={(value: AssetType) => setFormData({ ...formData, asset_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{assetOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do bem</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Casa, carro, terreno..." maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>Banco / instituição</Label>
              <Input value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>Valor financiado</Label>
              <Input type="number" min="0" step="0.01" value={formData.financed_amount} onChange={(e) => setFormData({ ...formData, financed_amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input type="number" min="0" step="0.01" value={formData.down_payment} onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Taxa anual (%)</Label>
              <Input type="number" min="0" max="100" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prazo (meses)</Label>
              <Input type="number" min="1" max="600" value={formData.term_months} onChange={(e) => setFormData({ ...formData, term_months: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Parcela atual</Label>
              <Input type="number" min="1" value={formData.current_installment} onChange={(e) => setFormData({ ...formData, current_installment: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Valor da parcela</Label>
              <Input type="number" min="0" step="0.01" value={formData.installment_value} onChange={(e) => setFormData({ ...formData, installment_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Dia de vencimento</Label>
              <Input type="number" min="1" max="31" value={formData.due_day} onChange={(e) => setFormData({ ...formData, due_day: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: FinancingStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="paid_off">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
              <div>
                <Label>Alertas de vencimento</Label>
                <p className="text-sm text-muted-foreground">Usar este financiamento nos lembretes financeiros.</p>
              </div>
              <Switch checked={formData.alert_enabled} onCheckedChange={(checked) => setFormData({ ...formData, alert_enabled: checked })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} maxLength={800} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir financiamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove também o histórico de pagamentos deste financiamento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-primary">{icon}<span className="text-sm font-medium text-muted-foreground">{title}</span></div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
