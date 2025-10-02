import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, Shield, Crown, User, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserWithDetails {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  roles: string[];
  subscription: {
    plan: string;
    status: string;
  } | null;
}

export const TeamManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterSubscription, setFilterSubscription] = useState<string>("all");
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profiles) {
        // Fetch roles and subscriptions for each user
        const usersWithDetails = await Promise.all(
          profiles.map(async (profile) => {
            // Get roles
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);
            
            // Get subscription
            const { data: subscriptionData } = await supabase
              .from('user_subscriptions')
              .select('plan, status')
              .eq('user_id', profile.id)
              .maybeSingle();
            
            return {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              created_at: profile.created_at,
              roles: rolesData?.map(r => r.role) || [],
              subscription: subscriptionData
            };
          })
        );
        setUsers(usersWithDetails);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Função já existe",
            description: "Este usuário já possui essa função",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Função adicionada",
        description: `Função ${role} adicionada com sucesso`
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a função",
        variant: "destructive"
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Função removida",
        description: "Função removida com sucesso"
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a função",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'support':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'support':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'none' && user.roles.length === 0) ||
      user.roles.includes(filterRole);
    
    const matchesSubscription = filterSubscription === 'all' ||
      (filterSubscription === 'free' && (!user.subscription || user.subscription.plan === 'free')) ||
      (filterSubscription === 'premium' && user.subscription?.plan === 'premium');
    
    return matchesSearch && matchesRole && matchesSubscription;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Gerencie todos os usuários, suas funções e assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas funções</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="none">Sem função</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSubscription} onValueChange={setFilterSubscription}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar assinatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="free">Grátis</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white flex-shrink-0">
                      {user.roles.includes('admin') ? (
                        <Crown className="h-5 w-5" />
                      ) : user.roles.includes('support') ? (
                        <Shield className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {user.full_name || 'Sem nome'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || 'Sem email'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="gap-1">
                              {getRoleIcon(role)}
                              {role === 'admin' ? 'Admin' : role === 'support' ? 'Suporte' : role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Usuário</Badge>
                        )}
                        <Badge variant={user.subscription?.plan === 'premium' ? 'default' : 'secondary'}>
                          {user.subscription?.plan === 'premium' ? '⭐ Premium' : 'Grátis'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {!user.roles.includes('admin') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addRole(user.id, 'admin')}
                        className="flex-1 sm:flex-none"
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        Admin
                      </Button>
                    )}
                    {user.roles.includes('admin') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeRole(user.id, 'admin')}
                        className="flex-1 sm:flex-none"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Admin
                      </Button>
                    )}
                    {!user.roles.includes('support') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addRole(user.id, 'support')}
                        className="flex-1 sm:flex-none"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Suporte
                      </Button>
                    )}
                    {user.roles.includes('support') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeRole(user.id, 'support')}
                        className="flex-1 sm:flex-none"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Suporte
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};