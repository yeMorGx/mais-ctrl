import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X } from "lucide-react";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreatePlanDialog = ({ open, onOpenChange, onSuccess }: CreatePlanDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<string[]>([""]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_interval: "monthly",
    is_active: true,
    is_popular: false,
    max_subscriptions: "",
    stripe_price_id: "",
  });

  const handleAddFeature = () => {
    setFeatures([...features, ""]);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validFeatures = features.filter(f => f.trim() !== "");

      const { error } = await supabase
        .from("subscription_plans")
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          billing_interval: formData.billing_interval,
          features: validFeatures,
          is_active: formData.is_active,
          is_popular: formData.is_popular,
          max_subscriptions: formData.max_subscriptions ? parseInt(formData.max_subscriptions) : null,
          stripe_price_id: formData.stripe_price_id || null,
        });

      if (error) throw error;

      toast({
        title: "Plano criado!",
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_interval: "monthly",
        is_active: true,
        is_popular: false,
        max_subscriptions: "",
        stripe_price_id: "",
      });
      setFeatures([""]);
    } catch (error: any) {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Plano</DialogTitle>
          <DialogDescription>
            Adicione um novo plano de assinatura ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                placeholder="Ex: Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="12.49"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os benefícios deste plano..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing_interval">Período de Cobrança</Label>
              <Select
                value={formData.billing_interval}
                onValueChange={(value) => setFormData({ ...formData, billing_interval: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="lifetime">Vitalício</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_subscriptions">Limite de Assinaturas</Label>
              <Input
                id="max_subscriptions"
                type="number"
                placeholder="Deixe vazio para ilimitado"
                value={formData.max_subscriptions}
                onChange={(e) => setFormData({ ...formData, max_subscriptions: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_price_id">Stripe Price ID (Opcional)</Label>
            <Input
              id="stripe_price_id"
              placeholder="price_xxxxxxxxxxxxx"
              value={formData.stripe_price_id}
              onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Recursos Incluídos</Label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: Dashboard avançado"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                  />
                  {features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Recurso
              </Button>
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Plano Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Disponível para seleção pelos usuários
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marcar como Popular</Label>
                <p className="text-xs text-muted-foreground">
                  Destaca este plano na página de preços
                </p>
              </div>
              <Switch
                checked={formData.is_popular}
                onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
