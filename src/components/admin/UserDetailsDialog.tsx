import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Mail, Calendar, CreditCard, Shield, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditUserForm } from "./EditUserForm";
import { ManageSubscriptionForm } from "./ManageSubscriptionForm";
import { ManageRolesForm } from "./ManageRolesForm";
import { useAuth } from "@/hooks/useAuth";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange, onRefetch }: UserDetailsDialogProps) => {
  const { user: currentUser } = useAuth();
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";
  const isOwner = currentUser?.id === OWNER_ID;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's subscriptions (assinaturas do app, não o plano premium)
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && open,
  });

  if (!user) return null;

  const getUserInitials = () => {
    if (user.full_name) {
      return user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user.email?.slice(0, 2).toUpperCase() || "U";
  };

  const totalSubscriptionValue = subscriptions
    .filter((s: any) => s.is_active)
    .reduce((sum: number, s: any) => sum + Number(s.value || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>
            Visualize e gerencie todas as informações do usuário
          </DialogDescription>
        </DialogHeader>

        {/* User Header */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{user.full_name || "Sem nome"}</h3>
              {user.subscription?.plan === "premium" && (
                <Badge className="bg-gradient-primary text-white gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
              {user.roles.includes("admin") && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              Cadastrado em {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            {isOwner && <TabsTrigger value="roles">Roles</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Plano:</span>
                      <span className="font-medium capitalize">{user.subscription?.plan || "free"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={user.subscription?.status === "active" ? "default" : "secondary"}>
                        {user.subscription?.status || "active"}
                      </Badge>
                    </div>
                    {user.subscription?.current_period_end && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Renovação:</span>
                        <span className="text-sm">
                          {new Date(user.subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assinaturas Gerenciadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Ativas:</span>
                      <span className="font-medium">
                        {subscriptions.filter((s: any) => s.is_active).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Total:</span>
                      <span className="font-medium">R$ {totalSubscriptionValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Cadastradas:</span>
                      <span className="text-sm">{subscriptions.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assinaturas Recentes</CardTitle>
                <CardDescription>Últimas assinaturas adicionadas pelo usuário</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma assinatura cadastrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.slice(0, 5).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.frequency} • Renovação: {new Date(sub.renewal_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">R$ {Number(sub.value).toFixed(2)}</p>
                          <Badge variant={sub.is_active ? "default" : "secondary"} className="text-xs">
                            {sub.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <EditUserForm 
              user={user} 
              isOwner={isOwner}
              onSuccess={() => {
                onRefetch();
                onOpenChange(false);
              }} 
            />
          </TabsContent>

          {/* Subscription Management Tab */}
          <TabsContent value="subscription">
            <ManageSubscriptionForm user={user} onSuccess={() => {
              onRefetch();
            }} />
          </TabsContent>

          {/* Roles Management Tab - Only for Owner */}
          {isOwner && (
            <TabsContent value="roles">
              <ManageRolesForm user={user} onSuccess={() => {
                onRefetch();
              }} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
