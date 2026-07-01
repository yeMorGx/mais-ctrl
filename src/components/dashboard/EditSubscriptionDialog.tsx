import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { brandSlugs, getBrandLogoUrl, getSubscriptionLogo } from "@/lib/subscriptionLogos";
import { Check, ChevronsUpDown, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  payment_method: string;
  renewal_date: string;
}

interface EditSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Lista única e ordenada de marcas (nome canônico) a partir do mapa de slugs
const BRANDS = Array.from(
  new Map(
    Object.entries(brandSlugs).map(([label, slug]) => [slug, { label, slug }])
  ).values()
).sort((a, b) => a.label.localeCompare(b.label));

export const EditSubscriptionDialog = ({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: EditSubscriptionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [frequency, setFrequency] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [brokenPreview, setBrokenPreview] = useState(false);

  useEffect(() => {
    if (subscription) {
      setFrequency(subscription.frequency);
      setPaymentMethod(subscription.payment_method);
      setName(subscription.name);
      setBrokenPreview(false);
    }
  }, [subscription]);

  const brandUrl = useMemo(() => getBrandLogoUrl(name), [name]);
  const fallbackLogo = useMemo(() => getSubscriptionLogo(name), [name]);
  const FallbackIcon = fallbackLogo.icon;

  const handleSelectBrand = (label: string) => {
    // Capitaliza a primeira letra de cada palavra para exibição
    const pretty = label.replace(/\b\w/g, (c) => c.toUpperCase());
    setName(pretty);
    setBrokenPreview(false);
    setBrandOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subscription) return;

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const value = parseFloat(formData.get("value") as string);
      const renewalDate = formData.get("renewal-date") as string;

      const { error } = await supabase
        .from("subscriptions")
        .update({
          name,
          value,
          frequency,
          payment_method: paymentMethod,
          renewal_date: renewalDate,
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast({
        title: "Assinatura atualizada!",
        description: `${name} foi atualizada com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Assinatura</DialogTitle>
          <DialogDescription>Atualize as informações e corrija a logo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview + seletor de marca */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center overflow-hidden p-2 border border-border/50 shrink-0">
              {brandUrl && !brokenPreview ? (
                <img
                  src={brandUrl}
                  alt={name}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setBrokenPreview(true)}
                />
              ) : name ? (
                <FallbackIcon className="w-6 h-6" style={{ color: fallbackLogo.color }} />
              ) : (
                <ImageOff className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Logo detectada</p>
              <p className="text-sm font-medium truncate">
                {brandUrl && !brokenPreview ? "Marca oficial" : "Ícone genérico"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marca / Serviço</Label>
            <Popover open={brandOpen} onOpenChange={setBrandOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={brandOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {name || "Selecione uma marca..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                  filter={(value, search) =>
                    value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                  }
                >
                  <CommandInput placeholder="Buscar marca (Netflix, Nubank...)" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>
                      <div className="text-sm text-muted-foreground py-2">
                        Nenhuma marca encontrada. Você pode digitar o nome livremente abaixo.
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {BRANDS.map((b) => (
                        <CommandItem
                          key={b.slug}
                          value={b.label}
                          onSelect={() => handleSelectBrand(b.label)}
                          className="flex items-center gap-2"
                        >
                          <img
                            src={`https://cdn.simpleicons.org/${b.slug}`}
                            alt=""
                            loading="lazy"
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                            }}
                          />
                          <span className="capitalize flex-1">{b.label}</span>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              name.toLowerCase() === b.label ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome exibido</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setBrokenPreview(false);
              }}
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
                defaultValue={subscription.value}
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
                  <SelectItem value="monthly">Mensal</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="renewal-date">Data de renovação</Label>
            <Input
              id="renewal-date"
              name="renewal-date"
              type="date"
              defaultValue={subscription.renewal_date}
              required
            />
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
            <Button type="submit" className="flex-1 bg-gradient-primary" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
