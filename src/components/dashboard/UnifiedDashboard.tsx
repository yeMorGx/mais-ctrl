import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Lock, CreditCard, CheckSquare, Wallet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionList } from "./SubscriptionList";
import { TodoList } from "./TodoList";
import { CardInstallments } from "./CardInstallments";
import { StatsCards } from "./StatsCards";
import { FinancialTips } from "./FinancialTips";
import { useNavigate } from "react-router-dom";

interface UnifiedDashboardProps {
  subscriptions: any[];
  onAddSubscription: () => void;
  onRefetch: () => void;
  isPremium: boolean;
  hasReachedLimit: boolean;
  onTabChange: (tab: string) => void;
}

export const UnifiedDashboard = ({
  subscriptions,
  onAddSubscription,
  onRefetch,
  isPremium,
  hasReachedLimit,
  onTabChange,
}: UnifiedDashboardProps) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("subscriptions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie suas assinaturas, tarefas e parcelas
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={hasReachedLimit ? "bg-destructive hover:bg-destructive/90 ml-auto" : "bg-gradient-primary ml-auto"}
                size="lg"
                onClick={() => hasReachedLimit ? navigate("/pricing") : onAddSubscription()}
              >
                {hasReachedLimit ? (
                  <Lock className="w-5 h-5 mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                <span className="hidden sm:inline">{hasReachedLimit ? "Limite atingido" : "Nova assinatura"}</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </TooltipTrigger>
            {hasReachedLimit && (
              <TooltipContent>
                <p>Desbloqueie</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stats Cards */}
      <StatsCards 
        subscriptions={subscriptions} 
        onCardClick={onTabChange}
        isPremium={isPremium}
      />

      {/* Section Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Central de Controle</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Assinaturas</span>
                <span className="sm:hidden">Assin.</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span>Tarefas</span>
              </TabsTrigger>
              <TabsTrigger value="installments" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Parcelas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="mt-0">
              <SubscriptionList subscriptions={subscriptions} onUpdate={onRefetch} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <TodoList />
            </TabsContent>

            <TabsContent value="installments" className="mt-0">
              <CardInstallments />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Financial Tips */}
      <FinancialTips />
    </div>
  );
};
