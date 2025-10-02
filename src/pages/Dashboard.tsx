import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, TrendingUp, Calendar, Bell, Edit, User, Share2, Settings, HelpCircle, CreditCard, Menu, Headphones, Users, MessageSquare, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { SupportAdminTab } from "@/components/dashboard/SupportAdminTab";
import { FinancialTips } from "@/components/dashboard/FinancialTips";
import { TeamManagement } from "@/components/dashboard/TeamManagement";
import { PlanManagement } from "@/components/dashboard/PlanManagement";
import { LiveChatTab } from "@/components/dashboard/LiveChatTab";
import { SiteManagement } from "@/components/dashboard/SiteManagement";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Logo } from "@/components/Logo";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";

  // Check for payment success and show animation
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessAnimation(true);
      // Remove query params from URL
      window.history.replaceState({}, '', '/dashboard');
    }

    // Handle tab parameter
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  // Fetch user subscription plan
  const { data: userSubscription } = useQuery({
    queryKey: ["userSubscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isPremium = userSubscription?.plan === "premium" && userSubscription?.status === "active";
  const isOwner = user?.id === OWNER_ID;

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(r => r.role);
    },
    enabled: !!user,
  });

  const isLiveChatAgent = userRoles.includes("support") || userRoles.includes("admin");

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

  return (
    <div className="min-h-screen bg-background">
      <SuccessAnimation 
        show={showSuccessAnimation} 
        onComplete={() => setShowSuccessAnimation(false)}
      />
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Menu */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <nav className="flex flex-col gap-2 mt-8">
                  <Button
                    variant={activeTab === "overview" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Button
                    variant={activeTab === "subscriptions" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("subscriptions"); setMobileMenuOpen(false); }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Assinaturas
                  </Button>
                  
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                  
                  {isPremium && (
                    <Button
                      variant={activeTab === "share" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("share"); setMobileMenuOpen(false); }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      +Share
                    </Button>
                  )}
                  
                  {isOwner && (
                    <>
                      <Button
                        variant={activeTab === "team" ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => { setActiveTab("team"); setMobileMenuOpen(false); }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Equipe
                      </Button>
                      <Button
                        variant={activeTab === "site-management" ? "default" : "ghost"}
                        className="justify-start"
                        onClick={() => { setActiveTab("site-management"); setMobileMenuOpen(false); }}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Gerenciar Site
                      </Button>
                    </>
                  )}

                  {isLiveChatAgent && (
                    <Button
                      variant={activeTab === "live-chat" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("live-chat"); setMobileMenuOpen(false); }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat ao Vivo
                    </Button>
                  )}
                  
                  <Button
                    variant={activeTab === "support-admin" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("support-admin"); setMobileMenuOpen(false); }}
                  >
                    <Headphones className="h-4 w-4 mr-2" />
                    Suporte Admin
                  </Button>
                  
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                  
                  <Button
                    variant={activeTab === "help" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("help"); setMobileMenuOpen(false); }}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Ajuda
                  </Button>
                  
                  <Button
                    variant={activeTab === "plan" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("plan"); setMobileMenuOpen(false); }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Plano
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Tabs */}
          <TabsList className={`hidden lg:grid w-full ${isOwner ? 'grid-cols-12' : isLiveChatAgent ? 'grid-cols-10' : 'grid-cols-9'} mb-8`}>
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
            {isOwner && (
              <>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Equipe</span>
                </TabsTrigger>
                <TabsTrigger value="site-management" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Site</span>
                </TabsTrigger>
              </>
            )}
            {isLiveChatAgent && (
              <TabsTrigger value="live-chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="support-admin" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Suporte</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <div className="hidden lg:block">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Visão geral das suas assinaturas
                </p>
              </div>
              <Button
                className="bg-gradient-primary ml-auto"
                size="lg"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Nova assinatura</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
            <StatsCards 
              subscriptions={subscriptions} 
              onCardClick={(tab) => setActiveTab(tab)}
              isPremium={isPremium}
            />
            <SubscriptionList subscriptions={subscriptions} onUpdate={refetch} />
            
            {/* Financial Tips */}
            <FinancialTips />
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

          {/* Team Management Tab - Owner Only */}
          {isOwner && (
            <>
              <TabsContent value="team">
                <h1 className="text-3xl font-bold mb-6">Gerenciamento de Equipe</h1>
                <TeamManagement />
              </TabsContent>
              
              <TabsContent value="site-management">
                <SiteManagement />
              </TabsContent>
            </>
          )}

          {/* Live Chat Tab - Agents Only */}
          {isLiveChatAgent && (
            <TabsContent value="live-chat">
              <LiveChatTab />
            </TabsContent>
          )}

          {/* Support Admin Tab */}
          <TabsContent value="support-admin">
            <SupportAdminTab />
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
