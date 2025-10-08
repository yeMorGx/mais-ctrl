import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users, Share2, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function ShareInvite() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    loadSubscription();
  }, [subscriptionId]);

  const loadSubscription = async () => {
    if (!subscriptionId) return;

    const { data: sub, error } = await supabase
      .from('shared_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error || !sub) {
      toast({
        title: "Erro",
        description: "Assinatura não encontrada",
        variant: "destructive"
      });
      return;
    }

    const { data: partnerData } = await supabase
      .from('shared_subscription_partners')
      .select('*')
      .eq('shared_subscription_id', subscriptionId);

    setSubscription(sub);
    setPartners(partnerData || []);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para participar",
        variant: "destructive"
      });
      navigate(`/auth?redirect=/share/invite/${subscriptionId}`);
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite seu nome para continuar",
        variant: "destructive"
      });
      return;
    }

    // Verificar se já está participando
    const alreadyJoined = partners.some(p => p.user_id === user.id);
    if (alreadyJoined) {
      toast({
        title: "Já participa",
        description: "Você já está nesta assinatura compartilhada",
        variant: "destructive"
      });
      navigate('/dashboard?tab=share');
      return;
    }

    setJoining(true);

    try {
      // Calcular novo valor dividido
      const totalPartners = partners.length + 1;
      const newValue = (parseFloat(subscription.total_value) / totalPartners).toFixed(2);

      // Adicionar novo parceiro
      const { error: insertError } = await supabase
        .from('shared_subscription_partners')
        .insert({
          shared_subscription_id: subscriptionId,
          user_id: user.id,
          name: name.trim(),
          email: user.email || '',
          value: parseFloat(newValue),
          status: 'active'
        });

      if (insertError) throw insertError;

      // Atualizar valores de todos os parceiros existentes
      const { error: updateError } = await supabase
        .from('shared_subscription_partners')
        .update({ value: parseFloat(newValue) })
        .eq('shared_subscription_id', subscriptionId);

      if (updateError) throw updateError;

      toast({
        title: "Bem-vindo!",
        description: `Você entrou em ${subscription.name}. Seu valor: R$ ${newValue}`
      });

      navigate('/dashboard?tab=share');
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Assinatura não encontrada</CardTitle>
            <CardDescription>O link pode estar inválido ou expirado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const valuePerPerson = partners.length > 0 
    ? (parseFloat(subscription.total_value) / (partners.length + 1)).toFixed(2)
    : subscription.total_value;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4">
              <Logo size="lg" />
            </div>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Você foi convidado!</CardTitle>
              <CardDescription className="text-base">
                Participe e economize dividindo custos
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assinatura</p>
                  <p className="text-xl font-semibold">{subscription.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-lg font-semibold">R$ {parseFloat(subscription.total_value).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Seu Valor</p>
                    <p className="text-lg font-semibold text-primary">R$ {valuePerPerson}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Participantes atuais: {partners.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {partners.map((partner, index) => (
                      <div key={index} className="flex items-center gap-1 bg-background px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {partner.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Seu Nome</Label>
                    <Input
                      id="name"
                      placeholder="Como você quer aparecer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-primary"
                    size="lg"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? "Entrando..." : "Entrar e Dividir Custos"}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-primary"
                  size="lg"
                  onClick={() => navigate(`/auth?redirect=/share/invite/${subscriptionId}`)}
                >
                  Fazer Login para Participar
                </Button>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">
                  💡 O valor será dividido igualmente entre todos. Quanto mais pessoas, menor o custo individual!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
