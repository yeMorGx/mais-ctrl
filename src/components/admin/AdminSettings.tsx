import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Bell, Database, Settings2, Key } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const AdminSettings = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [autoConfirmEmail, setAutoConfirmEmail] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveGeneral = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações gerais foram atualizadas com sucesso.",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Configurações de segurança salvas",
      description: "As configurações de segurança foram atualizadas.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notificações configuradas",
      description: "Preferências de notificação atualizadas.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações globais da aplicação
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Nome da Aplicação</Label>
                  <Input id="app-name" defaultValue="SubManager" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de Suporte</Label>
                  <Input id="support-email" type="email" defaultValue="suporte@submanager.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" defaultValue="SubManager Inc." />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloqueia acesso de usuários ao sistema
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>
              </div>

              <Button onClick={handleSaveGeneral}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança e Autenticação</CardTitle>
              <CardDescription>
                Configure opções de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmar Email Automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Novos usuários não precisam confirmar email
                    </p>
                  </div>
                  <Switch
                    checked={autoConfirmEmail}
                    onCheckedChange={setAutoConfirmEmail}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
                  <Input id="max-login-attempts" type="number" defaultValue="5" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Configurações de Senha</Label>
                  <div className="space-y-3 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-password-length">Comprimento Mínimo</Label>
                      <Input id="min-password-length" type="number" defaultValue="8" />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity}>
                <Shield className="h-4 w-4 mr-2" />
                Salvar Configurações de Segurança
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Eventos para Notificar</Label>
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Nova assinatura</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Assinatura cancelada</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Novo usuário</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Novo ticket de suporte</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>
                <Bell className="h-4 w-4 mr-2" />
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure integrações com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      Processamento de pagamentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                      Conectado
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">Lovable Cloud</h4>
                    <p className="text-sm text-muted-foreground">
                      Backend e autenticação
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                      Ativo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg opacity-60">
                  <div className="flex-1">
                    <h4 className="font-semibold">Email Provider</h4>
                    <p className="text-sm text-muted-foreground">
                      Envio de emails transacionais
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
