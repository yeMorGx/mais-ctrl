import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Bell,
  BellOff,
  User,
  FileText,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Debt {
  id: string;
  type: "i_owe" | "they_owe";
  person_name: string;
  debt_name: string;
  description: string | null;
  total_value: number;
  is_installment: boolean;
  total_installments: number | null;
  current_installment: number | null;
  installment_value: number | null;
  debt_date: string;
  payment_date: string;
  is_paid: boolean;
  paid_at: string | null;
  alert_enabled: boolean;
  created_at: string;
}

const initialFormData = {
  type: "i_owe" as "i_owe" | "they_owe",
  person_name: "",
  debt_name: "",
  description: "",
  total_value: "",
  is_installment: false,
  total_installments: "",
  debt_date: format(new Date(), "yyyy-MM-dd"),
  payment_date: "",
  alert_enabled: true,
};

export const DebtoList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch debts
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user?.id)
        .order("payment_date", { ascending: true });
      if (error) throw error;
      return data as Debt[];
    },
    enabled: !!user?.id,
  });

  // Add debt mutation
  const addDebtMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const totalValue = parseFloat(data.total_value);
      const totalInstallments = data.is_installment ? parseInt(data.total_installments) : null;
      const installmentValue = totalInstallments ? totalValue / totalInstallments : null;

      const { error } = await supabase.from("debts").insert({
        user_id: user?.id,
        type: data.type,
        person_name: data.person_name,
        debt_name: data.debt_name,
        description: data.description || null,
        total_value: totalValue,
        is_installment: data.is_installment,
        total_installments: totalInstallments,
        current_installment: data.is_installment ? 1 : null,
        installment_value: installmentValue,
        debt_date: data.debt_date,
        payment_date: data.payment_date,
        alert_enabled: data.alert_enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setShowAddDialog(false);
      setFormData(initialFormData);
      toast({ title: "Dívida adicionada!", description: "A dívida foi registrada com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar", description: "Tente novamente.", variant: "destructive" });
    },
  });

  // Update debt mutation
  const updateDebtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Debt> }) => {
      const { error } = await supabase.from("debts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setShowEditDialog(false);
      setSelectedDebt(null);
      toast({ title: "Dívida atualizada!", description: "As alterações foram salvas." });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", description: "Tente novamente.", variant: "destructive" });
    },
  });

  // Delete debt mutation
  const deleteDebtMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setShowDeleteDialog(false);
      setSelectedDebt(null);
      toast({ title: "Dívida removida!", description: "A dívida foi excluída." });
    },
    onError: () => {
      toast({ title: "Erro ao remover", description: "Tente novamente.", variant: "destructive" });
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (debt: Debt) => {
      if (debt.is_installment && debt.current_installment && debt.total_installments) {
        if (debt.current_installment < debt.total_installments) {
          // Advance to next installment
          const { error } = await supabase
            .from("debts")
            .update({ current_installment: debt.current_installment + 1 })
            .eq("id", debt.id);
          if (error) throw error;
        } else {
          // Mark fully paid
          const { error } = await supabase
            .from("debts")
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq("id", debt.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("debts")
          .update({ is_paid: true, paid_at: new Date().toISOString() })
          .eq("id", debt.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, debt) => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      if (debt.is_installment && debt.current_installment && debt.total_installments) {
        if (debt.current_installment < debt.total_installments) {
          toast({ title: "Parcela paga!", description: `Avançou para ${debt.current_installment + 1}/${debt.total_installments}` });
        } else {
          toast({ title: "Dívida quitada!", description: "Todas as parcelas foram pagas." });
        }
      } else {
        toast({ title: "Dívida quitada!", description: "A dívida foi marcada como paga." });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.person_name || !formData.debt_name || !formData.total_value || !formData.payment_date) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    addDebtMutation.mutate(formData);
  };

  const handleEdit = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowEditDialog(true);
  };

  const handleDelete = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowDeleteDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getPaymentStatus = (debt: Debt) => {
    if (debt.is_paid) return { label: "Pago", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 };
    const daysUntil = differenceInDays(parseISO(debt.payment_date), new Date());
    if (isPast(parseISO(debt.payment_date)) && !isToday(parseISO(debt.payment_date))) {
      return { label: "Atrasado", color: "bg-red-500/10 text-red-500", icon: AlertCircle };
    }
    if (daysUntil <= 3) return { label: `${daysUntil}d`, color: "bg-amber-500/10 text-amber-500", icon: Clock };
    return { label: "Pendente", color: "bg-blue-500/10 text-blue-500", icon: Clock };
  };

  const filteredDebts = debts.filter((debt) => {
    if (activeTab === "all") return true;
    if (activeTab === "i_owe") return debt.type === "i_owe" && !debt.is_paid;
    if (activeTab === "they_owe") return debt.type === "they_owe" && !debt.is_paid;
    if (activeTab === "paid") return debt.is_paid;
    return true;
  });

  // Stats
  const totalIOwe = debts.filter(d => d.type === "i_owe" && !d.is_paid).reduce((sum, d) => sum + d.total_value, 0);
  const totalTheyOwe = debts.filter(d => d.type === "they_owe" && !d.is_paid).reduce((sum, d) => sum + d.total_value, 0);
  const overdueCount = debts.filter(d => !d.is_paid && isPast(parseISO(d.payment_date)) && !isToday(parseISO(d.payment_date))).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/20">
                <ArrowUpRight className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eu devo</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalIOwe)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <ArrowDownLeft className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Me devem</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalTheyOwe)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${overdueCount > 0 ? 'from-amber-500/10 to-amber-600/10 border-amber-500/20' : 'from-muted/50 to-muted/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${overdueCount > 0 ? 'bg-amber-500/20' : 'bg-muted'}`}>
                <AlertCircle className={`h-5 w-5 ${overdueCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Suas Dívidas</h2>
          <p className="text-sm text-muted-foreground">Gerencie o que você deve e o que te devem</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Dívida
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({debts.length})</TabsTrigger>
          <TabsTrigger value="i_owe" className="text-red-500">Eu devo</TabsTrigger>
          <TabsTrigger value="they_owe" className="text-green-500">Me devem</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredDebts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma dívida encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "i_owe" ? "Você não deve nada no momento!" :
                   activeTab === "they_owe" ? "Ninguém te deve no momento!" :
                   activeTab === "paid" ? "Nenhuma dívida paga ainda." :
                   "Comece adicionando uma dívida."}
                </p>
                {activeTab !== "paid" && (
                  <Button onClick={() => setShowAddDialog(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Dívida
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDebts.map((debt) => {
                const status = getPaymentStatus(debt);
                const StatusIcon = status.icon;
                const progress = debt.is_installment && debt.current_installment && debt.total_installments
                  ? ((debt.current_installment - 1) / debt.total_installments) * 100
                  : debt.is_paid ? 100 : 0;

                return (
                  <Card key={debt.id} className={`transition-all hover:shadow-md ${debt.is_paid ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Type Icon */}
                          <div className={`p-3 rounded-full ${debt.type === "i_owe" ? "bg-red-500/10" : "bg-green-500/10"}`}>
                            {debt.type === "i_owe" ? (
                              <ArrowUpRight className="h-5 w-5 text-red-500" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5 text-green-500" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{debt.debt_name}</h3>
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                              {debt.alert_enabled && !debt.is_paid && (
                                <Bell className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {debt.type === "i_owe" ? "Devo para" : "Me deve:"} <span className="font-medium">{debt.person_name}</span>
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Vence: {format(parseISO(debt.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              {debt.is_installment && debt.current_installment && debt.total_installments && (
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {debt.current_installment}/{debt.total_installments} parcelas
                                </span>
                              )}
                            </div>

                            {/* Installment Progress */}
                            {debt.is_installment && !debt.is_paid && (
                              <div className="mt-3">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatCurrency((debt.current_installment || 1 - 1) * (debt.installment_value || 0))} de {formatCurrency(debt.total_value)} pago
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Value and Actions */}
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <p className={`text-xl font-bold ${debt.type === "i_owe" ? "text-red-500" : "text-green-500"}`}>
                              {formatCurrency(debt.is_installment && debt.installment_value ? debt.installment_value : debt.total_value)}
                            </p>
                            {debt.is_installment && (
                              <p className="text-xs text-muted-foreground">
                                Total: {formatCurrency(debt.total_value)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!debt.is_paid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => markAsPaidMutation.mutate(debt)}
                                disabled={markAsPaidMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(debt)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(debt)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {debt.description && (
                        <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {debt.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Nova Dívida
            </DialogTitle>
            <DialogDescription>
              Registre uma nova dívida para acompanhar
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formData.type === "i_owe" ? "default" : "outline"}
                className={formData.type === "i_owe" ? "bg-red-500 hover:bg-red-600" : ""}
                onClick={() => setFormData({ ...formData, type: "i_owe" })}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Eu devo
              </Button>
              <Button
                type="button"
                variant={formData.type === "they_owe" ? "default" : "outline"}
                className={formData.type === "they_owe" ? "bg-green-500 hover:bg-green-600" : ""}
                onClick={() => setFormData({ ...formData, type: "they_owe" })}
              >
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                Me devem
              </Button>
            </div>

            {/* Person Name */}
            <div className="space-y-2">
              <Label htmlFor="person_name">
                {formData.type === "i_owe" ? "Para quem você deve?" : "Quem te deve?"}
              </Label>
              <Input
                id="person_name"
                placeholder="Nome da pessoa"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              />
            </div>

            {/* Debt Name */}
            <div className="space-y-2">
              <Label htmlFor="debt_name">Nome da dívida</Label>
              <Input
                id="debt_name"
                placeholder="Ex: Empréstimo, Almoço, etc."
                value={formData.debt_name}
                onChange={(e) => setFormData({ ...formData, debt_name: e.target.value })}
              />
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor total (R$)</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
              />
            </div>

            {/* Installment Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Dívida parcelada?</p>
                <p className="text-sm text-muted-foreground">Dividida em parcelas mensais</p>
              </div>
              <Switch
                checked={formData.is_installment}
                onCheckedChange={(checked) => setFormData({ ...formData, is_installment: checked })}
              />
            </div>

            {/* Total Installments */}
            {formData.is_installment && (
              <div className="space-y-2">
                <Label htmlFor="total_installments">Número de parcelas</Label>
                <Input
                  id="total_installments"
                  type="number"
                  min="2"
                  placeholder="Ex: 12"
                  value={formData.total_installments}
                  onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                />
                {formData.total_value && formData.total_installments && (
                  <p className="text-sm text-muted-foreground">
                    Parcela de {formatCurrency(parseFloat(formData.total_value) / parseInt(formData.total_installments))}
                  </p>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt_date">Data da dívida</Label>
                <Input
                  id="debt_date"
                  type="date"
                  value={formData.debt_date}
                  onChange={(e) => setFormData({ ...formData, debt_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Data de pagamento</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalhes sobre a dívida..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Alert Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {formData.alert_enabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Alertas de vencimento</p>
                  <p className="text-sm text-muted-foreground">Receber lembretes antes do vencimento</p>
                </div>
              </div>
              <Switch
                checked={formData.alert_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, alert_enabled: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addDebtMutation.isPending}>
                {addDebtMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar Dívida"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Dívida
            </DialogTitle>
          </DialogHeader>

          {selectedDebt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={selectedDebt.type}
                  onValueChange={(value: "i_owe" | "they_owe") =>
                    setSelectedDebt({ ...selectedDebt, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="i_owe">Eu devo</SelectItem>
                    <SelectItem value="they_owe">Me devem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da pessoa</Label>
                <Input
                  value={selectedDebt.person_name}
                  onChange={(e) => setSelectedDebt({ ...selectedDebt, person_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Nome da dívida</Label>
                <Input
                  value={selectedDebt.debt_name}
                  onChange={(e) => setSelectedDebt({ ...selectedDebt, debt_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedDebt.total_value}
                  onChange={(e) => setSelectedDebt({ ...selectedDebt, total_value: parseFloat(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da dívida</Label>
                  <Input
                    type="date"
                    value={selectedDebt.debt_date}
                    onChange={(e) => setSelectedDebt({ ...selectedDebt, debt_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de pagamento</Label>
                  <Input
                    type="date"
                    value={selectedDebt.payment_date}
                    onChange={(e) => setSelectedDebt({ ...selectedDebt, payment_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={selectedDebt.description || ""}
                  onChange={(e) => setSelectedDebt({ ...selectedDebt, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {selectedDebt.alert_enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  <span>Alertas de vencimento</span>
                </div>
                <Switch
                  checked={selectedDebt.alert_enabled}
                  onCheckedChange={(checked) => setSelectedDebt({ ...selectedDebt, alert_enabled: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedDebt) {
                  updateDebtMutation.mutate({
                    id: selectedDebt.id,
                    data: {
                      type: selectedDebt.type,
                      person_name: selectedDebt.person_name,
                      debt_name: selectedDebt.debt_name,
                      total_value: selectedDebt.total_value,
                      debt_date: selectedDebt.debt_date,
                      payment_date: selectedDebt.payment_date,
                      description: selectedDebt.description,
                      alert_enabled: selectedDebt.alert_enabled,
                    },
                  });
                }
              }}
              disabled={updateDebtMutation.isPending}
            >
              {updateDebtMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dívida?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedDebt?.debt_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => selectedDebt && deleteDebtMutation.mutate(selectedDebt.id)}
            >
              {deleteDebtMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
