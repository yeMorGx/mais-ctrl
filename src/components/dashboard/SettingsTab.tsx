import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Globe, Bell, Download, Trash2, Crown, Clock, Sun, Loader2 } from "lucide-react";
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

export const SettingsTab = () => {
  const [premiumTheme, setPremiumTheme] = useState(false);
  const [paymentReminderDays, setPaymentReminderDays] = useState<string[]>(["7", "3"]);
  const [reminderTime, setReminderTime] = useState("morning");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('premium-theme') === 'true';
    setPremiumTheme(savedTheme);
    if (savedTheme) {
      document.documentElement.classList.add('premium-theme');
    }
  }, []);

  const togglePremiumTheme = (checked: boolean) => {
    setPremiumTheme(checked);
    localStorage.setItem('premium-theme', String(checked));
    if (checked) {
      document.documentElement.classList.add('premium-theme');
    } else {
      document.documentElement.classList.remove('premium-theme');
    }
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

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        subscriptions: subscriptionsRes.data || [],
        sharedSubscriptions: sharedSubsRes.data || [],
        partnerships: partnersRes.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
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
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Avisar com antecedência de:</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={paymentReminderDays.includes("7")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentReminderDays([...paymentReminderDays, "7"]);
                    } else {
                      setPaymentReminderDays(paymentReminderDays.filter(d => d !== "7"));
                    }
                  }}
                />
                <Label className="text-sm font-normal">7 dias</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={paymentReminderDays.includes("3")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentReminderDays([...paymentReminderDays, "3"]);
                    } else {
                      setPaymentReminderDays(paymentReminderDays.filter(d => d !== "3"));
                    }
                  }}
                />
                <Label className="text-sm font-normal">3 dias</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={paymentReminderDays.includes("2")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentReminderDays([...paymentReminderDays, "2"]);
                    } else {
                      setPaymentReminderDays(paymentReminderDays.filter(d => d !== "2"));
                    }
                  }}
                />
                <Label className="text-sm font-normal">2 dias</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={paymentReminderDays.includes("1")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentReminderDays([...paymentReminderDays, "1"]);
                    } else {
                      setPaymentReminderDays(paymentReminderDays.filter(d => d !== "1"));
                    }
                  }}
                />
                <Label className="text-sm font-normal">1 dia</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário dos avisos
            </Label>
            <Select value={reminderTime} onValueChange={setReminderTime}>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outras Notificações</CardTitle>
          <CardDescription>Configure outras notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receber lembretes por e-mail
              </p>
            </div>
            <Switch defaultChecked />
          </div>
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