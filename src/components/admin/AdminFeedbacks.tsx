import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, RefreshCw, Smile, Frown, Meh, ThumbsUp, ThumbsDown, Globe } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  id: string;
  user_id: string | null;
  emoji: string;
  page: string;
  feature: string | null;
  comment: string | null;
  created_at: string;
  show_on_landing: boolean;
}

const emojiLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "😍": { label: "Adorei", icon: ThumbsUp, color: "text-green-500" },
  "😊": { label: "Bom", icon: Smile, color: "text-emerald-500" },
  "😐": { label: "Ok", icon: Meh, color: "text-yellow-500" },
  "😕": { label: "Não gostei", icon: Frown, color: "text-orange-500" },
  "😢": { label: "Muito ruim", icon: ThumbsDown, color: "text-red-500" },
};

export const AdminFeedbacks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [emojiFilter, setEmojiFilter] = useState<string>("all");
  const [pageFilter, setPageFilter] = useState<string>("all");

  const { data: feedbacks = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });

  const toggleLandingMutation = useMutation({
    mutationFn: async ({ id, show }: { id: string; show: boolean }) => {
      const { error } = await supabase
        .from("user_feedback")
        .update({ show_on_landing: show })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
      toast({
        title: "Feedback atualizado!",
        description: "A visibilidade na landing page foi alterada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get unique pages for filter
  const uniquePages = [...new Set(feedbacks.map(f => f.page))];

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feature?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmoji = emojiFilter === "all" || feedback.emoji === emojiFilter;
    const matchesPage = pageFilter === "all" || feedback.page === pageFilter;

    return matchesSearch && matchesEmoji && matchesPage;
  });

  // Calculate stats
  const emojiStats = feedbacks.reduce((acc, f) => {
    acc[f.emoji] = (acc[f.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFeedbacks = feedbacks.length;
  const positiveCount = (emojiStats["😍"] || 0) + (emojiStats["😊"] || 0);
  const negativeCount = (emojiStats["😕"] || 0) + (emojiStats["😢"] || 0);
  const landingCount = feedbacks.filter(f => f.show_on_landing).length;
  const satisfactionRate = totalFeedbacks > 0 
    ? Math.round((positiveCount / totalFeedbacks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feedbacks dos Usuários</h2>
          <p className="text-muted-foreground">
            Visualize e analise os feedbacks enviados pelos usuários
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedbacks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positivos</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{positiveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negativos</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{negativeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Smile className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{satisfactionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Landing</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{landingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por comentário, página..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={emojiFilter} onValueChange={setEmojiFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por emoji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os emojis</SelectItem>
                <SelectItem value="😍">😍 Adorei</SelectItem>
                <SelectItem value="😊">😊 Bom</SelectItem>
                <SelectItem value="😐">😐 Ok</SelectItem>
                <SelectItem value="😕">😕 Não gostei</SelectItem>
                <SelectItem value="😢">😢 Muito ruim</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as páginas</SelectItem>
                {uniquePages.map(page => (
                  <SelectItem key={page} value={page}>{page}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Feedbacks ({filteredFeedbacks.length})
          </CardTitle>
          <CardDescription>
            Ative o switch para exibir o feedback na landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando feedbacks...
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum feedback encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.map((feedback) => {
                const emojiInfo = emojiLabels[feedback.emoji] || { 
                  label: feedback.emoji, 
                  icon: MessageSquare, 
                  color: "text-muted-foreground" 
                };
                const EmojiIcon = emojiInfo.icon;

                return (
                  <div
                    key={feedback.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="text-3xl">{feedback.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline">{feedback.page}</Badge>
                        {feedback.feature && (
                          <Badge variant="secondary">{feedback.feature}</Badge>
                        )}
                        <span className={`text-sm flex items-center gap-1 ${emojiInfo.color}`}>
                          <EmojiIcon className="h-3 w-3" />
                          {emojiInfo.label}
                        </span>
                        {feedback.show_on_landing && (
                          <Badge className="bg-blue-500 gap-1">
                            <Globe className="h-3 w-3" />
                            Landing Page
                          </Badge>
                        )}
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-foreground mt-2">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(feedback.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {feedback.user_id && (
                          <span className="ml-2">• Usuário autenticado</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Landing</span>
                      <Switch
                        checked={feedback.show_on_landing}
                        onCheckedChange={(checked) => 
                          toggleLandingMutation.mutate({ id: feedback.id, show: checked })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
