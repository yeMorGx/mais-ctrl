import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CreditCard, TrendingUp, Calendar, Menu } from "lucide-react";
import { SubscriptionList } from "@/components/dashboard/SubscriptionList";
import { AddSubscriptionDialog } from "@/components/dashboard/AddSubscriptionDialog";
import { StatsCards } from "@/components/dashboard/StatsCards";

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="bg-gradient-primary bg-clip-text text-transparent font-black text-2xl">
                +Ctrl
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Perfil
              </Button>
              <Button variant="ghost" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        <StatsCards />

        {/* Subscriptions List */}
        <SubscriptionList />

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Distribuição por categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de pizza em breve
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Evolução mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de barras em breve
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
