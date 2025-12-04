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

  const handleSocialLogin = async (provider: 'google' | 'discord' | 'facebook' | 'azure') => {
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
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
          
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie suas assinaturas com inteligência
          </p>
        </div>

        <Card className="border-border shadow-elegant backdrop-blur-sm animate-scale-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Bem-vindo</CardTitle>
            <CardDescription className="text-sm">Entre na sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin" className="transition-all duration-200">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="transition-all duration-200">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
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
                          <span className="bg-card px-2 text-muted-foreground">Em manutenção</span>
                        </div>
                      </div>

                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Os métodos alternativos de login estão temporariamente em manutenção.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Por favor, use email e senha para fazer login.
                        </p>
                      </div>
                    </form>
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
                      <span className="bg-card px-2 text-muted-foreground">Em manutenção</span>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      Os métodos alternativos de cadastro estão temporariamente em manutenção.
                    </p>
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
