import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserCog, Headphones, Crown, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { CreateRoleDialog } from "./CreateRoleDialog";
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

interface AdminRolesProps {
  isOwner: boolean;
}

const roleIcons: Record<string, any> = {
  admin: Shield,
  support: Headphones,
  moderator: UserCog,
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  support: "Suporte",
  moderator: "Moderador",
};

export const AdminRoles = ({ isOwner }: AdminRolesProps) => {
  const { toast } = useToast();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all roles with user count
  const { data: rolesData = [], refetch } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, user_id");

      if (error) throw error;

      // Group by role and count users
      const roleMap = new Map<string, Set<string>>();
      
      data.forEach(item => {
        if (!roleMap.has(item.role)) {
          roleMap.set(item.role, new Set());
        }
        roleMap.get(item.role)?.add(item.user_id);
      });

      return Array.from(roleMap.entries()).map(([role, userIds]) => ({
        role,
        userCount: userIds.size,
      }));
    },
  });

  const handleDeleteClick = (role: string) => {
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("role", roleToDelete);

      if (error) throw error;

      toast({
        title: "Função removida",
        description: `A função "${roleLabels[roleToDelete] || roleToDelete}" foi removida de todos os usuários.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao remover função",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setRoleToDelete(null);
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role] || Shield;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Funções</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as funções do sistema
              </CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setShowCreateRole(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Função
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rolesData.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma função cadastrada no sistema
              </p>
              {isOwner && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateRole(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira função
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          rolesData.map(({ role, userCount }) => (
            <Card key={role} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {roleLabels[role] || role}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        {userCount} {userCount === 1 ? "usuário" : "usuários"}
                      </CardDescription>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="w-full justify-center">
                  Função do sistema
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sobre as Funções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Admin:</strong> Acesso total ao painel administrativo, pode gerenciar usuários, planos e configurações.
          </p>
          <p>
            • <strong>Suporte:</strong> Pode visualizar tickets e mensagens de suporte, responder usuários.
          </p>
          <p>
            • <strong>Moderador:</strong> Pode moderar conteúdo e gerenciar relatórios de usuários.
          </p>
          {isOwner && (
            <p className="pt-2 border-t">
              <strong className="text-primary">Owner:</strong> Apenas o owner pode criar e remover funções do sistema.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isOwner && (
        <CreateRoleDialog
          open={showCreateRole}
          onOpenChange={setShowCreateRole}
          onSuccess={refetch}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover função?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover a função <strong>{roleLabels[roleToDelete || ""] || roleToDelete}</strong> de todos os usuários.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Função
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
