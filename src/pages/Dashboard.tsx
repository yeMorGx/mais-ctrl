import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, TrendingUp, Calendar, Bell, User, Share2, Settings, HelpCircle, CreditCard, Menu, Headphones, Users, MessageSquare, Globe, Building2, Sparkles, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SubscriptionList } from "@/components/dashboard/SubscriptionList";
import { AddSubscriptionDialog } from "@/components/dashboard/AddSubscriptionDialog";
import { FinancialAnalysis } from "@/components/dashboard/FinancialAnalysis";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { ShareTab } from "@/components/dashboard/ShareTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { HelpTab } from "@/components/dashboard/HelpTab";
import { SupportAdminTab } from "@/components/dashboard/SupportAdminTab";
import { TeamManagement } from "@/components/dashboard/TeamManagement";
import { PlanManagement } from "@/components/dashboard/PlanManagement";
import { LiveChatTab } from "@/components/dashboard/LiveChatTab";
import { SiteManagement } from "@/components/dashboard/SiteManagement";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { FinancingControl } from "@/components/dashboard/FinancingControl";
import { CtrlAIChat } from "@/components/dashboard/CtrlAIChat";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Logo } from "@/components/Logo";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAllSubscriptions } from "@/hooks/useAllSubscriptions";
import { useSession } from "@/hooks/useSession";

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { invokeFunction } = useSession();
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";

  // Manual subscription check with optional silent mode
  const handleCheckSubscription = async (silent = false) => {
    if (!silent) setIsCheckingSubscription(true);
    try {
      const { data, error } = await invokeFunction<{ plan: string; subscribed: boolean }>('check-subscription');

      if (error) {
        if (error.message?.includes('session') || error.message?.includes('401')) {
          if (!silent) {
            toast({ title: "Sessão expirada", description: "Por favor, faça login novamente", variant: "destructive" });
            navigate("/auth");
          }
          return null;
        }
        if (!silent) {
          toast({ title: "Erro ao verificar assinatura", description: error.message, variant: "destructive" });
        }
        return null;
      }
      if (data) {
        await queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
        if (!silent) {
          toast({
            title: "Assinatura verificada",
            description: data.plan === 'premium' ? "Você tem o plano +Premium ativo!" : "Você está no plano Free",
          });
        }
        return data;
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    } finally {
      if (!silent) setIsCheckingSubscription(false);
    }
    return null;
  };

  // Fire browser push notification
  const firePremiumPush = async () => {
    try {
      if (!("Notification" in window)) return;
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      new Notification("+Ctrl Premium ativado 🎉", {
        body: "Seu plano +Premium está ativo. Aproveite todos os recursos!",
        icon: "/favicon.ico",
        tag: "premium-activated",
      });
    } catch (e) {
      console.warn("Push notification failed", e);
    }
  };

  // Poll after Stripe checkout success until premium is reflected
  const pollSubscriptionAfterPayment = async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const result = await handleCheckSubscription(attempt > 0);
      if (result?.plan === 'premium') {
        toast({
          title: "🎉 Bem-vindo ao +Premium!",
          description: "Seu plano foi ativado. Enviamos um e-mail de confirmação.",
        });
        firePremiumPush();
        await queryClient.invalidateQueries({ queryKey: ["userSubscription"] });
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        return;
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
  };

  // Check for payment success and show animation
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessAnimation(true);
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => { pollSubscriptionAfterPayment(); }, 1500);
    }

    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Silent sync on dashboard load so Stripe status reflects automatically
  useEffect(() => {
    if (!user?.id) return;
    const key = `subSyncedAt_${user.id}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem(key, String(Date.now()));
      handleCheckSubscription(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch all subscriptions (normal + shared)
  const { data: subscriptions = [], refetch } = useAllSubscriptions();

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

  // Fetch profile (name) for the premium banner
  const { data: dashProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Check if subscription has expired
  const subscriptionEndDate = userSubscription?.current_period_end 
    ? new Date(userSubscription.current_period_end) 
    : null;
  const isSubscriptionExpired = subscriptionEndDate ? subscriptionEndDate < new Date() : false;
  
  // Premium if plan is premium AND (status is active OR status is canceled but not expired yet)
  // OR if plan is lifetime (vitalícia, granted by admin)
  const isLifetime = userSubscription?.plan === "lifetime" && userSubscription?.status === "active";
  const isPremium = isLifetime || (userSubscription?.plan === "premium" && 
    (userSubscription?.status === "active" || 
     (userSubscription?.status === "canceled" && !isSubscriptionExpired)));
  
  const isOwner = user?.id === OWNER_ID;
  const isFreeUser = !isPremium;
  const hasReachedLimit = isFreeUser && subscriptions.length >= 5;

  // Virtual +Premium subscription card injected into "Suas assinaturas"
  const premiumPlanCard = isPremium ? {
    isLifetime,
    status: userSubscription?.status || "active",
    endDate: isLifetime ? null : (userSubscription?.current_period_end || null),
    userName: dashProfile?.full_name || user?.email?.split("@")[0] || "Usuário",
  } : null;


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
  const isAdmin = userRoles.includes("admin") || isOwner;




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
    <div className="min-h-screen bg-gradient-hero">
      <SuccessAnimation 
        show={showSuccessAnimation} 
        onComplete={() => setShowSuccessAnimation(false)}
      />
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Premium status now shown directly inside "Suas assinaturas" list */}


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
              <SheetContent side="right" className="w-[280px] glass-panel">
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
                    variant={activeTab === "financings" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("financings"); setMobileMenuOpen(false); }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Financiamentos
                  </Button>

                  <Button
                    variant={activeTab === "ctrl-ai" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("ctrl-ai"); setMobileMenuOpen(false); }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ctrl AI
                  </Button>

                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                  
                  {(isPremium && (isAdmin || isOwner)) && (
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
                </nav>
              </SheetContent>
            </Sheet>
          </div>


          {/* Desktop Tabs */}
          {(() => {
            const tabCount =
              5 +
              (isPremium ? 1 : 0) +
              (isPremium && (isAdmin || isOwner) ? 1 : 0) +
              (isOwner ? 2 : 0);
            return (
              <TabsList
                className="hidden lg:grid w-full mb-8 rounded-2xl bg-card/70 p-1.5 shadow-soft backdrop-blur-xl"
                style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
              >
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
                <TabsTrigger value="financings" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Financiamentos</span>
                </TabsTrigger>
                <TabsTrigger value="ctrl-ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Ctrl AI</span>
                </TabsTrigger>
                {(isPremium && (isAdmin || isOwner)) && (
                  <TabsTrigger value="share" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">+Share</span>
                  </TabsTrigger>
                )}
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
              </TabsList>
            );
          })()}


          {/* Overview Tab - Unified Dashboard */}
          <TabsContent value="overview" className="space-y-8">
            <UnifiedDashboard 
              subscriptions={subscriptions}
              onAddSubscription={() => setIsAddDialogOpen(true)}
              onRefetch={refetch}
              isPremium={isPremium}
              hasReachedLimit={hasReachedLimit}
              onTabChange={setActiveTab}
            />
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

          <TabsContent value="financings">
            <FinancingControl />
          </TabsContent>

          <TabsContent value="ctrl-ai">
            <CtrlAIChat />
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

          {/* Profile Tab (inclui Plano) */}
          <TabsContent value="profile">
            <h1 className="text-3xl font-bold mb-6">Perfil</h1>
            <ProfileTab />

            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Meu Plano</h2>
                <Button
                  variant="outline"
                  onClick={() => handleCheckSubscription(false)}
                  disabled={isCheckingSubscription}
                >
                  {isCheckingSubscription ? "Verificando..." : "Verificar Status"}
                </Button>
              </div>
              <PlanManagement
                isPremium={userSubscription?.plan === "premium"}
                subscriptionEnd={userSubscription?.current_period_end}
                status={userSubscription?.status}
                hasStripeSubscription={!!userSubscription?.stripe_subscription_id || !!userSubscription?.stripe_customer_id}
              />
            </div>
          </TabsContent>

          {/* Share Tab - Premium Only */}
          {(isPremium && (isAdmin || isOwner)) && (
            <TabsContent value="share">
              <ShareTab />
            </TabsContent>
          )}

          {/* Settings Tab (via dropdown) */}
          <TabsContent value="settings">
            <h1 className="text-3xl font-bold mb-6">Configurações</h1>
            <SettingsTab />
          </TabsContent>

          {/* Help Tab (via dropdown) */}
          <TabsContent value="help">
            <h1 className="text-3xl font-bold mb-6">Central de Ajuda</h1>
            <HelpTab />
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

          {/* Support Admin Tab - Admins Only */}
          {isAdmin && (
            <TabsContent value="support-admin">
              <SupportAdminTab />
            </TabsContent>
          )}
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
