import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, Filter, Crown, Download, MoreHorizontal } from "lucide-react";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { AddUserDialog } from "./AddUserDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AdminUsers = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all users with their subscription data
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch subscription data for each user
      const usersWithSubscriptions = await Promise.all(
        profiles.map(async (profile) => {
          const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("user_id", profile.id)
            .maybeSingle();

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            subscription: subscription || { plan: "free", status: "active" },
            roles: roles?.map(r => r.role) || [],
          };
        })
      );

      return usersWithSubscriptions;
    },
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = filterPlan === "all" || user.subscription?.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || user.subscription?.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getUserInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", text: string }> = {
      active: { variant: "default", text: "Ativo" },
      cancelled: { variant: "secondary", text: "Cancelado" },
      expired: { variant: "destructive", text: "Expirado" },
    };
    
    const config = variants[status] || { variant: "secondary", text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    if (plan === "premium") {
      return (
        <Badge className="bg-gradient-primary text-white gap-1">
          <Crown className="h-3 w-3" />
          Premium
        </Badge>
      );
    }
    return <Badge variant="outline">Free</Badge>;
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `${userToDelete.full_name || userToDelete.email} foi removido do sistema.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["Nome", "Email", "Plano", "Status", "Data de Cadastro"],
      ...filteredUsers.map(u => [
        u.full_name || "",
        u.email || "",
        u.subscription?.plan || "free",
        u.subscription?.status || "active",
        new Date(u.created_at).toLocaleDateString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Usuários</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuários Premium</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter(u => u.subscription?.plan === "premium").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Novos (30 dias)</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter(u => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(u.created_at) > thirtyDaysAgo;
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter(u => u.roles.includes("admin")).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Visualize, edite e gerencie todos os usuários do sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button onClick={() => setShowAddUser(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.full_name || "Sem nome"}</p>
                              {user.roles && user.roles.length > 0 && (
                                <div className="flex gap-1">
                                  {user.roles.map((role: string) => (
                                    <Badge key={role} variant="outline" className="text-xs">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>{getPlanBadge(user.subscription?.plan)}</TableCell>
                      <TableCell>{getStatusBadge(user.subscription?.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Editar Usuário
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Gerenciar Assinatura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Excluir Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDetailsDialog
        user={selectedUser}
        open={showUserDetails}
        onOpenChange={setShowUserDetails}
        onRefetch={refetch}
      />
      <AddUserDialog
        open={showAddUser}
        onOpenChange={setShowAddUser}
        onRefetch={refetch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o usuário <strong>{userToDelete?.full_name || userToDelete?.email}</strong>.
              Esta ação não pode ser desfeita e removerá permanentemente todos os dados do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
