import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Globe, Bell, Download, Trash2, Crown, Clock, Sun } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export const SettingsTab = () => {
  const [premiumTheme, setPremiumTheme] = useState(false);
  const [paymentReminderDays, setPaymentReminderDays] = useState<string[]>(["7", "3"]);
  const [reminderTime, setReminderTime] = useState("morning");

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
          <Button variant="outline" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};