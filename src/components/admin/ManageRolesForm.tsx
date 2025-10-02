import { useState } from "react";
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

interface ManageRolesFormProps {
  user: any;
  onSuccess: () => void;
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

export const ManageRolesForm = ({ user, onSuccess }: ManageRolesFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const currentRoles = user.roles || [];

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Gerenciar Roles (Apenas Owner)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Roles */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Roles Atuais</label>
          <div className="flex flex-wrap gap-2">
            {currentRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>
            ) : (
              currentRoles.map((role: string) => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {getRoleIcon(role)}
                  {roleLabels[role as keyof typeof roleLabels]}
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
          <label className="text-sm font-medium">Adicionar Nova Role</label>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles
                  .filter(role => !currentRoles.includes(role))
                  .map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role)}
                        {roleLabels[role as keyof typeof roleLabels]}
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
            <strong>Atenção:</strong> Apenas o owner do sistema pode gerenciar roles. 
            As roles controlam as permissões de acesso dos usuários no sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
