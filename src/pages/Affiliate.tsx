import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliate } from "@/hooks/useAffiliate";
import { Logo } from "@/components/Logo";
import { 
  Copy, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle2, 
  Wallet,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const Affiliate = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    affiliate,
    stats,
    commissions,
    referrals,
    payouts,
    loading,
    becomeAffiliate,
    requestPayout,
    updatePixKey,
    fetchAffiliateData,
  } = useAffiliate();

  const [pixKey, setPixKey] = useState("");
  const [isBecoming, setIsBecoming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleBecomeAffiliate = async () => {
    try {
      setIsBecoming(true);
      await becomeAffiliate(pixKey || undefined);
      toast({
        title: "Parabéns! 🎉",
        description: "Você agora é um afiliado do MaisCtrl!",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao se tornar afiliado",
        variant: "destructive",
      });
    } finally {
      setIsBecoming(false);
    }
  };

  const handleCopyLink = () => {
    if (!affiliate) return;
    const link = `https://maisctrl.com/?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Seu link de afiliado foi copiado para a área de transferência.",
    });
  };

  const handleRequestPayout = async () => {
    if (!pixKey.trim()) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Informe sua chave PIX para solicitar o saque.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRequesting(true);
      await requestPayout(pixKey);
      setShowPayoutDialog(false);
      toast({
        title: "Saque solicitado!",
        description: "Seu saque foi solicitado e será processado em breve.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao solicitar saque",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      available: { variant: "default", label: "Disponível" },
      paid: { variant: "outline", label: "Pago" },
      chargeback: { variant: "destructive", label: "Estornado" },
      approved: { variant: "default", label: "Aprovado" },
      rejected: { variant: "destructive", label: "Rejeitado" },
      requested: { variant: "secondary", label: "Solicitado" },
      processing: { variant: "secondary", label: "Processando" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not an affiliate yet - show signup form
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <div className="text-center mb-8">
            <Logo size="lg" linkTo="/" />
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                CTRL 20
              </Badge>
              <CardTitle className="text-3xl">Torne-se um Afiliado</CardTitle>
              <CardDescription className="text-lg">
                Ganhe 20% de comissão recorrente indicando o MaisCtrl
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-bold">20%</div>
                  <div className="text-sm text-muted-foreground">Comissão recorrente</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-bold">14 dias</div>
                  <div className="text-sm text-muted-foreground">Para liberação</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-bold">PIX</div>
                  <div className="text-sm text-muted-foreground">Pagamento rápido</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix">Chave PIX (opcional, pode adicionar depois)</Label>
                <Input
                  id="pix"
                  placeholder="CPF, email, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>

              <Button
                onClick={handleBecomeAffiliate}
                disabled={isBecoming}
                className="w-full"
                size="lg"
                variant="gradient"
              >
                {isBecoming ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Quero ser afiliado
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao se tornar afiliado, você concorda com as regras do programa.
                Proibido spam, fraude ou autoindicação.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Affiliate dashboard
  const affiliateLink = `https://maisctrl.com/?ref=${affiliate.code}`;
  const availableBalance = stats?.available_commissions_cents || 0;
  const canRequestPayout = availableBalance >= 5000; // R$ 50 minimum

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Logo size="md" linkTo="/" />
            <p className="text-muted-foreground mt-1">Painel do Afiliado</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Affiliate Link */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground">Seu link exclusivo</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm truncate">
                    {affiliateLink}
                  </code>
                  <Button size="icon" variant="outline" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Código: {affiliate.code}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.approved_referrals || 0}</div>
                  <div className="text-sm text-muted-foreground">Clientes ativos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.pending_commissions_cents || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Comissões pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.available_commissions_cents || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponível para saque</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.total_earned_cents || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total ganho</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Button */}
        <div className="mb-8">
          <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="gradient"
                disabled={!canRequestPayout}
                className="w-full md:w-auto"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Solicitar saque via PIX
                {canRequestPayout && (
                  <span className="ml-2">({formatCurrency(availableBalance)})</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
                <DialogDescription>
                  Informe sua chave PIX para receber o pagamento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Valor do saque</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(availableBalance)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-pix">Chave PIX</Label>
                  <Input
                    id="payout-pix"
                    placeholder="CPF, email, telefone ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRequestPayout} disabled={isRequesting}>
                  {isRequesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar saque
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {!canRequestPayout && (
            <p className="text-sm text-muted-foreground mt-2">
              Saque mínimo: R$ 50,00. Você precisa de mais{" "}
              {formatCurrency(5000 - availableBalance)} disponível.
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="commissions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="referrals">Indicados</TabsTrigger>
            <TabsTrigger value="payouts">Saques</TabsTrigger>
          </TabsList>

          <TabsContent value="commissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Comissões</CardTitle>
                <CardDescription>
                  Suas comissões são liberadas 14 dias após o pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão ainda. Compartilhe seu link e comece a ganhar!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Disponível em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            {format(new Date(commission.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(commission.amount_cents)}
                          </TableCell>
                          <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          <TableCell>
                            {commission.status === "pending" ? (
                              format(new Date(commission.available_at), "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Indicados</CardTitle>
                <CardDescription>
                  Usuários que se cadastraram usando seu link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum cliente indicado ainda. Compartilhe seu link!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data do cadastro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aprovado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            {referral.signup_at
                              ? format(new Date(referral.signup_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(referral.status)}</TableCell>
                          <TableCell>
                            {referral.approved_at
                              ? format(new Date(referral.approved_at), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Saques</CardTitle>
                <CardDescription>
                  Seus saques solicitados e pagos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum saque solicitado ainda.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Chave PIX</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            {format(new Date(payout.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payout.amount_cents)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payout.pix_key}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Affiliate;
