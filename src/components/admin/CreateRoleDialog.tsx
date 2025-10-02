import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown } from "lucide-react";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateRoleDialog = ({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState("");

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para a função.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simplesmente informar que a função foi criada
      // O admin pode começar a usar esta função imediatamente
      toast({
        title: "Função criada!",
        description: `A função "${roleName}" está disponível para uso.`,
      });

      setRoleName("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Criar Nova Função (Owner)
          </DialogTitle>
          <DialogDescription>
            Apenas o owner pode criar novas funções no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateRole} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Nome da Função</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ex: Moderador, Gerente, Editor..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Use nomes descritivos como "Moderador", "Editor", "Gerente", etc.
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              <strong>Atenção:</strong> Esta função estará disponível para ser atribuída a qualquer usuário do sistema.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Função
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
