import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Bug, TrendingUp, ExternalLink, Calendar, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  published_at: string;
  attachment_url: string | null;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  feature: { label: "Novidade", icon: Sparkles, color: "bg-blue-500" },
  fix: { label: "Correção", icon: Bug, color: "bg-red-500" },
  improvement: { label: "Melhoria", icon: TrendingUp, color: "bg-green-500" },
};

export const ChangelogNotification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch unread changelogs
  const { data: unreadChangelogs = [] } = useQuery({
    queryKey: ["unread-changelogs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all published changelogs
      const { data: changelogs, error: changelogsError } = await supabase
        .from("changelog")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (changelogsError) throw changelogsError;

      // Get user's read changelogs
      const { data: reads, error: readsError } = await supabase
        .from("changelog_reads")
        .select("changelog_id")
        .eq("user_id", user.id);

      if (readsError) throw readsError;

      const readIds = new Set(reads?.map(r => r.changelog_id) || []);
      
      // Filter to only unread ones
      return (changelogs || []).filter(c => !readIds.has(c.id)) as ChangelogEntry[];
    },
    enabled: !!user,
  });

  // Mark changelogs as read
  const markAsReadMutation = useMutation({
    mutationFn: async (changelogIds: string[]) => {
      if (!user || changelogIds.length === 0) return;

      const reads = changelogIds.map(id => ({
        user_id: user.id,
        changelog_id: id,
      }));

      const { error } = await supabase
        .from("changelog_reads")
        .upsert(reads, { onConflict: "user_id,changelog_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-changelogs"] });
    },
  });

  // Show dialog when there are unread changelogs
  useEffect(() => {
    if (unreadChangelogs.length > 0) {
      setOpen(true);
    }
  }, [unreadChangelogs]);

  const handleClose = () => {
    // Mark all as read when closing
    const ids = unreadChangelogs.map(c => c.id);
    markAsReadMutation.mutate(ids);
    setOpen(false);
  };

  if (unreadChangelogs.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novidades do Sistema
          </DialogTitle>
          <DialogDescription>
            Confira as últimas atualizações e melhorias
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {unreadChangelogs.map((entry) => {
              const config = typeConfig[entry.type] || typeConfig.improvement;
              const Icon = config.icon;

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.color} text-white flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline">{entry.version}</Badge>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <h4 className="font-semibold">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.published_at), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        {entry.attachment_url && (
                          <a
                            href={entry.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Paperclip className="h-3 w-3" />
                            Ver anexo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Entendi, fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
