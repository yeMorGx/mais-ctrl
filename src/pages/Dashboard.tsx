import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SubscriptionList } from "@/components/dashboard/SubscriptionList";
import { AddSubscriptionDialog } from "@/components/dashboard/AddSubscriptionDialog";
import { StatsCards } from "@/components/dashboard/StatsCards";
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Suas Assinaturas
            </h1>
            <p className="text-muted-foreground">
              Gerencie e controle todos os seus gastos mensais
            </p>
          </div>
          
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => setIsAddDialogOpen(true)}
            className="hidden md:flex"
          >
            <Plus className="w-5 h-5" />
            Nova assinatura
          </Button>

          <Button 
            variant="hero" 
            size="icon"
            onClick={() => setIsAddDialogOpen(true)}
            className="md:hidden"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards subscriptions={subscriptions} />

        {/* Subscriptions List */}
        <SubscriptionList subscriptions={subscriptions} onUpdate={refetch} />
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
