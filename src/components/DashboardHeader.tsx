import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, User, Settings, Crown, Users, Globe, MessageSquare, Activity, HelpCircle, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const OWNER_ID = "0aa7f072-7169-48f3-9389-170100fb2418";
  const isOwner = user?.id === OWNER_ID;

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

  const isAdmin = userRoles.includes("admin");
  const hasAdminAccess = isOwner || isAdmin;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Logo />
          
          <div className="flex items-center gap-3">
            {/* Admin Dropdown - Only for Owner and Admins */}
            {hasAdminAccess && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-primary/50 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 shadow-sm"
                  >
                    <Crown className="h-4 w-4 mr-2 text-primary" />
                    <span className="hidden sm:inline">Admin</span>
                    <Badge variant="secondary" className="ml-2 hidden md:inline-flex">
                      {isOwner ? "Dono" : "Admin"}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-72 bg-card border-2 border-primary/20 shadow-xl z-50"
                >
                  <DropdownMenuLabel className="flex items-center gap-2 py-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold bg-gradient-primary bg-clip-text text-transparent">
                        Painel Administrativo
                      </p>
                      <p className="text-xs text-muted-foreground font-normal">
                        Ferramentas de gestão
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuGroup>
                    {isOwner && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => navigate("/dashboard?tab=team")}
                          className="cursor-pointer hover:bg-primary/10 py-3"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-3">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Gerenciar Equipe</p>
                            <p className="text-xs text-muted-foreground">Usuários e cargos</p>
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate("/dashboard?tab=site-management")}
                          className="cursor-pointer hover:bg-primary/10 py-3"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 mr-3">
                            <Globe className="h-4 w-4 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Gerenciar Site</p>
                            <p className="text-xs text-muted-foreground">Configurações gerais</p>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=live-chat")}
                      className="cursor-pointer hover:bg-primary/10 py-3"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 mr-3">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Chat ao Vivo</p>
                        <p className="text-xs text-muted-foreground">Atendimento em tempo real</p>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard?tab=support-admin")}
                      className="cursor-pointer hover:bg-primary/10 py-3"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 mr-3">
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Suporte Admin</p>
                        <p className="text-xs text-muted-foreground">Tickets e contatos</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  <div className="px-2 py-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status do Sistema</span>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        ● Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seu Cargo</span>
                      <Badge 
                        variant={isOwner ? "destructive" : "default"}
                        className="font-bold"
                      >
                        {isOwner ? "👑 Proprietário" : "🛡️ Administrador"}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />

            {/* User Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card shadow-lg z-50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">Minha Conta</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
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
