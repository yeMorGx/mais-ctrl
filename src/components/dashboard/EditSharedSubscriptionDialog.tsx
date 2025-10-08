import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Partner {
  id: string;
  name: string;
  email: string;
  value: number;
  user_id?: string;
}

interface EditSharedSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  onSuccess: () => void;
}

export const EditSharedSubscriptionDialog = ({ 
  open, 
  onOpenChange, 
  subscription,
  onSuccess 
}: EditSharedSubscriptionDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(subscription?.name || "");
  const [totalValue, setTotalValue] = useState(subscription?.total_value || "");
  const [renewalDate, setRenewalDate] = useState(subscription?.renewal_date || "");
  const [paymentMethod, setPaymentMethod] = useState(subscription?.payment_method || "credit");
  const [frequency, setFrequency] = useState(subscription?.frequency || "monthly");
  const [partners, setPartners] = useState<Partner[]>(subscription?.shared_subscription_partners || []);

  const handleRemovePartner = (partnerId: string) => {
    if (partners.length <= 1) {
      toast({
        title: "Ação não permitida",
        description: "Deve haver pelo menos 1 participante",
        variant: "destructive"
      });
      return;
    }
    setPartners(partners.filter(p => p.id !== partnerId));
  };

  const handleUpdatePartnerValue = (partnerId: string, value: string) => {
    setPartners(partners.map(p => 
      p.id === partnerId ? { ...p, value: parseFloat(value) || 0 } : p
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Atualizar assinatura
      const { error: subError } = await supabase
        .from('shared_subscriptions')
        .update({
          name,
          total_value: parseFloat(totalValue),
          renewal_date: renewalDate,
          payment_method: paymentMethod,
          frequency
        })
        .eq('id', subscription.id);

      if (subError) throw subError;

      // Atualizar valores dos parceiros
      for (const partner of partners) {
        const { error: partnerError } = await supabase
          .from('shared_subscription_partners')
          .update({ value: partner.value })
          .eq('id', partner.id);

        if (partnerError) throw partnerError;
      }

      // Remover parceiros que foram excluídos
      const originalPartnerIds = subscription.shared_subscription_partners.map((p: any) => p.id);
      const currentPartnerIds = partners.map(p => p.id);
      const removedPartnerIds = originalPartnerIds.filter((id: string) => !currentPartnerIds.includes(id));

      if (removedPartnerIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('shared_subscription_partners')
          .delete()
          .in('id', removedPartnerIds);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Assinatura atualizada!",
        description: "As alterações foram salvas com sucesso"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Assinatura Compartilhada</DialogTitle>
          <DialogDescription>
            Atualize os dados da assinatura e gerencie os participantes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Assinatura</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total-value">Valor Total (R$)</Label>
                <Input
                  id="edit-total-value"
                  type="number"
                  step="0.01"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-renewal-date">Data de Renovação</Label>
                <Input
                  id="edit-renewal-date"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-payment-method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="edit-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Crédito</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-frequency">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="edit-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Participantes ({partners.length})</Label>
            </div>

            <div className="space-y-3">
              {partners.map((partner) => (
                <Card key={partner.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">{partner.email}</p>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        value={partner.value}
                        onChange={(e) => handleUpdatePartnerValue(partner.id, e.target.value)}
                        className="text-right"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePartner(partner.id)}
                      disabled={partners.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

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
              type="button"
              variant="gradient"
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
