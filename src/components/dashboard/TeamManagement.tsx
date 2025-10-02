import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, Mail, Shield } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export const TeamManagement = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"support" | "admin">("support");
  const [teamMembers, setTeamMembers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['support', 'admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile info for each user
      if (data) {
        const membersWithProfiles = await Promise.all(
          data.map(async (member) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', member.user_id)
              .maybeSingle();
            
            return {
              ...member,
              profiles: profile
            };
          })
        );
        setTeamMembers(membersWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const addTeamMember = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite o email do usuário",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Find user by email
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', email)
        .maybeSingle();

      if (userError) throw userError;

      if (!users) {
        toast({
          title: "Usuário não encontrado",
          description: "Esse email não está registrado no sistema",
          variant: "destructive"
        });
        return;
      }

      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: users.id,
          role: role
        });

      if (roleError) {
        if (roleError.code === '23505') {
          toast({
            title: "Role já existe",
            description: "Este usuário já possui essa função",
            variant: "destructive"
          });
          return;
        }
        throw roleError;
      }

      toast({
        title: "Membro adicionado",
        description: `Usuário adicionado como ${role === 'support' ? 'Suporte' : 'Admin'}`
      });

      setEmail("");
      fetchTeamMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o membro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "Função removida com sucesso"
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Membro da Equipe</CardTitle>
          <CardDescription>
            Adicione membros para responder o suporte ou administrar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Email do usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "support" | "admin")}
              className="px-4 py-2 border rounded-md"
            >
              <option value="support">Suporte</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              onClick={addTeamMember}
              disabled={loading}
              className="bg-gradient-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipe Atual</CardTitle>
          <CardDescription>
            {teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''} na equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
                    {member.role === 'admin' ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {member.profiles?.full_name || 'Usuário'}
                    </p>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? 'Administrador' : 'Suporte'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTeamMember(member.id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum membro na equipe ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};