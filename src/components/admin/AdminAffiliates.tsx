import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Check, 
  X, 
  Search,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  Wallet,
  UserCheck,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const AdminAffiliates = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);

  // Fetch affiliates
  const { data: affiliates = [], isLoading: loadingAffiliates } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data: affiliatesData, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each affiliate
      const userIds = affiliatesData.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return affiliatesData.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      }));
    },
  });

  // Fetch referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data: referralsData, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch affiliates for referrals
      const affiliateIds = [...new Set(referralsData.map(r => r.affiliate_id))];
      const { data: affiliatesForReferrals } = await supabase
        .from("affiliates")
        .select("id, code, user_id")
        .in("id", affiliateIds);

      // Fetch profiles for referred users and affiliates
      const allUserIds = [
        ...referralsData.map(r => r.referred_user_id),
        ...(affiliatesForReferrals?.map(a => a.user_id) || []),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const affiliateMap = new Map(affiliatesForReferrals?.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id),
      })).map(a => [a.id, a]) || []);

      return referralsData.map(r => ({
        ...r,
        affiliate: affiliateMap.get(r.affiliate_id) || null,
        referredProfile: profileMap.get(r.referred_user_id) || null,
      }));
    },
  });

  // Fetch commissions
  const { data: commissions = [] } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data: commissionsData, error } = await supabase
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch affiliates
      const affiliateIds = [...new Set(commissionsData.map(c => c.affiliate_id))];
      const { data: affiliatesForCommissions } = await supabase
        .from("affiliates")
        .select("id, code, user_id")
        .in("id", affiliateIds);

      // Fetch profiles for affiliates
      const userIds = affiliatesForCommissions?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const affiliateMap = new Map(affiliatesForCommissions?.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id),
      })).map(a => [a.id, a]) || []);

      return commissionsData.map(c => ({
        ...c,
        affiliate: affiliateMap.get(c.affiliate_id) || null,
      }));
    },
  });

  // Fetch payout requests
  const { data: payoutRequests = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => {
      const { data: payoutsData, error } = await supabase
        .from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch affiliates
      const affiliateIds = [...new Set(payoutsData.map(p => p.affiliate_id))];
      const { data: affiliatesForPayouts } = await supabase
        .from("affiliates")
        .select("id, code, pix_key, user_id")
        .in("id", affiliateIds);

      // Fetch profiles for affiliates
      const userIds = affiliatesForPayouts?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const affiliateMap = new Map(affiliatesForPayouts?.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id),
      })).map(a => [a.id, a]) || []);

      return payoutsData.map(p => ({
        ...p,
        affiliate: affiliateMap.get(p.affiliate_id) || null,
      }));
    },
  });

  // Update affiliate status mutation
  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Status do afiliado atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      affiliateEmail,
      affiliateName,
      payoutAmount,
      pixKey,
    }: { 
      id: string; 
      status: "paid" | "rejected"; 
      notes?: string;
      affiliateEmail?: string;
      affiliateName?: string;
      payoutAmount?: number;
      pixKey?: string;
    }) => {
      const updateData: Record<string, unknown> = { 
        status,
        notes,
        updated_at: new Date().toISOString(),
      };

      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("payout_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // If paid, update related commissions to 'paid' status
      if (status === "paid") {
        const payout = payoutRequests.find(p => p.id === id);
        if (payout) {
          await supabase
            .from("commissions")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("affiliate_id", payout.affiliate_id)
            .eq("status", "available");
        }
      }

      // Send notification email
      if (affiliateEmail && payoutAmount) {
        const formatCurrency = (cents: number) => {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(cents / 100);
        };

        await supabase.functions.invoke("send-notification", {
          body: {
            type: status === "paid" ? "affiliate_payout_approved" : "affiliate_payout_rejected",
            email: affiliateEmail,
            name: affiliateName || "Afiliado",
            data: {
              payoutAmount: formatCurrency(payoutAmount),
              pixKey: pixKey || "—",
              notes: notes,
            },
          },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setSelectedPayout(null);
      setPayoutNotes("");
      toast.success(
        variables.status === "paid" 
          ? "Saque marcado como pago e notificação enviada" 
          : "Saque rejeitado e notificação enviada"
      );
    },
    onError: () => {
      toast.error("Erro ao processar saque");
    },
  });

  // Calculate stats
  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === "active").length,
    totalReferrals: referrals.length,
    approvedReferrals: referrals.filter(r => r.status === "approved").length,
    pendingCommissions: commissions.filter(c => c.status === "pending").reduce((acc, c) => acc + c.amount_cents, 0),
    availableCommissions: commissions.filter(c => c.status === "available").reduce((acc, c) => acc + c.amount_cents, 0),
    paidCommissions: commissions.filter(c => c.status === "paid").reduce((acc, c) => acc + c.amount_cents, 0),
    pendingPayouts: payoutRequests.filter(p => p.status === "requested").length,
  };

  // Filter affiliates
  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloqueado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500">Aprovado</Badge>;
      case "available":
        return <Badge className="bg-blue-500/10 text-blue-500">Disponível</Badge>;
      case "paid":
        return <Badge className="bg-green-500/10 text-green-500">Pago</Badge>;
      case "requested":
        return <Badge variant="secondary">Solicitado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "chargeback":
        return <Badge variant="destructive">Estorno</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Afiliados</h2>
        <p className="text-muted-foreground">
          Gerencie o programa de afiliados, aprove saques e acompanhe estatísticas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
                <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
                <p className="text-xs text-muted-foreground">de {stats.totalAffiliates} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indicações Aprovadas</p>
                <p className="text-2xl font-bold">{stats.approvedReferrals}</p>
                <p className="text-xs text-muted-foreground">de {stats.totalReferrals} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingCommissions)}</p>
                <p className="text-xs text-muted-foreground">aguardando liberação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pendingPayouts > 0 ? "border-amber-500/50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendingPayouts}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.availableCommissions)} disponível
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Paid */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago em Comissões</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.paidCommissions)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
                queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
                queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
                queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Saques
            {stats.pendingPayouts > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingPayouts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Indicações
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Comissões
          </TabsTrigger>
        </TabsList>

        {/* Payout Requests Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Saque</CardTitle>
              <CardDescription>
                Gerencie os pedidos de saque dos afiliados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayouts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payoutRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação de saque
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutRequests.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payout.affiliate?.profile?.full_name || "—"}</p>
                            <p className="text-sm text-muted-foreground">{payout.affiliate?.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {payout.affiliate?.code}
                          </code>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payout.amount_cents)}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {payout.pix_key}
                          </code>
                        </TableCell>
                        <TableCell>
                          {format(new Date(payout.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-right">
                          {payout.status === "requested" && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => setSelectedPayout({ ...payout, action: "approve" })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedPayout({ ...payout, action: "reject" })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {payout.status !== "requested" && payout.notes && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toast.info(payout.notes)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <CardTitle>Lista de Afiliados</CardTitle>
                  <CardDescription>
                    Todos os afiliados cadastrados no programa
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar afiliado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAffiliates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAffiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{affiliate.profile?.full_name || "—"}</p>
                            <p className="text-sm text-muted-foreground">{affiliate.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {affiliate.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          {affiliate.pix_key ? (
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {affiliate.pix_key}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(affiliate.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                        <TableCell className="text-right">
                          {affiliate.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => updateAffiliateMutation.mutate({ 
                                id: affiliate.id, 
                                status: "blocked" 
                              })}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Bloquear
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:text-green-600"
                              onClick={() => updateAffiliateMutation.mutate({ 
                                id: affiliate.id, 
                                status: "active" 
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ativar
                            </Button>
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

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Indicações</CardTitle>
              <CardDescription>
                Histórico de indicações e conversões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Usuário Indicado</TableHead>
                    <TableHead>Primeiro Acesso</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.affiliate?.profile?.full_name || "—"}</p>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {referral.affiliate?.code}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.referredProfile?.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{referral.referredProfile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(referral.first_seen_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {referral.signup_at 
                          ? format(new Date(referral.signup_at), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        {referral.approved_at 
                          ? format(new Date(referral.approved_at), "dd/MM/yyyy", { locale: ptBR })
                          : "—"
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Comissões</CardTitle>
              <CardDescription>
                Histórico de todas as comissões geradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Invoice Stripe</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Disponível em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{commission.affiliate?.profile?.full_name || "—"}</p>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {commission.affiliate?.code}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(commission.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {commission.stripe_invoice_id.slice(0, 20)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {commission.period_start && commission.period_end ? (
                          <span className="text-sm">
                            {format(new Date(commission.period_start), "dd/MM", { locale: ptBR })} - {" "}
                            {format(new Date(commission.period_end), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(commission.available_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Processing Dialog */}
      <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPayout?.action === "approve" ? "Confirmar Pagamento" : "Rejeitar Saque"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayout?.action === "approve" 
                ? "Confirme que o pagamento foi realizado via PIX"
                : "Informe o motivo da rejeição do saque"
              }
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Afiliado:</span>
                  <span className="font-medium">{selectedPayout.affiliate?.profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedPayout.amount_cents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chave PIX:</span>
                  <code className="bg-background px-2 py-1 rounded text-sm">
                    {selectedPayout.pix_key}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {selectedPayout.action === "approve" ? "Observações (opcional)" : "Motivo da rejeição"}
                </label>
                <Textarea
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder={
                    selectedPayout.action === "approve"
                      ? "Ex: Pago em 01/02/2025 às 14:30"
                      : "Informe o motivo..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayout(null)}>
              Cancelar
            </Button>
            <Button
              className={selectedPayout?.action === "approve" ? "bg-green-500 hover:bg-green-600" : ""}
              variant={selectedPayout?.action === "reject" ? "destructive" : "default"}
              disabled={processPayoutMutation.isPending || (selectedPayout?.action === "reject" && !payoutNotes)}
              onClick={() => {
                if (selectedPayout) {
                  processPayoutMutation.mutate({
                    id: selectedPayout.id,
                    status: selectedPayout.action === "approve" ? "paid" : "rejected",
                    notes: payoutNotes,
                    affiliateEmail: selectedPayout.affiliate?.profile?.email,
                    affiliateName: selectedPayout.affiliate?.profile?.full_name,
                    payoutAmount: selectedPayout.amount_cents,
                    pixKey: selectedPayout.pix_key,
                  });
                }
              }}
            >
              {processPayoutMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedPayout?.action === "approve" ? "Confirmar Pagamento" : "Rejeitar Saque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};