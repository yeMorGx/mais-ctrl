import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Star, Edit, Trash2, Users, DollarSign, Eye, EyeOff } from "lucide-react";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { EditPlanDialog } from "./EditPlanDialog";
import { useToast } from "@/hooks/use-toast";
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

export const AdminPlans = () => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deletingPlan, setDeletingPlan] = useState<any>(null);

  // Fetch all plans
  const { data: plans = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user counts per plan
  const { data: userCounts } = useQuery({
    queryKey: ["plan-user-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("status", "active");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach(sub => {
        counts[sub.plan] = (counts[sub.plan] || 0) + 1;
      });

      return counts;
    },
  });

  const handleToggleActive = async (plan: any) => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);

      if (error) throw error;

      toast({
        title: plan.is_active ? "Plano desativado" : "Plano ativado",
        description: `${plan.name} foi ${plan.is_active ? "desativado" : "ativado"} com sucesso.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", deletingPlan.id);

      if (error) throw error;

      toast({
        title: "Plano deletado",
        description: `${deletingPlan.name} foi removido com sucesso.`,
      });

      refetch();
      setDeletingPlan(null);
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBillingLabel = (interval: string) => {
    const labels: Record<string, string> = {
      monthly: "/mês",
      yearly: "/ano",
      lifetime: "vitalício",
    };
    return labels[interval] || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Planos</h2>
          <p className="text-muted-foreground">
            Crie e gerencie os planos de assinatura disponíveis
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo Plano
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Planos</CardDescription>
            <CardTitle className="text-3xl">{plans.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planos Ativos</CardDescription>
            <CardTitle className="text-3xl">
              {plans.filter(p => p.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Receita Potencial</CardDescription>
            <CardTitle className="text-3xl">
              R$ {plans.reduce((sum, p) => sum + (userCounts?.[p.name.toLowerCase()] || 0) * Number(p.price), 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum plano criado ainda</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.is_popular ? "border-primary shadow-lg" : ""} ${!plan.is_active ? "opacity-60" : ""}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-white gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {plan.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  {!plan.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      R$ {Number(plan.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      {getBillingLabel(plan.billing_interval)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recursos:</p>
                  <ul className="space-y-1">
                    {(plan.features as string[]).map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{userCounts?.[plan.name.toLowerCase()] || 0} usuários</span>
                  </div>
                  {plan.max_subscriptions && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Máx: {plan.max_subscriptions}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(plan)}
                  >
                    {plan.is_active ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingPlan(plan)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreatePlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />

      <EditPlanDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        onSuccess={refetch}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano "{deletingPlan?.name}" será permanentemente deletado.
              {userCounts?.[deletingPlan?.name.toLowerCase()] > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Atenção: {userCounts[deletingPlan.name.toLowerCase()]} usuários ainda estão usando este plano!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
