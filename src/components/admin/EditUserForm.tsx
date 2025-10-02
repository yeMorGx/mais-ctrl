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

      // Update email in auth.users if changed and user is owner
      if (isOwner && formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email: formData.email }
        );

        if (emailError) {
          console.error("Erro ao atualizar email:", emailError);
          toast({
            title: "Email não atualizado",
            description: "O perfil foi atualizado mas o email não pôde ser alterado no sistema de autenticação.",
            variant: "destructive",
          });
        }
      }

      // Update password if provided and user is owner
      if (isOwner && formData.newPassword && formData.newPassword.length >= 6) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: formData.newPassword }
        );

        if (passwordError) {
          console.error("Erro ao atualizar senha:", passwordError);
          toast({
            title: "Senha não atualizada",
            description: "O perfil foi atualizado mas a senha não pôde ser alterada.",
            variant: "destructive",
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
              disabled={!isOwner}
              className={!isOwner ? "bg-muted" : ""}
            />
            {!isOwner && (
              <p className="text-xs text-muted-foreground">
                Apenas o owner pode alterar emails
              </p>
            )}
          </div>

          {isOwner && (
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
          )}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
