import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, Infinity as InfinityIcon, Clock } from "lucide-react";
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

const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

export const ManageSubscriptionForm = ({ user, onSuccess }: ManageSubscriptionFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(user.subscription?.plan || "free");
  const [status, setStatus] = useState(user.subscription?.status || "active");
  const [customEnd, setCustomEnd] = useState<string>(toDateInput(user.subscription?.current_period_end));

  const isTrial = plan === "premium" && status === "trialing";
  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setCustomEnd(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        plan,
        status,
        updated_at: new Date().toISOString(),
      };

      if (plan === "lifetime") {
        // Vitalícia: no expiration
        payload.current_period_end = null;
        payload.current_period_start = new Date().toISOString();
        payload.stripe_subscription_id = null;
      } else if (plan === "premium") {
        if (status === "trialing") {
          if (!customEnd) throw new Error("Escolha a data final do teste (+Premium Trial).");
          payload.current_period_start = new Date().toISOString();
          payload.current_period_end = new Date(customEnd + "T23:59:59").toISOString();
          payload.stripe_subscription_id = null;
        } else if (customEnd) {
          payload.current_period_end = new Date(customEnd + "T23:59:59").toISOString();
          payload.stripe_subscription_id = null;
        }
      } else if (plan === "free") {
        payload.current_period_end = null;
        payload.stripe_subscription_id = null;
      }

      // Check if subscription exists
      const { data: existing } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_subscriptions")
          .update(payload)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({ user_id: user.id, ...payload });
        if (error) throw error;
      }

      const planLabel =
        plan === "lifetime" ? "Vitalícia (+Premium permanente)" :
        plan === "premium" ? (status === "trialing" ? "+Premium Trial (teste)" : "+Premium") : "Free";

      toast({
        title: "Assinatura atualizada!",
        description: `Plano alterado para ${planLabel}.`,
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
          Altere o plano, status, conceda acesso vitalício ou defina uma data de expiração personalizada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Status Atual:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {plan === "lifetime" ? (
                <Badge className="bg-gradient-primary text-white gap-1">
                  <InfinityIcon className="h-3 w-3" />
                  Vitalícia
                </Badge>
              ) : isTrial ? (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  +Premium Trial
                </Badge>
              ) : plan === "premium" ? (
                <Badge className="bg-gradient-primary text-white gap-1">
                  <Crown className="h-3 w-3" />
                  +Premium
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
              <Badge variant={status === "active" ? "default" : "secondary"}>
                {status === "active" ? "Ativo" : status === "trialing" ? "Em teste" : status}
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
                <SelectItem value="premium">+Premium (R$ 12,49/mês)</SelectItem>
                <SelectItem value="lifetime">Vitalícia (+Premium permanente)</SelectItem>
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
                <SelectItem value="trialing">Em teste (trial)</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom expiration / trial end for premium */}
          {plan === "premium" && (
            <div className="space-y-2">
              <Label>
                {isTrial ? "Data final do teste (+Premium Trial)" : "Data de expiração personalizada (opcional)"}
              </Label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                required={isTrial}
              />
              <div className="flex flex-wrap gap-2">
                {[7, 14, 30, 60].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addDays(d)}
                  >
                    +{d} dias
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTrial
                  ? "O usuário terá acesso completo ao +Premium até esta data. Depois disso ele volta automaticamente para o Free."
                  : "Defina manualmente até quando o usuário terá acesso +Premium. Deixe em branco para manter o ciclo normal do Stripe."}
              </p>
            </div>
          )}

          {isTrial && customEnd && (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-xs text-muted-foreground">
                ⏳ Trial configurado: acesso +Premium por{" "}
                <span className="font-medium text-foreground">
                  {Math.max(
                    0,
                    Math.ceil((new Date(customEnd + "T23:59:59").getTime() - Date.now()) / 86400000)
                  )}{" "}
                  dia(s)
                </span>{" "}
                (até {new Date(customEnd + "T12:00:00").toLocaleDateString("pt-BR")}).
              </p>
            </div>
          )}

          {/* Info Boxes */}
          {plan === "lifetime" && status === "active" && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ♾️ Acesso vitalício: o usuário terá +Premium permanentemente, sem cobrança recorrente e sem data de expiração.
              </p>
            </div>
          )}
          {plan === "premium" && status === "active" && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ℹ️ Ao ativar o +Premium, o usuário terá acesso a todas as funcionalidades imediatamente.
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

