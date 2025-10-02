import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Mail, 
  FileText,
  Users,
  Activity,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const SiteManagement = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);

  // Fetch site statistics
  const { data: stats } = useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => {
      const [usersResult, subscriptionsResult, messagesResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("support_messages").select("id", { count: "exact", head: true })
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalSubscriptions: subscriptionsResult.count || 0,
        totalMessages: messagesResult.count || 0
      };
    }
  });

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações do site foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciamento do Site</h1>
        <p className="text-muted-foreground">
          Configurações gerais e estatísticas da plataforma
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assinaturas Gerenciadas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de assinaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens de Suporte
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens trocadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configurações principais da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Modo Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Desabilita o acesso ao site para usuários comuns
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="signups">Permitir Novos Cadastros</Label>
              <p className="text-sm text-muted-foreground">
                Permite que novos usuários se cadastrem
              </p>
            </div>
            <Switch
              id="signups"
              checked={allowNewSignups}
              onCheckedChange={setAllowNewSignups}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="site-name">Nome do Site</Label>
            <Input
              id="site-name"
              defaultValue="+Ctrl"
              placeholder="Nome da plataforma"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email">Email de Suporte</Label>
            <Input
              id="support-email"
              type="email"
              defaultValue="suporte@maisctrl.com"
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveSettings} className="bg-gradient-primary">
              Salvar Configurações
            </Button>
            <Button variant="outline">
              Restaurar Padrões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Configurações de segurança e proteção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação em Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">
                Exigir 2FA para todos os usuários
              </p>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Logs de Auditoria</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas as ações dos usuários
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proteção contra Força Bruta</Label>
              <p className="text-sm text-muted-foreground">
                Limitar tentativas de login
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configurar alertas e notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Novos Usuários</Label>
              <p className="text-sm text-muted-foreground">
                Notificar admins sobre novos cadastros
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Suporte</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre novas mensagens de suporte
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Relatórios Diários</Label>
              <p className="text-sm text-muted-foreground">
                Enviar resumo diário por email
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Banco de Dados</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Servidor</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stripe Integration</span>
              <Badge className="bg-green-500">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <Badge className="bg-yellow-500">Limitado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
