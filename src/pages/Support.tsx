import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  is_read: boolean;
}

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Fetch or create chat session
  useEffect(() => {
    if (!user) return;

    const fetchOrCreateSession = async () => {
      setIsCreatingSession(true);
      try {
        // Check for existing open session
        const { data: existingSessions, error: fetchError } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["open", "assigned"])
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingSessions && existingSessions.length > 0) {
          setSessionId(existingSessions[0].id);
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from("chat_sessions")
            .insert({
              user_id: user.id,
              status: "open"
            })
            .select()
            .single();

          if (createError) throw createError;
          setSessionId(newSession.id);
        }
      } catch (error) {
        console.error("Error with chat session:", error);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o chat. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsCreatingSession(false);
      }
    };

    fetchOrCreateSession();
  }, [user]);

  // Fetch messages for the session
  const { data: messages = [] } = useQuery({
    queryKey: ["support-messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!sessionId) throw new Error("No active session");
      
      const { error } = await supabase
        .from("support_messages")
        .insert({
          session_id: sessionId,
          message,
          sender_type: "user",
          user_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["support-messages", sessionId] });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(messageText);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Faça login para acessar o suporte
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Suporte ao Cliente</h1>
          <p className="text-muted-foreground">
            Envie suas dúvidas e nossa equipe responderá em breve
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Card */}
          <Card className="lg:col-span-2 h-[calc(100vh-300px)]">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat ao Vivo
              </CardTitle>
              {isCreatingSession && (
                <Badge variant="secondary" className="ml-auto">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Conectando...
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && !isCreatingSession && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        Bem-vindo ao Suporte!
                      </p>
                      <p className="text-sm">
                        Envie uma mensagem para iniciar a conversa
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.sender_type === "support" && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            Equipe de Suporte
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] resize-none"
                    disabled={isCreatingSession}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isCreatingSession}
                    className="bg-gradient-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pressione Enter para enviar, Shift+Enter para nova linha
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horário de Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segunda - Sexta</span>
                  <span className="font-medium">9h - 18h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sábado</span>
                  <span className="font-medium">9h - 13h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domingo</span>
                  <span className="font-medium">Fechado</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dúvidas Frequentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Como adicionar assinaturas?</p>
                  <p className="text-muted-foreground">
                    Clique em "Nova assinatura" no dashboard
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Como cancelar meu plano?</p>
                  <p className="text-muted-foreground">
                    Acesse Configurações → Meu Plano
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Exportar relatórios</p>
                  <p className="text-muted-foreground">
                    Disponível no plano Premium
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-sm text-center mb-4">
                  💡 <strong>Dica:</strong> Descreva seu problema com detalhes para um atendimento mais rápido!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
