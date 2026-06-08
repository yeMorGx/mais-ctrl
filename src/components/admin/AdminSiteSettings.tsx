import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Palette, 
  Mail, 
  Phone, 
  Save,
  RefreshCw,
  AlertTriangle,
  Users,
  CreditCard,
  MessageSquare
} from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

export const AdminSiteSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all settings
  const { data: settings = [], isLoading, refetch } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, subscriptions, messages] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }),
        supabase.from("support_messages").select("*", { count: "exact", head: true }),
      ]);

      return {
        users: users.count || 0,
        subscriptions: subscriptions.count || 0,
        messages: messages.count || 0,
      };
    },
  });

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || {};
  };

  // Local state for form values
  const [showDevBanner, setShowDevBanner] = useState(() => getSetting("show_development_banner").enabled ?? true);
  const [maintenanceMode, setMaintenanceMode] = useState(() => getSetting("maintenance_mode").enabled ?? false);
  const [siteName, setSiteName] = useState(() => getSetting("site_name").value ?? "+Ctrl");
  const [supportEmail, setSupportEmail] = useState(() => getSetting("support_email").value ?? "maisctrlsuporte@gmail.com");

  // Update state when settings load
  useState(() => {
    if (settings.length > 0) {
      setShowDevBanner(getSetting("show_development_banner").enabled ?? true);
      setMaintenanceMode(getSetting("maintenance_mode").enabled ?? false);
      setSiteName(getSetting("site_name").value ?? "+Ctrl");
      setSupportEmail(getSetting("support_email").value ?? "maisctrlsuporte@gmail.com");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString() 
        }, { onConflict: "key" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({
        title: "Configuração salva!",
        description: "As alterações foram aplicadas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveGeneral = () => {
    updateMutation.mutate({ key: "site_name", value: { value: siteName } });
    updateMutation.mutate({ key: "support_email", value: { value: supportEmail } });
  };

  const handleToggleDevBanner = (enabled: boolean) => {
    setShowDevBanner(enabled);
    updateMutation.mutate({ key: "show_development_banner", value: { enabled } });
  };

  const handleToggleMaintenance = (enabled: boolean) => {
    setMaintenanceMode(enabled);
    updateMutation.mutate({ key: "maintenance_mode", value: { enabled } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Site</h1>
          <p className="text-muted-foreground">Gerencie todas as configurações do sistema</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.users || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.subscriptions || 0}</p>
                <p className="text-sm text-muted-foreground">Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <MessageSquare className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.messages || 0}</p>
                <p className="text-sm text-muted-foreground">Mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Informações básicas do site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nome do Site</Label>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="+Ctrl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">E-mail de Suporte</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="support-email"
                      className="pl-9"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="suporte@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Modo de Manutenção</p>
                    <p className="text-sm text-muted-foreground">
                      Exibe uma mensagem de manutenção para todos os usuários
                    </p>
                  </div>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} />
              </div>

              <Button onClick={handleSaveGeneral}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a interface do site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Banner de Desenvolvimento</p>
                    <p className="text-sm text-muted-foreground">
                      Exibe o banner "Site em desenvolvimento" no topo do site
                    </p>
                  </div>
                </div>
                <Switch checked={showDevBanner} onCheckedChange={handleToggleDevBanner} />
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Mais opções de personalização estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure as notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border bg-muted/50 flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Twilio Configurado</p>
                  <p className="text-sm text-muted-foreground">
                    As credenciais do Twilio estão configuradas para SMS e WhatsApp. 
                    Verifique o número no painel do Twilio para garantir que está habilitado para o Brasil.
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">Ativo</Badge>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50 flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Resend Configurado</p>
                  <p className="text-sm text-muted-foreground">
                    E-mails são enviados via Resend para o endereço cadastrado do usuário.
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Configurações de segurança do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Confirmação de E-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Usuários precisam confirmar o e-mail ao criar conta
                  </p>
                </div>
                <Badge className="ml-auto bg-green-500">Ativo</Badge>
              </div>

              <div className="p-4 rounded-lg border flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Autenticação 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem ativar autenticação em duas etapas
                  </p>
                </div>
                <Badge className="ml-auto bg-green-500">Disponível</Badge>
              </div>

              <div className="p-4 rounded-lg border flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">RLS (Row Level Security)</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as tabelas possuem políticas de segurança
                  </p>
                </div>
                <Badge className="ml-auto bg-green-500">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
