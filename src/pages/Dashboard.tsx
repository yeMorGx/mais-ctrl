import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, TrendingUp, Calendar, Bell, Edit, User, Share2, Settings, HelpCircle, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionList } from "@/components/dashboard/SubscriptionList";
import { AddSubscriptionDialog } from "@/components/dashboard/AddSubscriptionDialog";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FinancialAnalysis } from "@/components/dashboard/FinancialAnalysis";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { ShareTab } from "@/components/dashboard/ShareTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import { PlanManagement } from "@/components/dashboard/PlanManagement";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch subscriptions
  const { data: subscriptions = [], refetch } = useQuery({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("renewal_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="lg" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mock: determinar se usuário é Premium (substituir por lógica real)
  const isPremium = true; // Alterar para verificação real do banco

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-9 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            {isPremium && (
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Análise</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Assinaturas</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            {isPremium && (
              <TabsTrigger value="share" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">+Share</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Visão geral das suas assinaturas
                </p>
              </div>
              <Button
                className="bg-gradient-primary"
                size="lg"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova assinatura
              </Button>
            </div>
            <StatsCards subscriptions={subscriptions} />
            <SubscriptionList subscriptions={subscriptions} onUpdate={refetch} />
          </TabsContent>

          {/* Financial Analysis Tab - Premium Only */}
          {isPremium && (
            <TabsContent value="analysis">
              <h1 className="text-3xl font-bold mb-6">Análise Financeira</h1>
              <FinancialAnalysis subscriptions={subscriptions} />
            </TabsContent>
          )}

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <h1 className="text-3xl font-bold mb-6">Calendário de Pagamentos</h1>
            <UpcomingPayments subscriptions={subscriptions} />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <h1 className="text-3xl font-bold mb-6">Alertas de Renovação</h1>
            <AlertsPanel subscriptions={subscriptions} />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Gerenciar Assinaturas</h1>
              <Button
                className="bg-gradient-primary"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova assinatura
              </Button>
            </div>
            <SubscriptionList subscriptions={subscriptions} onUpdate={refetch} showEdit />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <h1 className="text-3xl font-bold mb-6">Perfil</h1>
            <ProfileTab />
          </TabsContent>

          {/* Share Tab - Premium Only */}
          {isPremium && (
            <TabsContent value="share">
              <ShareTab />
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <h1 className="text-3xl font-bold mb-6">Configurações</h1>
            <SettingsTab />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help">
            <h1 className="text-3xl font-bold mb-6">Central de Ajuda</h1>
            <HelpTab />
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <h1 className="text-3xl font-bold mb-6">Meu Plano</h1>
            <PlanManagement isPremium={isPremium} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Dashboard;
