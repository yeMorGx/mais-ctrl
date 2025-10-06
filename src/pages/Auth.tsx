import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, EyeOff, Check, X, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    if (checks.length) strength += 20;
    if (checks.uppercase) strength += 20;
    if (checks.lowercase) strength += 20;
    if (checks.number) strength += 20;
    if (checks.special) strength += 20;

    return { strength, checks };
  };

  const passwordAnalysis = getPasswordStrength(signUpPassword);
  const isPasswordStrong = passwordAnalysis.strength >= 80;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(false);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const result = await signIn(email, password);
    
    if (!result.error && result.data?.user) {
      // Check if user has 2FA enabled
      const { data: twoFAData } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', result.data.user.id)
        .single();

      if (twoFAData?.is_enabled) {
        setPendingUserId(result.data.user.id);
        setShow2FADialog(true);
        await supabase.auth.signOut();
      }
    } else if (result.error) {
      setLoginError(true);
    }
    
    setIsLoading(false);
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6 || !pendingUserId) {
      toast.error("Por favor, insira o código de 6 dígitos");
      return;
    }

    // In a real implementation, verify the TOTP code here
    // For now, we'll just show a toast
    toast.success("2FA verificado com sucesso!");
    setShow2FADialog(false);
    setTwoFactorCode("");
    setPendingUserId(null);
  };

  const handlePhoneSignIn = async () => {
    if (!phoneNumber) {
      toast.error("Por favor, insira seu número de telefone");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) throw error;

      toast.success("Código enviado para seu telefone");
      setShowPhoneOTP(true);
    } catch (error: any) {
      toast.error("Erro ao enviar código: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (phoneOTP.length !== 6) {
      toast.error("Por favor, insira o código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: phoneOTP,
        type: 'sms',
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Código inválido: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error("A senha não atende aos requisitos mínimos de segurança");
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("signup-name") as string;
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;

    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  const handleSendResetCode = async () => {
    if (!resetEmail) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-reset-code", {
        body: { email: resetEmail },
      });

      if (error) throw error;

      toast.success("Código enviado para seu email");
      setResetStep("code");
    } catch (error: any) {
      console.error("Error sending reset code:", error);
      toast.error("Erro ao enviar código");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (resetCode.length !== 4) {
      toast.error("Por favor, insira o código de 4 dígitos");
      return;
    }

    setResetStep("password");
  };

  const handleResetPassword = async () => {
    const passwordStrength = getPasswordStrength(newPassword);
    
    if (!newPassword || newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (passwordStrength.strength < 80) {
      toast.error("A senha não atende aos requisitos mínimos de segurança");
      return;
    }

    if (newPassword !== confirmResetPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("verify-reset-code", {
        body: {
          email: resetEmail,
          code: resetCode,
          newPassword,
        },
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      setShowForgotPassword(false);
      setResetStep("email");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmResetPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'discord' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(`Erro ao fazer login com ${provider}: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
          
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-muted-foreground">
            Gerencie suas assinaturas com inteligência
          </p>
        </div>

        <Card className="border-border shadow-elegant">
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>Entre na sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={loginMethod === "email" ? "default" : "outline"}
                    onClick={() => setLoginMethod("email")}
                    className="flex-1"
                  >
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === "phone" ? "default" : "outline"}
                    onClick={() => setLoginMethod("phone")}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Telefone
                  </Button>
                </div>

                {loginMethod === "email" ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input 
                        id="signin-email"
                        name="signin-email"
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      <div className="relative">
                        <Input 
                          id="signin-password"
                          name="signin-password"
                          type={showSignInPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                        >
                          {showSignInPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="gradient"
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                    {loginError && (
                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-sm"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Esqueci minha senha
                      </Button>
                    )}
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSocialLogin('discord')}
                        disabled={isLoading}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={isLoading}
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!showPhoneOTP ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone-number">Número de Telefone</Label>
                          <Input 
                            id="phone-number"
                            type="tel" 
                            placeholder="+55 11 99999-9999"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required 
                          />
                        </div>
                        <Button 
                          onClick={handlePhoneSignIn}
                          className="w-full" 
                          variant="gradient"
                          disabled={isLoading}
                        >
                          {isLoading ? "Enviando código..." : "Enviar código SMS"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Código de Verificação</Label>
                          <InputOTP 
                            maxLength={6} 
                            value={phoneOTP}
                            onChange={setPhoneOTP}
                          >
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <Button 
                          onClick={handleVerifyPhoneOTP}
                          className="w-full" 
                          variant="gradient"
                          disabled={isLoading || phoneOTP.length !== 6}
                        >
                          {isLoading ? "Verificando..." : "Verificar código"}
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setShowPhoneOTP(false)}
                          className="w-full"
                        >
                          Voltar
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input 
                      id="signup-name"
                      name="signup-name"
                      type="text" 
                      placeholder="João Silva"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email"
                      name="signup-email"
                      type="email" 
                      placeholder="seu@email.com"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password"
                        name="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        minLength={8}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {signUpPassword && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Força da senha:</span>
                          <span className={`font-medium ${
                            passwordAnalysis.strength >= 80 ? 'text-green-600' :
                            passwordAnalysis.strength >= 60 ? 'text-yellow-600' :
                            'text-destructive'
                          }`}>
                            {passwordAnalysis.strength >= 80 ? 'Forte' :
                             passwordAnalysis.strength >= 60 ? 'Média' :
                             'Fraca'}
                          </span>
                        </div>
                        <Progress value={passwordAnalysis.strength} className="h-1" />
                        
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-2 ${passwordAnalysis.checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordAnalysis.checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>Mínimo 8 caracteres</span>
                          </div>
                          <div className={`flex items-center gap-2 ${passwordAnalysis.checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordAnalysis.checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>Uma letra maiúscula</span>
                          </div>
                          <div className={`flex items-center gap-2 ${passwordAnalysis.checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordAnalysis.checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>Uma letra minúscula</span>
                          </div>
                          <div className={`flex items-center gap-2 ${passwordAnalysis.checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordAnalysis.checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>Um número</span>
                          </div>
                          <div className={`flex items-center gap-2 ${passwordAnalysis.checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordAnalysis.checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>Um caractere especial</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        minLength={8}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && signUpPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">As senhas não coincidem</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="gradient"
                    disabled={isLoading || !isPasswordStrong || signUpPassword !== confirmPassword}
                  >
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('google')}
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('discord')}
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <Link to="/terms" className="text-primary hover:underline">Termos de Serviço</Link>
          {" "}e{" "}
          <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              {resetStep === "email" && "Digite seu email para receber um código de verificação"}
              {resetStep === "code" && "Digite o código de 4 dígitos enviado ao seu email"}
              {resetStep === "password" && "Digite sua nova senha"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetStep === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendResetCode}
                  disabled={isLoading}
                  className="w-full"
                  variant="gradient"
                >
                  {isLoading ? "Enviando..." : "Enviar Código"}
                </Button>
              </>
            )}

            {resetStep === "code" && (
              <>
                <div className="space-y-2">
                  <Label>Código de Verificação</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={resetCode}
                      onChange={setResetCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    O código expira em 10 minutos
                  </p>
                </div>
                <Button
                  onClick={handleVerifyCode}
                  disabled={resetCode.length !== 4}
                  className="w-full"
                  variant="gradient"
                >
                  Verificar Código
                </Button>
                <Button
                  variant="link"
                  onClick={() => setResetStep("email")}
                  className="w-full text-sm"
                >
                  Voltar
                </Button>
              </>
            )}

            {resetStep === "password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres
                  </p>
                </div>
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading || newPassword.length < 8}
                  className="w-full"
                  variant="gradient"
                >
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificação em Duas Etapas</DialogTitle>
            <DialogDescription>
              Digite o código de 6 dígitos do seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <InputOTP 
              maxLength={6} 
              value={twoFactorCode}
              onChange={setTwoFactorCode}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button 
              onClick={handleVerify2FA}
              className="w-full" 
              variant="gradient"
              disabled={twoFactorCode.length !== 6}
            >
              Verificar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
