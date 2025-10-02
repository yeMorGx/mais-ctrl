import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ManageSubscriptionFormProps {
  user: any;
  onSuccess: () => void;
}

export const ManageSubscriptionForm = ({ user, onSuccess }: ManageSubscriptionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(user.subscription?.plan || "free");
  const [status, setStatus] = useState(user.subscription?.status || "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan,
            status,
          });

        if (error) throw error;
      }

      toast({
        title: "Assinatura atualizada!",
        description: `Plano alterado para ${plan === "premium" ? "Premium" : "Free"}.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar assinatura",
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
        <CardTitle className="text-base">Gerenciar Assinatura</CardTitle>
        <CardDescription>
          Altere o plano e status da assinatura do usuário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Status Atual:</p>
            <div className="flex items-center gap-2">
              {plan === "premium" ? (
                <Badge className="bg-gradient-primary text-white gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
              <Badge variant={status === "active" ? "default" : "secondary"}>
                {status === "active" ? "Ativo" : status}
              </Badge>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (Gratuito)</SelectItem>
                <SelectItem value="premium">Premium (R$ 12,49/mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Box */}
          {plan === "premium" && status === "active" && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ℹ️ Ao ativar o plano Premium, o usuário terá acesso a todas as funcionalidades premium imediatamente.
              </p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
