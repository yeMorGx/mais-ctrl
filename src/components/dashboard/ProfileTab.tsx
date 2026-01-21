import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload, Loader2, Mail, DollarSign, Building2, Crown, Clock, Shield, Key, Lock, CheckCircle2, XCircle, Phone, Copy, Smartphone } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";

export const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 2FA States
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'qrcode' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Change Password States
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user 2FA status
  const { data: user2FA, refetch: refetch2FA } = useQuery({
    queryKey: ["user2FA", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user subscription plan
  const { data: userSubscription } = useQuery({
    queryKey: ["userSubscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isPremium = userSubscription?.plan === "premium" && userSubscription?.status === "active";
  const is2FAEnabled = user2FA?.is_enabled || false;

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type - allow GIF for premium users
      const validTypes = isPremium 
        ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: isPremium 
            ? "Apenas JPG, PNG, GIF e WEBP são permitidos"
            : "Apenas JPG, PNG e WEBP são permitidos. GIFs são exclusivos para usuários Premium",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5242880) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Validate image content with AI
      const { data: validationData } = await supabase.functions.invoke('validate-image', {
        body: { imageUrl: publicUrl }
      });

      if (validationData && !validationData.isAppropriate) {
        // Delete the uploaded file
        await supabase.storage
          .from('avatars')
          .remove([filePath]);

        toast({
          title: "Imagem inadequada",
          description: "A imagem contém conteúdo inapropriado e não pode ser usada",
          variant: "destructive"
        });
        return;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      refetch();
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar sua foto",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStart2FASetup = async () => {
    if (!user) return;
    
    setIsEnabling2FA(true);
    try {
      // Call the TOTP edge function to setup 2FA
      const { data, error } = await supabase.functions.invoke('totp', {
        body: { action: 'setup' }
      });

      if (error) throw error;

      setTotpSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setTwoFAStep('qrcode');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Erro ao configurar 2FA",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleVerify2FASetup = async () => {
    if (!user || verificationCode.length !== 6) return;
    
    setIsEnabling2FA(true);
    try {
      // Verify the TOTP code
      const { data, error } = await supabase.functions.invoke('totp', {
        body: { action: 'verify-setup', code: verificationCode }
      });

      if (error) throw error;

      if (!data.valid) {
        toast({
          title: "Código inválido",
          description: "Verifique o código no seu aplicativo e tente novamente.",
          variant: "destructive"
        });
        return;
      }

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShow2FADialog(false);
      setTwoFAStep('setup');
      setVerificationCode('');
      setTotpSecret('');
      setQrCodeUrl('');
      refetch2FA();

      toast({
        title: "2FA ativado com sucesso!",
        description: "Guarde seus códigos de backup em um lugar seguro.",
      });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "Erro ao verificar código",
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;
    
    setIsDisabling2FA(true);
    try {
      const { error } = await supabase.functions.invoke('totp', {
        body: { action: 'disable' }
      });

      if (error) throw error;

      setShowDisable2FADialog(false);
      setVerificationCode('');
      refetch2FA();

      toast({
        title: "2FA desativado",
        description: "Sua conta agora usa apenas senha para login.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Erro ao desativar 2FA",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Send notification
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (profileData?.email) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'password_changed',
            email: profileData.email,
            name: profileData.full_name || 'Cliente',
          }
        });
      }

      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua nova senha já está ativa.",
      });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : "Tente novamente mais tarde.";
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className={isPremium ? 'bg-gradient-to-br from-card via-card to-primary/5 border-primary/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isPremium ? 'bg-gradient-primary bg-clip-text text-transparent' : ''}>
                Informações Pessoais
              </CardTitle>
              <CardDescription>Gerencie seus dados pessoais</CardDescription>
            </div>
            {isPremium && (
              <Badge className="bg-gradient-primary text-white gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className={isPremium ? "premium-avatar-frame" : "relative"}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              {isPremium && (
                <div className="absolute -top-1 -right-1 bg-gradient-premium rounded-full p-1.5 shadow-lg z-10">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={isPremium 
                  ? "image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  : "image/jpeg,image/jpg,image/png,image/webp"
                }
                onChange={uploadAvatar}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={isPremium ? 'border-primary/50 hover:border-primary' : ''}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Alterar Foto
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isPremium 
                  ? "JPG, PNG, GIF ou WEBP. Máx 5MB."
                  : "JPG, PNG ou WEBP. Máx 5MB. GIFs exclusivos Premium."
                }
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  defaultValue={profile?.full_name || ''}
                  placeholder="Seu nome completo"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>
            </div>
            
            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (SMS/WhatsApp)
              </Label>
              <PhoneInput
                value={profile?.phone_number || phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Usado para notificações via SMS e WhatsApp
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="income">Renda Mensal</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="income"
                    type="number"
                    className="pl-9"
                    placeholder="0.00"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Banco Principal</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bank"
                    className="pl-9"
                    placeholder="Nome do banco"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button className="bg-gradient-primary">
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contas Vinculadas - Em breve */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Contas Vinculadas</CardTitle>
            <Badge variant="secondary" className="animate-pulse">
              <Clock className="mr-1 h-3 w-3" />
              Em breve
            </Badge>
          </div>
          <CardDescription>Conecte suas contas bancárias e cartões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-muted/30 rounded-lg border border-dashed text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              A funcionalidade de vincular contas bancárias e cartões estará disponível em breve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Gerencie a segurança da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Senha</p>
                <p className="text-sm text-muted-foreground">
                  Altere sua senha de acesso
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Alterar
            </Button>
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${is2FAEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Lock className={`h-5 w-5 ${is2FAEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Autenticação em Duas Etapas (2FA)</p>
                  {is2FAEnabled ? (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled 
                    ? "Compatível com Google Authenticator e Microsoft Authenticator"
                    : "Adicione uma camada extra de segurança à sua conta"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={is2FAEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  setShow2FADialog(true);
                  setTwoFAStep('setup');
                } else {
                  setShowDisable2FADialog(true);
                }
              }}
            />
          </div>

          {/* Backup Codes Info */}
          {is2FAEnabled && user2FA?.backup_codes && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Códigos de Backup</p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Você tem {user2FA.backup_codes.length} códigos de backup disponíveis.
                Use-os caso perca acesso ao seu aplicativo de autenticação.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setBackupCodes(user2FA.backup_codes || []);
                  setShowBackupCodes(true);
                }}
              >
                Ver Códigos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enable 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={(open) => {
        setShow2FADialog(open);
        if (!open) {
          setTwoFAStep('setup');
          setVerificationCode('');
          setTotpSecret('');
          setQrCodeUrl('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {twoFAStep === 'setup' && 'Ativar Autenticação 2FA'}
              {twoFAStep === 'qrcode' && 'Escaneie o QR Code'}
              {twoFAStep === 'verify' && 'Verificar Código'}
            </DialogTitle>
            <DialogDescription>
              {twoFAStep === 'setup' && 'Use Google Authenticator, Microsoft Authenticator ou outro app compatível.'}
              {twoFAStep === 'qrcode' && 'Escaneie o código com seu aplicativo de autenticação.'}
              {twoFAStep === 'verify' && 'Digite o código de 6 dígitos do seu aplicativo.'}
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === 'setup' && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Instale Google Authenticator ou Microsoft Authenticator</li>
                  <li>2. Escaneie o QR Code que será exibido</li>
                  <li>3. Digite o código gerado para confirmar</li>
                  <li>4. Guarde os códigos de backup</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Shield className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Após ativar, você precisará do código do app para fazer login.
                </p>
              </div>
            </div>
          )}

          {twoFAStep === 'qrcode' && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code para 2FA" 
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Não consegue escanear? Use o código manual:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-2 bg-muted rounded font-mono text-sm">
                    {totpSecret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(totpSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setTwoFAStep('verify')}
              >
                Próximo
              </Button>
            </div>
          )}

          {twoFAStep === 'verify' && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Digite o código de 6 dígitos exibido no seu aplicativo
              </p>
            </div>
          )}

          <DialogFooter>
            {twoFAStep === 'setup' && (
              <>
                <Button variant="outline" onClick={() => setShow2FADialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStart2FASetup} disabled={isEnabling2FA}>
                  {isEnabling2FA ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
              </>
            )}
            {twoFAStep === 'qrcode' && (
              <Button variant="outline" onClick={() => setTwoFAStep('setup')}>
                Voltar
              </Button>
            )}
            {twoFAStep === 'verify' && (
              <>
                <Button variant="outline" onClick={() => setTwoFAStep('qrcode')}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleVerify2FASetup} 
                  disabled={isEnabling2FA || verificationCode.length !== 6}
                >
                  {isEnabling2FA ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Ativar 2FA"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Desativar 2FA
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar a autenticação em duas etapas? Sua conta ficará menos segura.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              ⚠️ Ao desativar o 2FA, sua conta ficará protegida apenas pela senha. Qualquer pessoa com acesso à sua senha poderá fazer login.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisable2FADialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling2FA}>
              {isDisabling2FA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Códigos de Backup
            </DialogTitle>
            <DialogDescription>
              Guarde estes códigos em um lugar seguro. Cada código pode ser usado apenas uma vez.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {backupCodes.map((code, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg bg-muted font-mono text-center text-lg tracking-wider"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
              ⚠️ Estes códigos não serão exibidos novamente. Copie-os agora!
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'));
                toast({
                  title: "Códigos copiados!",
                  description: "Os códigos foram copiados para a área de transferência.",
                });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Todos
            </Button>
            <Button onClick={() => setShowBackupCodes(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Digite sua nova senha. Ela deve ter no mínimo 8 caracteres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
