import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, UserCog, Headphones, Crown, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateRoleDialog } from "./CreateRoleDialog";

interface ManageRolesFormProps {
  user: any;
  onSuccess: () => void;
  isOwner: boolean;
}

const roleIcons = {
  admin: Shield,
  support: Headphones,
  moderator: UserCog,
};

const roleLabels = {
  admin: "Admin",
  support: "Suporte",
  moderator: "Moderador",
};

const availableRoles = ["admin", "support", "moderator"];

export const ManageRolesForm = ({ user, onSuccess, isOwner }: ManageRolesFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [allRoles, setAllRoles] = useState<string[]>(availableRoles);
  const currentRoles = user.roles || [];

  // Buscar todas as roles existentes no sistema
  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .limit(1000);
      
      if (data) {
        const uniqueRoles = [...new Set(data.map(r => r.role))];
        setAllRoles([...new Set([...availableRoles, ...uniqueRoles])]);
      }
    };
    fetchRoles();
  }, []);

  const handleAddRole = async () => {
    if (!selectedRole || currentRoles.includes(selectedRole)) {
      toast({
        title: "Role inválida",
        description: "Selecione uma role válida que o usuário ainda não possui.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: selectedRole,
        });

      if (error) throw error;

      toast({
        title: "Role adicionada!",
        description: `Role ${roleLabels[selectedRole as keyof typeof roleLabels]} foi adicionada com sucesso.`,
      });

      setSelectedRole("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (role: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role removida!",
        description: `Role ${roleLabels[role as keyof typeof roleLabels]} foi removida com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao remover role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || Shield;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Gerenciar Funções
            </CardTitle>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateRole(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Função
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Roles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Funções Atuais</label>
            <div className="flex flex-wrap gap-2">
              {currentRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função atribuída</p>
              ) : (
                currentRoles.map((role: string) => (
                  <Badge key={role} variant="secondary" className="gap-1 pr-1">
                    {getRoleIcon(role)}
                    {roleLabels[role as keyof typeof roleLabels] || role}
                    <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => handleRemoveRole(role)}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Nova Função</label>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles
                    .filter(role => !currentRoles.includes(role))
                    .map(role => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          {roleLabels[role as keyof typeof roleLabels] || role}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
              onClick={handleAddRole} 
              disabled={loading || !selectedRole}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Funções controlam as permissões de acesso dos usuários. 
            {isOwner && " Apenas o owner pode criar novas funções."}
          </p>
        </div>
      </CardContent>
    </Card>

    {isOwner && (
      <CreateRoleDialog
        open={showCreateRole}
        onOpenChange={setShowCreateRole}
        onSuccess={onSuccess}
      />
    )}
    </>
  );
};
