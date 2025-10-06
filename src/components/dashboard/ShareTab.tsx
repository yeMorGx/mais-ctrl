import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Share2, CheckCircle, XCircle, Clock, UserPlus, CreditCard, Eye, Sparkles, Trash2, Link2, Copy, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const ShareTab = () => {
  const { toast } = useToast();
  const [sharedSubscriptions, setSharedSubscriptions] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    name: "",
    totalValue: "",
    partners: [{ name: "", email: "", value: "" }]
  });

  const generateInviteLink = (subscriptionId: string) => {
    return `${window.location.origin}/share/invite/${subscriptionId}`;
  };

  const copyInviteLink = (subscriptionId: string) => {
    const link = generateInviteLink(subscriptionId);
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link de convite foi copiado para a área de transferência"
    });
  };

  const shareViaWhatsApp = (subscription: any) => {
    const link = generateInviteLink(subscription.id);
    const message = encodeURIComponent(
      `🎉 Você foi convidado para dividir a assinatura de *${subscription.name}*!\n\n` +
      `💰 Valor: R$ ${subscription.totalValue.toFixed(2)}\n` +
      `👥 Participe e economize junto!\n\n` +
      `Clique no link para aceitar: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const addPartner = () => {
    setNewSubscription({
      ...newSubscription,
      partners: [...newSubscription.partners, { name: "", email: "", value: "" }]
    });
  };

  const removePartner = (index: number) => {
    const updatedPartners = newSubscription.partners.filter((_, i) => i !== index);
    setNewSubscription({ ...newSubscription, partners: updatedPartners });
  };

  const handleCreateSubscription = () => {
    if (!newSubscription.name || !newSubscription.totalValue) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e valor total da assinatura",
        variant: "destructive"
      });
      return;
    }

    const validPartners = newSubscription.partners.filter(p => p.name && p.email && p.value);
    if (validPartners.length === 0) {
      toast({
        title: "Adicione parceiros",
        description: "Adicione pelo menos um parceiro válido",
        variant: "destructive"
      });
      return;
    }

    const newSub = {
      id: Date.now().toString(),
      name: newSubscription.name,
      totalValue: parseFloat(newSubscription.totalValue),
      partners: validPartners.map(p => ({
        ...p,
        value: parseFloat(p.value),
        status: "pending"
      }))
    };

    setSharedSubscriptions([...sharedSubscriptions, newSub]);
    setIsCreateDialogOpen(false);
    setNewSubscription({
      name: "",
      totalValue: "",
      partners: [{ name: "", email: "", value: "" }]
    });

    toast({
      title: "Conta criada!",
      description: "Convites serão enviados aos parceiros em breve"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "overdue":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-6 w-6 text-primary" />
                +Share
              </CardTitle>
              <CardDescription>
                Compartilhe assinaturas e divida custos
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta Compartilhada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Conta Compartilhada</DialogTitle>
                  <DialogDescription>
                    Configure a assinatura e adicione parceiros para dividir os custos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription-name">Nome da Assinatura</Label>
                      <Input
                        id="subscription-name"
                        placeholder="Ex: Netflix Premium"
                        value={newSubscription.name}
                        onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="total-value">Valor Total Mensal (R$)</Label>
                      <Input
                        id="total-value"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newSubscription.totalValue}
                        onChange={(e) => setNewSubscription({ ...newSubscription, totalValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Parceiros</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPartner}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Parceiro
                      </Button>
                    </div>

                    {newSubscription.partners.map((partner, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Parceiro {index + 1}</h4>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePartner(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Nome</Label>
                              <Input
                                placeholder="Nome completo"
                                value={partner.name}
                                onChange={(e) => {
                                  const updatedPartners = [...newSubscription.partners];
                                  updatedPartners[index].name = e.target.value;
                                  setNewSubscription({ ...newSubscription, partners: updatedPartners });
                                }}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">E-mail</Label>
                              <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={partner.email}
                                onChange={(e) => {
                                  const updatedPartners = [...newSubscription.partners];
                                  updatedPartners[index].email = e.target.value;
                                  setNewSubscription({ ...newSubscription, partners: updatedPartners });
                                }}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Valor (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={partner.value}
                                onChange={(e) => {
                                  const updatedPartners = [...newSubscription.partners];
                                  updatedPartners[index].value = e.target.value;
                                  setNewSubscription({ ...newSubscription, partners: updatedPartners });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-gradient-primary"
                    onClick={handleCreateSubscription}
                  >
                    Criar e Enviar Convites
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Empty State */}
      {sharedSubscriptions.length === 0 && (
        <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <CardContent className="py-16 text-center">
            <div className="relative w-48 h-32 mx-auto mb-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white shadow-lg animate-pulse">
                <Users className="h-6 w-6" />
              </div>
              
              <div className="absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center text-white shadow-lg animate-pulse" style={{ animationDelay: '0.5s' }}>
                <Users className="h-6 w-6" />
              </div>
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white shadow-lg animate-pulse" style={{ animationDelay: '1s' }}>
                <Users className="h-6 w-6" />
              </div>
              
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                <line x1="24" y1="50%" x2="50%" y2="24" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" opacity="0.4" />
                <line x1="50%" y1="24" x2="calc(100% - 24px)" y2="50%" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.5s' }} opacity="0.4" />
                <line x1="24" y1="50%" x2="calc(100% - 24px)" y2="50%" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '1s' }} opacity="0.4" />
              </svg>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-xl">
                <Share2 className="h-8 w-8" />
              </div>
            </div>
            
            <h3 className="font-semibold text-xl mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Nenhuma assinatura compartilhada
            </h3>
            <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
              Economize junto. Crie sua primeira conta compartilhada e divida custos com segurança.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-8 max-w-sm mx-auto">
              Compartilhe Netflix, Spotify, Prime e mais com amigos e família
            </p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-base px-8 py-6 h-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Primeira Conta Compartilhada
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
      
      {/* Subscription Cards */}
      {sharedSubscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{subscription.name}</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {subscription.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Invite Links Section */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      Link de Convite
                    </Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={generateInviteLink(subscription.id)}
                      className="text-xs bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyInviteLink(subscription.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => shareViaWhatsApp(subscription)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                      Compartilhar no WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyInviteLink(subscription.id)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{subscription.partners.length} participantes</span>
              </div>

              {subscription.partners.map((partner: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                      {partner.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getStatusIcon(partner.status)}
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(partner.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={partner.status === "paid" ? "secondary" : "destructive"}
                    className="font-bold"
                  >
                    R$ {partner.value.toFixed(2)}
                  </Badge>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Parceiro
                </Button>
                <Button variant="outline" className="flex-1">
                  Ver Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* How It Works */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Como funciona o +Share?
          </CardTitle>
          <CardDescription>
            Simples, seguro e rápido - comece a economizar em minutos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="font-medium">Crie uma conta compartilhada</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para uma assinatura específica (Netflix, Spotify, etc)
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span className="font-medium">Adicione parceiros</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Através de convite por e-mail ou link compartilhável
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Defina a divisão</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Do valor (igualitária ou personalizada)
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">Pagamento seguro</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cada parceiro paga sua parte via Stripe
                </p>
              </div>
            </li>
            
            <li className="flex gap-4 items-start group hover:bg-primary/5 p-3 rounded-lg transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-glow transition-shadow">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-medium">Acompanhe em tempo real</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Status de pagamento de todos os participantes
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};