import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EditUserFormProps {
  user: any;
  onSuccess: () => void;
  isOwner: boolean;
}

export const EditUserForm = ({ user, onSuccess, isOwner }: EditUserFormProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.full_name || "",
    email: user.email || "",
    newPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          email: formData.email,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update email in auth.users if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email: formData.email }
        );

        if (emailError) {
          console.error("Erro ao atualizar email:", emailError);
          toast({
            title: "Atenção",
            description: "O perfil foi atualizado mas o email pode precisar de confirmação.",
          });
        }
      }

      // Update password if provided
      if (formData.newPassword && formData.newPassword.length >= 6) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: formData.newPassword }
        );

        if (passwordError) {
          console.error("Erro ao atualizar senha:", passwordError);
          toast({
            title: "Erro ao atualizar senha",
            description: passwordError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Senha atualizada",
            description: "A senha do usuário foi alterada com sucesso.",
          });
        }
      }

      toast({
        title: "Usuário atualizado!",
        description: "As informações foram salvas com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Editar Informações</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha (opcional)</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Deixe vazio para não alterar"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 6 caracteres. Deixe em branco para não alterar a senha.
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
