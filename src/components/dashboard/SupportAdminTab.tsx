import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Mail, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamManagement } from "./TeamManagement";

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

interface SupportContact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export const SupportAdminTab = () => {
  const [liveChats, setLiveChats] = useState<Record<string, SupportMessage[]>>({});
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLiveChats();
    fetchContacts();

    // Subscribe to new messages
    const channel = supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        () => {
          fetchLiveChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveChats = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Group messages by user_id
    const grouped = data.reduce((acc, msg) => {
      if (!acc[msg.user_id]) {
        acc[msg.user_id] = [];
      }
      acc[msg.user_id].push(msg);
      return acc;
    }, {} as Record<string, SupportMessage[]>);

    setLiveChats(grouped);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    setContacts(data || []);
  };

  const sendMessage = async () => {
    if (!selectedChat || !messageText.trim()) return;

    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: selectedChat,
        message: messageText,
        sender_type: 'support'
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
      return;
    }

    setMessageText("");
    toast({
      title: "Mensagem enviada",
      description: "Sua resposta foi enviada com sucesso"
    });
  };

  const updateContactStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('support_contacts')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
      return;
    }

    fetchContacts();
    toast({
      title: "Status atualizado",
      description: "O status do contato foi atualizado"
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Suporte Admin</h1>
      
      <Tabs defaultValue="live-chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat ao Vivo
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Mail className="h-4 w-4 mr-2" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Equipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-chat" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Chat List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {Object.keys(liveChats).map((userId) => {
                      const messages = liveChats[userId];
                      const lastMessage = messages[messages.length - 1];
                      const unreadCount = messages.filter(m => !m.is_read && m.sender_type === 'user').length;

                      return (
                        <button
                          key={userId}
                          onClick={() => setSelectedChat(userId)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedChat === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">Usuário {userId.slice(0, 8)}</span>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-70 line-clamp-1">{lastMessage.message}</p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedChat ? `Chat com Usuário ${selectedChat.slice(0, 8)}` : 'Selecione uma conversa'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChat ? (
                  <div className="space-y-4">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {liveChats[selectedChat]?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                msg.sender_type === 'support'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua resposta..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="min-h-[60px]"
                      />
                      <Button onClick={sendMessage} size="icon" className="h-[60px]">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[464px] flex items-center justify-center text-muted-foreground">
                    Selecione uma conversa para começar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                  <Badge variant={
                    contact.status === 'resolved' ? 'default' :
                    contact.status === 'in_progress' ? 'secondary' :
                    'destructive'
                  }>
                    {contact.status === 'pending' && 'Pendente'}
                    {contact.status === 'in_progress' && 'Em Andamento'}
                    {contact.status === 'resolved' && 'Resolvido'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-1">Assunto:</p>
                  <p className="text-sm">{contact.subject}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Mensagem:</p>
                  <p className="text-sm text-muted-foreground">{contact.message}</p>
                </div>
                <div className="flex gap-2">
                  {contact.status !== 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateContactStatus(contact.id, 'in_progress')}
                    >
                      Marcar como Em Andamento
                    </Button>
                  )}
                  {contact.status !== 'resolved' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateContactStatus(contact.id, 'resolved')}
                    >
                      Marcar como Resolvido
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {contacts.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">Nenhum contato recebido</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};