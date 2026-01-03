import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Globe, Bell, Download, Trash2, Crown, Clock, Sun, Loader2, Phone, MessageCircle, Mail, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  phone_number: string;
  reminder_days: number[];
  reminder_time: string;
}

export const SettingsTab = () => {
  const { user } = useAuth();
  const [premiumTheme, setPremiumTheme] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    phone_number: "",
    reminder_days: [7, 3, 2, 1],
    reminder_time: "morning",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('premium-theme') === 'true';
    setPremiumTheme(savedTheme);
    if (savedTheme) {
      document.documentElement.classList.add('premium-theme');
    }
    
    // Load notification preferences from database
    if (user?.id) {
      loadNotificationPreferences();
    }
  }, [user?.id]);

  const loadNotificationPreferences = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setNotifPrefs({
        email_enabled: data.email_enabled,
        sms_enabled: data.sms_enabled,
        whatsapp_enabled: data.whatsapp_enabled,
        phone_number: data.phone_number || "",
        reminder_days: data.reminder_days || [7, 3, 2, 1],
        reminder_time: data.reminder_time || "morning",
      });
    }
  };

  const saveNotificationPreferences = async () => {
    if (!user?.id) return;
    
    setIsSavingPrefs(true);
    try {
      const { data: existing } = await supabase
        .from('user_notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_notification_preferences')
          .update({
            email_enabled: notifPrefs.email_enabled,
            sms_enabled: notifPrefs.sms_enabled,
            whatsapp_enabled: notifPrefs.whatsapp_enabled,
            phone_number: notifPrefs.phone_number || null,
            reminder_days: notifPrefs.reminder_days,
            reminder_time: notifPrefs.reminder_time,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            email_enabled: notifPrefs.email_enabled,
            sms_enabled: notifPrefs.sms_enabled,
            whatsapp_enabled: notifPrefs.whatsapp_enabled,
            phone_number: notifPrefs.phone_number || null,
            reminder_days: notifPrefs.reminder_days,
            reminder_time: notifPrefs.reminder_time,
          });
      }

      toast({
        title: "Preferências salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setNotifPrefs(prev => ({
      ...prev,
      reminder_days: prev.reminder_days.includes(day)
        ? prev.reminder_days.filter(d => d !== day)
        : [...prev.reminder_days, day].sort((a, b) => b - a)
    }));
  };

  const togglePremiumTheme = (checked: boolean) => {
    setPremiumTheme(checked);
    localStorage.setItem('premium-theme', String(checked));
    if (checked) {
      document.documentElement.classList.add('premium-theme');
    } else {
      document.documentElement.classList.remove('premium-theme');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const translateFrequency = (freq: string) => {
    const map: Record<string, string> = {
      'monthly': 'Mensal',
      'yearly': 'Anual',
      'weekly': 'Semanal',
      'quarterly': 'Trimestral'
    };
    return map[freq] || freq;
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Fetch all user data
      const [profileRes, subscriptionsRes, sharedSubsRes, partnersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id),
        supabase.from('shared_subscriptions').select('*').eq('user_id', user.id),
        supabase.from('shared_subscription_partners').select('*').eq('user_id', user.id),
      ]);

      const profile = profileRes.data;
      const subscriptions = subscriptionsRes.data || [];
      const sharedSubs = sharedSubsRes.data || [];
      const partnerships = partnersRes.data || [];

      // Build readable text content
      let content = `╔════════════════════════════════════════════════════════════╗
║                    MEUS DADOS - EXPORTAÇÃO                   ║
╚════════════════════════════════════════════════════════════╝

📅 Data da Exportação: ${formatDate(new Date().toISOString())}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 PERFIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Nome: ${profile?.full_name || "Não informado"}
   E-mail: ${profile?.email || "Não informado"}
   Conta criada em: ${formatDate(profile?.created_at)}
   Última atualização: ${formatDate(profile?.updated_at)}

`;

      if (subscriptions.length > 0) {
        content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MINHAS ASSINATURAS (${subscriptions.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        subscriptions.forEach((sub, index) => {
          content += `
   ${index + 1}. ${sub.name}
      ├─ Valor: ${formatCurrency(sub.value)}
      ├─ Frequência: ${translateFrequency(sub.frequency)}
      ├─ Método de pagamento: ${sub.payment_method}
      ├─ Data de renovação: ${new Date(sub.renewal_date).toLocaleDateString('pt-BR')}
      └─ Status: ${sub.is_active ? '✅ Ativa' : '❌ Inativa'}
`;
        });
      } else {
        content += `
📋 MINHAS ASSINATURAS
   Nenhuma assinatura cadastrada.
`;
      }

      if (sharedSubs.length > 0) {
        content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤝 ASSINATURAS COMPARTILHADAS QUE GERENCIO (${sharedSubs.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        sharedSubs.forEach((sub, index) => {
          content += `
   ${index + 1}. ${sub.name}
      ├─ Valor total: ${formatCurrency(sub.total_value)}
      ├─ Frequência: ${translateFrequency(sub.frequency)}
      ├─ Método de pagamento: ${sub.payment_method}
      ├─ Data de renovação: ${new Date(sub.renewal_date).toLocaleDateString('pt-BR')}
      └─ Status: ${sub.is_active ? '✅ Ativa' : '❌ Inativa'}
`;
        });
      }

      if (partnerships.length > 0) {
        content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 ASSINATURAS QUE PARTICIPO (${partnerships.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        partnerships.forEach((p, index) => {
          content += `
   ${index + 1}. Parceria
      ├─ Minha parte: ${formatCurrency(p.value)}
      ├─ Status: ${p.status === 'accepted' ? '✅ Aceito' : p.status === 'pending' ? '⏳ Pendente' : p.status}
      └─ Desde: ${formatDate(p.created_at)}
`;
        });
      }

      content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este arquivo foi gerado automaticamente.
Em caso de dúvidas, entre em contato com nosso suporte.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      // Create and download TXT file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Dados exportados",
        description: "Seus dados foram baixados com sucesso.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar seus dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "EXCLUIR") return;
    
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Send account deletion notification before deleting data
      if (profile?.email) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'account_deleted',
              email: profile.email,
              name: profile.full_name || 'Cliente',
            }
          });
        } catch (notifError) {
          console.error('Failed to send deletion notification:', notifError);
        }
      }

      // Delete user data in order (respecting foreign keys)
      await supabase.from('shared_subscription_partners').delete().eq('user_id', user.id);
      await supabase.from('invites').delete().eq('from_user_id', user.id);
      
      // Get shared subscriptions to delete partners
      const { data: sharedSubs } = await supabase
        .from('shared_subscriptions')
        .select('id')
        .eq('user_id', user.id);
      
      if (sharedSubs && sharedSubs.length > 0) {
        const sharedSubIds = sharedSubs.map(s => s.id);
        await supabase.from('shared_subscription_partners').delete().in('shared_subscription_id', sharedSubIds);
        await supabase.from('invites').delete().in('shared_subscription_id', sharedSubIds);
        await supabase.from('shared_subscriptions').delete().eq('user_id', user.id);
      }

      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      await supabase.from('user_subscriptions').delete().eq('user_id', user.id);
      await supabase.from('user_2fa').delete().eq('user_id', user.id);
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída permanentemente.",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erro ao excluir conta",
        description: "Não foi possível excluir sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize a aparência do app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tema</Label>
              <p className="text-sm text-muted-foreground">
                Alternar entre modo claro e escuro
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <div>
                <Label className="flex items-center gap-2">
                  Tema Premium Dourado
                  <Crown className="h-3 w-3 text-yellow-500" />
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ative o tema luxuoso exclusivo
                </p>
              </div>
            </div>
            <Switch checked={premiumTheme} onCheckedChange={togglePremiumTheme} />
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Notificações de Pagamento</CardTitle>
              <CardDescription>Configure os alertas de vencimento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canais de notificação */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Canais de Notificação</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label>E-mail</Label>
                    <p className="text-sm text-muted-foreground">Receber lembretes por e-mail</p>
                  </div>
                </div>
                <Switch 
                  checked={notifPrefs.email_enabled}
                  onCheckedChange={(checked) => setNotifPrefs(prev => ({ ...prev, email_enabled: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label>SMS</Label>
                    <p className="text-sm text-muted-foreground">Receber lembretes por SMS</p>
                  </div>
                </div>
                <Switch 
                  checked={notifPrefs.sms_enabled}
                  onCheckedChange={(checked) => setNotifPrefs(prev => ({ ...prev, sms_enabled: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label>WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Receber lembretes por WhatsApp</p>
                  </div>
                </div>
                <Switch 
                  checked={notifPrefs.whatsapp_enabled}
                  onCheckedChange={(checked) => setNotifPrefs(prev => ({ ...prev, whatsapp_enabled: checked }))}
                />
              </div>

              {(notifPrefs.sms_enabled || notifPrefs.whatsapp_enabled) && (
                <div className="pt-2">
                  <Label htmlFor="phone-number" className="text-sm">Número de telefone</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={notifPrefs.phone_number}
                    onChange={(e) => setNotifPrefs(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Inclua o código do país (ex: +55 para Brasil)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dias de antecedência */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Avisar com antecedência de:</Label>
            <div className="grid grid-cols-2 gap-3">
              {[7, 3, 2, 1].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Switch 
                    checked={notifPrefs.reminder_days.includes(day)}
                    onCheckedChange={() => toggleReminderDay(day)}
                  />
                  <Label className="text-sm font-normal">{day} {day === 1 ? 'dia' : 'dias'}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário dos avisos
            </Label>
            <Select 
              value={notifPrefs.reminder_time} 
              onValueChange={(value) => setNotifPrefs(prev => ({ ...prev, reminder_time: value }))}
            >
              <SelectTrigger id="reminder-time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Manhã (8:00)
                  </div>
                </SelectItem>
                <SelectItem value="afternoon">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Tarde (14:00)
                  </div>
                </SelectItem>
                <SelectItem value="evening">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Noite (20:00)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={saveNotificationPreferences} 
            disabled={isSavingPrefs}
            className="w-full"
          >
            {isSavingPrefs ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSavingPrefs ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Ajuste suas preferências</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Idioma</Label>
                <p className="text-sm text-muted-foreground">Português (Brasil)</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Alterar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
          <CardDescription>Gerencie seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exportando..." : "Exportar Dados"}
          </Button>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente, incluindo:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Perfil e informações pessoais</li>
                    <li>Todas as assinaturas cadastradas</li>
                    <li>Assinaturas compartilhadas</li>
                    <li>Convites enviados</li>
                    <li>Configurações de 2FA</li>
                  </ul>
                  <p className="pt-2">
                    Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                placeholder="Digite EXCLUIR para confirmar"
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "EXCLUIR" || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir Conta"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};