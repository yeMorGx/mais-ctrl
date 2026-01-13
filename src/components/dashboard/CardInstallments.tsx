import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Trash2, 
  Edit, 
  CreditCard, 
  Calendar,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { format, addMonths, parseISO, isBefore, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Installment {
  id: string;
  user_id: string;
  name: string;
  total_value: number;
  installment_value: number;
  total_installments: number;
  current_installment: number;
  due_day: number;
  start_date: string;
  card_name: string | null;
  category: string | null;
  is_active: boolean;
  alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Eletrônicos",
  "Eletrodomésticos",
  "Móveis",
  "Vestuário",
  "Saúde",
  "Educação",
  "Viagem",
  "Outros",
];

export function CardInstallments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    total_value: "",
    total_installments: "",
    due_day: "",
    start_date: "",
    card_name: "",
    category: "",
    alert_enabled: true,
  });

  const { data: installments = [], isLoading } = useQuery({
    queryKey: ["card_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_installments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const totalValue = parseFloat(data.total_value);
      const totalInstallments = parseInt(data.total_installments);
      const installmentValue = totalValue / totalInstallments;

      const { error } = await supabase.from("card_installments").insert({
        user_id: user?.id,
        name: data.name,
        total_value: totalValue,
        installment_value: installmentValue,
        total_installments: totalInstallments,
        current_installment: 1,
        due_day: parseInt(data.due_day),
        start_date: data.start_date,
        card_name: data.card_name || null,
        category: data.category || null,
        alert_enabled: data.alert_enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_installments"] });
      toast({ title: "Parcela cadastrada com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar parcela", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Installment> & { id: string }) => {
      const { error } = await supabase.from("card_installments").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_installments"] });
      toast({ title: "Parcela atualizada!" });
      resetForm();
      setEditingInstallment(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("card_installments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_installments"] });
      toast({ title: "Parcela excluída!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const advanceInstallment = async (installment: Installment) => {
    if (installment.current_installment >= installment.total_installments) {
      await updateMutation.mutateAsync({ id: installment.id, is_active: false });
      toast({ title: "🎉 Parcelas finalizadas!", description: `${installment.name} foi quitado!` });
    } else {
      await updateMutation.mutateAsync({
        id: installment.id,
        current_installment: installment.current_installment + 1,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      total_value: "",
      total_installments: "",
      due_day: "",
      start_date: "",
      card_name: "",
      category: "",
      alert_enabled: true,
    });
  };

  const openEditDialog = (installment: Installment) => {
    setEditingInstallment(installment);
    setFormData({
      name: installment.name,
      total_value: installment.total_value.toString(),
      total_installments: installment.total_installments.toString(),
      due_day: installment.due_day.toString(),
      start_date: installment.start_date,
      card_name: installment.card_name || "",
      category: installment.category || "",
      alert_enabled: installment.alert_enabled,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.total_value || !formData.total_installments || !formData.due_day || !formData.start_date) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingInstallment) {
      const totalValue = parseFloat(formData.total_value);
      const totalInstallments = parseInt(formData.total_installments);
      updateMutation.mutate({
        id: editingInstallment.id,
        name: formData.name,
        total_value: totalValue,
        installment_value: totalValue / totalInstallments,
        total_installments: totalInstallments,
        due_day: parseInt(formData.due_day),
        start_date: formData.start_date,
        card_name: formData.card_name || null,
        category: formData.category || null,
        alert_enabled: formData.alert_enabled,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getNextDueDate = (installment: Installment) => {
    const startDate = parseISO(installment.start_date);
    const nextDate = addMonths(startDate, installment.current_installment - 1);
    return new Date(nextDate.getFullYear(), nextDate.getMonth(), installment.due_day);
  };

  const isDueSoon = (installment: Installment) => {
    const nextDue = getNextDueDate(installment);
    const today = new Date();
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  };

  const isOverdue = (installment: Installment) => {
    const nextDue = getNextDueDate(installment);
    return isBefore(nextDue, new Date());
  };

  const activeInstallments = installments.filter((i) => i.is_active);
  const completedInstallments = installments.filter((i) => !i.is_active);

  const totalMonthlyPayment = activeInstallments.reduce((sum, i) => sum + i.installment_value, 0);
  const totalRemaining = activeInstallments.reduce(
    (sum, i) => sum + i.installment_value * (i.total_installments - i.current_installment + 1),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Parcelas de Cartão</h2>
          <p className="text-muted-foreground">
            {activeInstallments.length} ativa{activeInstallments.length !== 1 && "s"} • {completedInstallments.length} quitada{completedInstallments.length !== 1 && "s"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingInstallment(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Parcela
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingInstallment ? "Editar Parcela" : "Nova Parcela"}</DialogTitle>
              <DialogDescription>
                {editingInstallment ? "Atualize os detalhes da parcela" : "Cadastre uma nova compra parcelada"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Descrição *</Label>
                <Input
                  id="name"
                  placeholder="Ex: iPhone 15, Geladeira, etc"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Total (R$) *</Label>
                  <Input
                    id="total_value"
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_installments">Nº de Parcelas *</Label>
                  <Input
                    id="total_installments"
                    type="number"
                    min="1"
                    max="48"
                    placeholder="12"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                  />
                </div>
              </div>
              {formData.total_value && formData.total_installments && (
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <span className="text-sm text-muted-foreground">Valor da parcela: </span>
                  <span className="font-bold text-primary">
                    R$ {(parseFloat(formData.total_value) / parseInt(formData.total_installments)).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_day">Dia de Vencimento *</Label>
                  <Input
                    id="due_day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    value={formData.due_day}
                    onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data da 1ª Parcela *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card_name">Nome do Cartão</Label>
                  <Input
                    id="card_name"
                    placeholder="Nubank, Itaú, etc"
                    value={formData.card_name}
                    onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="alert">Alertas de vencimento</Label>
                </div>
                <Switch
                  id="alert"
                  checked={formData.alert_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, alert_enabled: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingInstallment ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalMonthlyPayment.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">em parcelas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restante</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRemaining.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">a pagar no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeInstallments.filter((i) => isDueSoon(i) || isOverdue(i)).length}
            </div>
            <p className="text-xs text-muted-foreground">vencendo em 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Installments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Parcelas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : activeInstallments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">Nenhuma parcela ativa</h3>
              <p className="text-muted-foreground">Cadastre uma nova compra parcelada para começar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeInstallments.map((installment) => {
                const progress = (installment.current_installment / installment.total_installments) * 100;
                const nextDue = getNextDueDate(installment);
                const overdue = isOverdue(installment);
                const dueSoon = isDueSoon(installment);

                return (
                  <div
                    key={installment.id}
                    className={`p-4 rounded-lg border ${
                      overdue ? "border-destructive bg-destructive/5" : dueSoon ? "border-yellow-500 bg-yellow-500/5" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{installment.name}</span>
                          {installment.card_name && (
                            <Badge variant="outline">{installment.card_name}</Badge>
                          )}
                          {installment.category && (
                            <Badge variant="secondary">{installment.category}</Badge>
                          )}
                          {overdue && (
                            <Badge variant="destructive">Atrasada</Badge>
                          )}
                          {dueSoon && !overdue && (
                            <Badge className="bg-yellow-500">Vence em breve</Badge>
                          )}
                          {installment.alert_enabled && (
                            <Bell className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Vence dia {installment.due_day} - {format(nextDue, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Parcela {installment.current_installment} de {installment.total_installments}</span>
                            <span className="font-medium">R$ {installment.installment_value.toFixed(2)}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => advanceInstallment(installment)}
                          className="flex-1 sm:flex-none"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Paga
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(installment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir parcela?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A parcela "{installment.name}" será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(installment.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Installments */}
      {completedInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5" />
              Parcelas Quitadas ({completedInstallments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedInstallments.map((installment) => (
                <div key={installment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="font-medium">{installment.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {installment.total_installments}x de R$ {installment.installment_value.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">R$ {installment.total_value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
