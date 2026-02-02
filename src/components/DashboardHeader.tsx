import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { LogOut, User, Settings, Crown, Users, Globe, MessageSquare, Activity, HelpCircle, Share2, Shield, Wallet } from "lucide-react";
import { useAffiliate } from "@/hooks/useAffiliate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { affiliate } = useAffiliate();
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";
  const isOwner = user?.id === OWNER_ID;

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(r => r.role);
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
  const isAdmin = userRoles.includes("admin");
  const hasAdminAccess = isOwner || isAdmin;

  // Debug logs
  console.log("🔍 DEBUG Header - User ID:", user?.id);
  console.log("🔍 DEBUG Header - Owner ID:", OWNER_ID);
  console.log("🔍 DEBUG Header - Is Owner:", isOwner);
  console.log("🔍 DEBUG Header - User Roles:", userRoles);
  console.log("🔍 DEBUG Header - Is Admin:", isAdmin);
  console.log("🔍 DEBUG Header - Has Admin Access:", hasAdminAccess);
  console.log("🔍 DEBUG Header - Is Premium:", isPremium);
  
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Logo />
          
          <div className="flex items-center gap-3">
            {/* User Avatar Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-10 w-10 p-0 hover:ring-2 hover:ring-primary/20 transition-all"
                  >
                    <Avatar className={`h-10 w-10 ${isPremium ? 'ring-2 ring-primary shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-glow-pulse' : ''}`}>
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 bg-card shadow-lg z-50">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className={`h-12 w-12 ${isPremium ? 'ring-2 ring-primary shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-glow-pulse' : ''}`}>
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {profile?.full_name || "Usuário"}
                          </p>
                          {isPremium && (
                            <Badge className="bg-gradient-primary text-white text-[10px] px-1.5 py-0">
                              <Crown className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {hasAdminAccess && (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                          ADMINISTRAÇÃO
                        </DropdownMenuLabel>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate("/admin")}
                          className="cursor-pointer hover:bg-primary/10"
                        >
                          <Shield className="h-4 w-4 mr-2 text-primary" />
                          Painel Admin
                        </DropdownMenuItem>
                        
                        {isOwner && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => navigate("/dashboard?tab=team")}
                              className="cursor-pointer hover:bg-primary/10"
                            >
                              <Users className="h-4 w-4 mr-2 text-primary" />
                              Gerenciar Equipe
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => navigate("/dashboard?tab=site-management")}
                              className="cursor-pointer hover:bg-primary/10"
                            >
                              <Globe className="h-4 w-4 mr-2 text-secondary" />
                              Gerenciar Site
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => navigate("/dashboard?tab=live-chat")}
                          className="cursor-pointer hover:bg-primary/10"
                        >
                          <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                          Chat ao Vivo
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate("/dashboard?tab=support-admin")}
                          className="cursor-pointer hover:bg-primary/10"
                        >
                          <Activity className="h-4 w-4 mr-2 text-green-500" />
                          Suporte Admin
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=profile")}
                      className="cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=share")}
                      className="cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      +Share
                    </DropdownMenuItem>
                    
                    {affiliate && (
                      <DropdownMenuItem 
                        onClick={() => navigate("/affiliate")}
                        className="cursor-pointer"
                      >
                        <Wallet className="h-4 w-4 mr-2 text-primary" />
                        Painel Afiliado
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=help")}
                      className="cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Ajuda
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
