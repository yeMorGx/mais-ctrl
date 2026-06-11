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
import { CalendarDays, Gift, ChevronLeft, ChevronRight, Check, Sparkles, CreditCard, FlaskConical, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const getRenewalLabel = (frequency: string, date: string): string => {
  if (!date || !frequency) return "";
  const renewalDate = new Date(date + 'T00:00:00');
  const day = renewalDate.getDate();
  const dayOfWeek = renewalDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  switch (frequency) {
    case "daily": return "Todo dia";
    case "weekly": return `Toda ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`;
    case "monthly": return `Todo dia ${day}`;
    case "quarterly": return `Todo dia ${day} (a cada 3 meses)`;
    case "annual": {
      const month = renewalDate.toLocaleDateString('pt-BR', { month: 'long' });
      return `Todo dia ${day} de ${month}`;
    }
    default: return "";
  }
};

const STEPS = [
  { id: 1, title: "Básico", icon: Sparkles, desc: "Nome e valor" },
  { id: 2, title: "Cobrança", icon: CreditCard, desc: "Forma e ciclo" },
  { id: 3, title: "Teste", icon: FlaskConical, desc: "Período grátis" },
  { id: 4, title: "Revisão", icon: Check, desc: "Confirmar" },
];

export const AddSubscriptionDialog = ({ open, onOpenChange, onSuccess }: AddSubscriptionDialogProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // form state
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [frequency, setFrequency] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [hasTrial, setHasTrial] = useState<boolean | null>(null);
  const [trialEndDate, setTrialEndDate] = useState("");

  const reset = () => {
    setStep(1); setName(""); setValue(""); setFrequency(""); setPaymentMethod("");
    setRenewalDate(""); setHasTrial(null); setTrialEndDate("");
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const { data: userSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('user_subscriptions').select('*').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user
  });

  const { data: subscriptionCount } = useQuery({
    queryKey: ['subscription-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true);
      return count || 0;
    },
    enabled: !!user
  });

  const renewalLabel = useMemo(() => getRenewalLabel(frequency, renewalDate), [frequency, renewalDate]);

  const trialDaysLeft = useMemo(() => {
    if (!trialEndDate) return 0;
    const diff = new Date(trialEndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [trialEndDate]);

  const canAdvance = () => {
    if (step === 1) return name.trim().length > 0 && parseFloat(value) > 0;
    if (step === 2) return frequency && paymentMethod && renewalDate;
    if (step === 3) return hasTrial !== null && (!hasTrial || trialEndDate);
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    const isFree = userSubscription?.plan === 'free';
    if (isFree && (subscriptionCount || 0) >= 5) {
      toast({ title: "Limite atingido", description: "Plano gratuito permite até 5 assinaturas. Faça upgrade para o +Premium.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        name,
        value: parseFloat(value),
        frequency,
        payment_method: paymentMethod,
        renewal_date: renewalDate,
        trial_end_date: hasTrial && trialEndDate ? new Date(trialEndDate).toISOString() : null,
      });
      if (error) throw error;
      toast({ title: hasTrial ? "Assinatura em teste adicionada!" : "Assinatura adicionada!", description: `${name} foi cadastrada com sucesso.` });
      onSuccess();
      handleClose(false);
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const next = () => step < 4 ? setStep(step + 1) : handleSubmit();
  const back = () => step > 1 && setStep(step - 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Stepper */}
        <div className="px-6 pt-6 pb-2">
          <DialogHeader className="mb-4">
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>Etapa {step} de {STEPS.length} · {STEPS[step - 1].desc}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all shrink-0",
                    active && "border-primary bg-primary text-primary-foreground scale-110",
                    done && "border-primary bg-primary text-primary-foreground",
                    !active && !done && "border-muted bg-muted/30 text-muted-foreground"
                  )}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1 mx-1 transition-colors", done ? "bg-primary" : "bg-muted")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da assinatura</Label>
                    <Input id="name" autoFocus placeholder="Ex: Netflix, Spotify, Academia..." value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input id="value" type="number" step="0.01" min="0.01" placeholder="29,90" value={value} onChange={(e) => setValue(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Quanto será cobrado a cada ciclo.</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue placeholder="Com que frequência você paga?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="renewal" className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Data de renovação</Label>
                    <Input id="renewal" type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
                    {renewalLabel && (
                      <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 rounded-md px-3 py-2">
                        <CalendarDays className="h-4 w-4" />{renewalLabel}
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2 py-2">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Esta assinatura está em teste grátis?</h3>
                    <p className="text-sm text-muted-foreground">Vamos te avisar antes da cobrança começar.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setHasTrial(false); setTrialEndDate(""); }}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50",
                        hasTrial === false ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <X className="h-5 w-5 mb-2 text-muted-foreground" />
                      <div className="font-medium">Não</div>
                      <div className="text-xs text-muted-foreground">Já estou pagando</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasTrial(true)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50",
                        hasTrial === true ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <Gift className="h-5 w-5 mb-2 text-primary" />
                      <div className="font-medium">Sim, em teste</div>
                      <div className="text-xs text-muted-foreground">Ainda não fui cobrado</div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {hasTrial && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <div className="p-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 space-y-3">
                          <Label htmlFor="trial-end">Quando termina o período de teste?</Label>
                          <Input
                            id="trial-end"
                            type="date"
                            value={trialEndDate}
                            onChange={(e) => setTrialEndDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          {trialDaysLeft > 0 && (
                            <div className="flex items-center gap-2 text-sm text-primary font-medium">
                              <FlaskConical className="h-4 w-4" />
                              Faltam {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} de teste
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">Enviaremos uma notificação 3 dias antes do fim do teste.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Confira antes de adicionar</h3>
                  <div className="rounded-lg border bg-card divide-y">
                    <Row label="Nome" value={name} />
                    <Row label="Valor" value={`R$ ${parseFloat(value || "0").toFixed(2)}`} />
                    <Row label="Frequência" value={frequencyLabel(frequency)} />
                    <Row label="Pagamento" value={paymentLabel(paymentMethod)} />
                    <Row label="Renovação" value={renewalLabel || renewalDate} />
                    <Row
                      label="Período de teste"
                      value={hasTrial && trialEndDate
                        ? `Termina em ${new Date(trialEndDate).toLocaleDateString('pt-BR')} (${trialDaysLeft}d)`
                        : "Não"}
                      highlight={!!hasTrial}
                    />
                  </div>
                  {hasTrial && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                      <FlaskConical className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Esta assinatura ficará marcada como <strong>Em teste</strong> no dashboard até {new Date(trialEndDate).toLocaleDateString('pt-BR')}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/30">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 1 || isLoading}>
            <ChevronLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <Button type="button" variant="gradient" onClick={next} disabled={!canAdvance() || isLoading}>
            {isLoading ? "Salvando..." : step === 4 ? (<>Adicionar <Check className="h-4 w-4 ml-1" /></>) : (<>Próximo <ChevronRight className="h-4 w-4 ml-1" /></>)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium text-right", highlight && "text-primary")}>{value || "—"}</span>
  </div>
);

const frequencyLabel = (f: string) => ({ daily: "Diária", weekly: "Semanal", monthly: "Mensal", quarterly: "Trimestral", annual: "Anual" }[f] || f);
const paymentLabel = (p: string) => ({ credit: "Cartão de Crédito", debit: "Cartão de Débito", pix: "PIX", boleto: "Boleto" }[p] || p);
