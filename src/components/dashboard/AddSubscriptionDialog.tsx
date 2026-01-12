import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to get day label based on frequency
const getRenewalLabel = (frequency: string, date: string): string => {
  if (!date || !frequency) return "";
  
  const renewalDate = new Date(date + 'T00:00:00');
  const day = renewalDate.getDate();
  const dayOfWeek = renewalDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  switch (frequency) {
    case "daily":
      return "Todo dia";
    case "weekly":
      return `Toda ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`;
    case "monthly":
      return `Todo dia ${day}`;
    case "quarterly":
      return `Todo dia ${day} (a cada 3 meses)`;
    case "annual":
      const month = renewalDate.toLocaleDateString('pt-BR', { month: 'long' });
      return `Todo dia ${day} de ${month}`;
    default:
      return "";
  }
};

// Component for renewal date with frequency-aware label
const RenewalDateField = ({ frequency, value, onChange }: { frequency: string; value: string; onChange: (value: string) => void }) => {
  const label = useMemo(() => getRenewalLabel(frequency, value), [frequency, value]);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="renewal-date" className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        Data de renovação
      </Label>
      <Input 
        id="renewal-date"
        name="renewal-date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required 
      />
      {label && frequency && (
        <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 rounded-md px-3 py-2">
          <CalendarDays className="h-4 w-4" />
          {label}
        </div>
      )}
    </div>
  );
};

export const AddSubscriptionDialog = ({ open, onOpenChange, onSuccess }: AddSubscriptionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [frequency, setFrequency] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [renewalDate, setRenewalDate] = useState<string>("");
  const { user } = useAuth();

  // Fetch user subscription plan
  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch current subscription count
  const { data: subscriptionCount } = useQuery({
    queryKey: ['subscription-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Check if user is on free plan and has reached the limit
    const isFree = userSubscription?.plan === 'free';
    const currentCount = subscriptionCount || 0;
    
    if (isFree && currentCount >= 5) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de 5 assinaturas do plano gratuito. Faça upgrade para Premium para assinaturas ilimitadas!",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const value = parseFloat(formData.get("value") as string);

      const { error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          name,
          value,
          frequency,
          payment_method: paymentMethod,
          renewal_date: renewalDate,
        });

      if (error) throw error;

      toast({
        title: "Assinatura adicionada!",
        description: `${name} foi cadastrada com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFrequency("");
      setPaymentMethod("");
      setRenewalDate("");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Assinatura</DialogTitle>
          <DialogDescription>
            Adicione uma nova assinatura para começar a controlar seus gastos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da assinatura</Label>
            <Input 
              id="name"
              name="name"
              placeholder="Ex: Netflix, Spotify, Academia..."
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input 
                id="value"
                name="value"
                type="number" 
                step="0.01"
                min="0.01"
                placeholder="29,90"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency} required>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="debit">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RenewalDateField frequency={frequency} value={renewalDate} onChange={setRenewalDate} />

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="gradient"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
