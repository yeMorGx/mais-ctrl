import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserCog, Headphones, Crown, Plus, Trash2, Users, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminRolesProps {
  isOwner: boolean;
}

const roleIcons: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  support: Headphones,
  moderator: UserCog,
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  support: "Suporte",
  moderator: "Moderador",
};

export const AdminRoles = ({ isOwner }: AdminRolesProps) => {
  const { toast } = useToast();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showManageUsers, setShowManageUsers] = useState(false);

  const OWNER_USER_ID = "88cc73bd-b776-40e4-a9ee-4e6c9c30a7a1";

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
      
      // Add owner role with the specific user ID
      roleMap.set("owner", new Set([OWNER_USER_ID]));
      
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

  // Fetch all users for the manage users dialog
  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-for-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url");

      if (error) throw error;
      return data;
    },
  });

  // Fetch users for selected role
  const { data: roleUsers = [], refetch: refetchRoleUsers } = useQuery({
    queryKey: ["role-users", selectedRole],
    queryFn: async () => {
      if (!selectedRole) return [];
      
      // If owner role, return only the specific owner user
      if (selectedRole === "owner") {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .eq("id", OWNER_USER_ID)
          .single();

        if (error) throw error;
        return data ? [data] : [];
      }
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name, email, avatar_url)")
        .eq("role", selectedRole);

      if (error) throw error;
      return data.map(item => item.profiles).filter(Boolean);
    },
    enabled: !!selectedRole && showManageUsers,
  });

  const handleManageUsers = (role: string) => {
    setSelectedRole(role);
    setShowManageUsers(true);
  };

  const handleAddUserToRole = async (userId: string) => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: selectedRole });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: "Função atribuída com sucesso.",
      });

      refetch();
      refetchRoleUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveUserFromRole = async (userId: string) => {
    if (!selectedRole) return;

    // Prevent removing the owner
    if (selectedRole === "owner" || userId === OWNER_USER_ID) {
      toast({
        title: "Ação não permitida",
        description: "O Owner não pode ser removido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", selectedRole);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "Função removida com sucesso.",
      });

      refetch();
      refetchRoleUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const getUserInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  // Filter available users, excluding owner from other roles
  const availableUsers = allUsers.filter(user => {
    const isAlreadyInRole = roleUsers.some((ru: any) => ru.id === user.id);
    const isOwner = user.id === OWNER_USER_ID;
    
    // If managing owner role, only show owner
    if (selectedRole === "owner") {
      return user.id === OWNER_USER_ID && !isAlreadyInRole;
    }
    
    // For other roles, exclude owner
    return !isAlreadyInRole && !isOwner;
  });

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
            <Card 
              key={role} 
              className={`relative ${role === 'owner' ? 'border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      role === 'owner' 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/50' 
                        : 'bg-primary/10'
                    }`}>
                      {role === 'owner' ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : (
                        getRoleIcon(role)
                      )}
                    </div>
                    <div>
                      <CardTitle className={`text-base flex items-center gap-2 ${
                        role === 'owner' ? 'text-yellow-700 dark:text-yellow-400' : ''
                      }`}>
                        {roleLabels[role] || role}
                        {role === 'owner' && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0">
                            Rei
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        {userCount} {userCount === 1 ? "usuário" : "usuários"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleManageUsers(role)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    {isOwner && role !== 'owner' && (
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
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={`w-full justify-center ${
                  role === 'owner' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400' : ''
                }`}>
                  {role === 'owner' ? 'Controle Total do Sistema' : 'Função do sistema'}
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
            • <strong className="text-yellow-700 dark:text-yellow-400">Owner (Rei):</strong> Controle absoluto do sistema. Pode criar/remover funções e gerenciar todos os aspectos.
          </p>
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
              <strong className="text-primary">Nota:</strong> Apenas o owner pode criar e remover funções do sistema.
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

      {/* Manage Users Dialog */}
      <Dialog open={showManageUsers} onOpenChange={setShowManageUsers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole && getRoleIcon(selectedRole)}
              Gerenciar Usuários - {selectedRole && (roleLabels[selectedRole] || selectedRole)}
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova usuários desta função
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Add User Section - Hide for owner role */}
            {selectedRole !== "owner" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Adicionar Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleAddUserToRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Todos os usuários já possuem esta função
                        </div>
                      ) : (
                        availableUsers.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Current Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usuários com esta função</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {roleUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuário com esta função
                  </p>
                ) : (
                  roleUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                       {selectedRole !== "owner" && user.id !== OWNER_USER_ID && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveUserFromRole(user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
