import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ChatSession {
  id: string;
  user_id: string;
  support_agent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  is_read: boolean;
  user_id: string | null;
}

export const LiveChatTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch all open chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const { data: sessionsData, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .in("status", ["open", "assigned"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!sessionsData) return [];

      // Fetch profiles separately
      const userIds = sessionsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Merge data
      return sessionsData.map(session => ({
        ...session,
        profiles: profilesData?.find(p => p.id === session.user_id) || null
      })) as ChatSession[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected session
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("session_id", selectedSession)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!selectedSession,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Claim session mutation
  const claimSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ 
          support_agent_id: user?.id,
          status: "assigned"
        })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      toast({
        title: "Conversa atribuída",
        description: "Você está agora responsável por esta conversa.",
      });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      const { error } = await supabase
        .from("support_messages")
        .insert({
          session_id: sessionId,
          message,
          sender_type: "support",
          user_id: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedSession] });
    },
  });

  // Close session mutation
  const closeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ 
          status: "closed",
          closed_at: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedSession(null);
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      toast({
        title: "Conversa encerrada",
        description: "A conversa foi marcada como resolvida.",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedSession || !messageText.trim()) return;
    sendMessage.mutate({ sessionId: selectedSession, message: messageText });
  };

  const handleClaimSession = (sessionId: string) => {
    claimSession.mutate(sessionId);
    setSelectedSession(sessionId);
  };

  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chat ao Vivo - Painel de Atendimento</h1>
          <p className="text-muted-foreground">
            Atenda seus clientes em tempo real
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/support")}
        >
          Ver como Cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Sessions List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversas ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-2 p-4">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      if (session.support_agent_id === user?.id || session.status === "open") {
                        setSelectedSession(session.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSession === session.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">
                        {session.profiles?.full_name || "Usuário Anônimo"}
                      </p>
                      <Badge 
                        variant={session.status === "open" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {session.status === "open" ? "Nova" : "Em atendimento"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.profiles?.email}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(session.created_at).toLocaleString('pt-BR')}
                    </div>
                  </button>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conversa ativa</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedSession ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedSessionData?.profiles?.full_name || "Usuário"}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSessionData?.profiles?.email}
                    </p>
                  </div>
                  {selectedSessionData?.support_agent_id === user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeSession.mutate(selectedSession)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Encerrar
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-550px)] p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_type === "support" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_type === "support"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {messages.length === 0 && selectedSessionData?.status === "open" && (
                      <div className="text-center py-8">
                        <Button
                          onClick={() => handleClaimSession(selectedSession)}
                          className="bg-gradient-primary"
                        >
                          Iniciar Atendimento
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {selectedSessionData?.support_agent_id === user?.id && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
