import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Sparkles, Bug, TrendingUp, Calendar, Paperclip, Send, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: string;
  published_at: string;
  is_published: boolean | null;
  attachment_url: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  feature: { label: "Novidade", icon: Sparkles, color: "bg-blue-500" },
  fix: { label: "Correção", icon: Bug, color: "bg-red-500" },
  improvement: { label: "Melhoria", icon: TrendingUp, color: "bg-green-500" },
};

export const AdminChangelog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(null);
  
  // Form state
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [isPublished, setIsPublished] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const { data: changelogs = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-changelogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changelog")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as ChangelogEntry[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newEntry: Omit<ChangelogEntry, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("changelog")
        .insert(newEntry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast({
        title: "Changelog criado!",
        description: "A entrada foi publicada com sucesso.",
      });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (entry: Partial<ChangelogEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("changelog")
        .update(entry)
        .eq("id", entry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast({
        title: "Changelog atualizado!",
        description: "As alterações foram salvas.",
      });
      resetForm();
      setShowEditDialog(false);
      setSelectedEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("changelog")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-changelogs"] });
      toast({
        title: "Changelog removido!",
        description: "A entrada foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setVersion("");
    setTitle("");
    setDescription("");
    setType("feature");
    setIsPublished(true);
    setAttachmentUrl("");
  };

  const handleCreate = () => {
    createMutation.mutate({
      version,
      title,
      description,
      type,
      is_published: isPublished,
      attachment_url: attachmentUrl || null,
      published_at: new Date().toISOString(),
    });
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setSelectedEntry(entry);
    setVersion(entry.version);
    setTitle(entry.title);
    setDescription(entry.description);
    setType(entry.type);
    setIsPublished(entry.is_published ?? true);
    setAttachmentUrl(entry.attachment_url || "");
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedEntry) return;
    updateMutation.mutate({
      id: selectedEntry.id,
      version,
      title,
      description,
      type,
      is_published: isPublished,
      attachment_url: attachmentUrl || null,
    });
  };

  const togglePublished = (entry: ChangelogEntry) => {
    updateMutation.mutate({
      id: entry.id,
      is_published: !entry.is_published,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Changelog</h1>
          <p className="text-muted-foreground">Gerencie as atualizações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{changelogs.length}</div>
            <p className="text-sm text-muted-foreground">Total de entradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{changelogs.filter(c => c.is_published).length}</div>
            <p className="text-sm text-muted-foreground">Publicadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{changelogs.filter(c => !c.is_published).length}</div>
            <p className="text-sm text-muted-foreground">Rascunhos</p>
          </CardContent>
        </Card>
      </div>

      {/* Changelog List */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas do Changelog</CardTitle>
          <CardDescription>Clique em uma entrada para editar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : changelogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma entrada encontrada</p>
          ) : (
            <div className="space-y-4">
              {changelogs.map((entry) => {
                const config = typeConfig[entry.type] || typeConfig.improvement;
                const Icon = config.icon;
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{entry.version}</Badge>
                        <Badge className={config.color}>{config.label}</Badge>
                        {!entry.is_published && (
                          <Badge variant="secondary">Rascunho</Badge>
                        )}
                        {entry.attachment_url && (
                          <Badge variant="outline" className="gap-1">
                            <Paperclip className="h-3 w-3" />
                            Anexo
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mt-2">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublished(entry)}
                        title={entry.is_published ? "Ocultar" : "Publicar"}
                      >
                        {entry.is_published ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nova Entrada de Changelog
            </DialogTitle>
            <DialogDescription>
              Crie uma nova atualização para notificar os usuários
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Novidade</SelectItem>
                    <SelectItem value="fix">Correção</SelectItem>
                    <SelectItem value="improvement">Melhoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Título da atualização"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva as mudanças..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">URL do Anexo (opcional)</Label>
              <Input
                id="attachment"
                placeholder="https://..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">Publicar imediatamente</p>
                <p className="text-sm text-muted-foreground">Usuários verão esta atualização</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!version || !title || !description}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Entrada
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do changelog
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-version">Versão</Label>
                <Input
                  id="edit-version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Novidade</SelectItem>
                    <SelectItem value="fix">Correção</SelectItem>
                    <SelectItem value="improvement">Melhoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-attachment">URL do Anexo (opcional)</Label>
              <Input
                id="edit-attachment"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">Publicado</p>
                <p className="text-sm text-muted-foreground">Visível para usuários</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
