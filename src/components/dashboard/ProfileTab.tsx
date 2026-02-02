import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload, Loader2, Mail, DollarSign, Building2, Crown, Clock, Shield, Key, Phone } from "lucide-react";
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

export const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password States
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
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
        </CardContent>
      </Card>

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
