import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Bell, 
  Flag, 
  CheckCircle2, 
  Circle,
  Clock,
  Tag,
  Filter
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  category: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  reminder_enabled: boolean;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-green-500", icon: Flag },
  medium: { label: "Média", color: "bg-yellow-500", icon: Flag },
  high: { label: "Alta", color: "bg-red-500", icon: Flag },
};

const defaultCategories = [
  "Trabalho",
  "Pessoal",
  "Finanças",
  "Saúde",
  "Estudos",
  "Casa",
  "Outros",
];

export function TodoList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    due_date: "",
    reminder_enabled: false,
    reminder_date: "",
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("tasks").insert({
        user_id: user?.id,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category || null,
        due_date: data.due_date || null,
        reminder_enabled: data.reminder_enabled,
        reminder_date: data.reminder_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa criada com sucesso!" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from("tasks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa atualizada!" });
      resetForm();
      setEditingTask(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tarefa excluída!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir tarefa", description: error.message, variant: "destructive" });
    },
  });

  const toggleComplete = async (task: Task) => {
    const now = new Date().toISOString();
    await updateMutation.mutateAsync({
      id: task.id,
      completed: !task.completed,
      completed_at: !task.completed ? now : null,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      category: "",
      due_date: "",
      reminder_enabled: false,
      reminder_date: "",
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      due_date: task.due_date || "",
      reminder_enabled: task.reminder_enabled,
      reminder_date: task.reminder_date ? task.reminder_date.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Digite um título para a tarefa", variant: "destructive" });
      return;
    }

    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        category: formData.category || null,
        due_date: formData.due_date || null,
        reminder_enabled: formData.reminder_enabled,
        reminder_date: formData.reminder_date || null,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getDueDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    if (isPast(date)) return "Atrasada";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    const matchesTab = activeTab === "pending" ? !task.completed : task.completed;
    return matchesPriority && matchesCategory && matchesTab;
  });

  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Lista de Tarefas</h2>
          <p className="text-muted-foreground">
            {pendingCount} pendente{pendingCount !== 1 && "s"} • {completedCount} concluída{completedCount !== 1 && "s"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingTask(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Atualize os detalhes da tarefa" : "Adicione uma nova tarefa à sua lista"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Pagar conta de luz"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes adicionais..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="high">🔴 Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="reminder">Ativar lembrete</Label>
                </div>
                <Switch
                  id="reminder"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, reminder_enabled: v })}
                />
              </div>
              {formData.reminder_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="reminder_date">Data do Lembrete</Label>
                  <Input
                    id="reminder_date"
                    type="date"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingTask ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Circle className="h-4 w-4" />
                  Pendentes ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Concluídas ({completedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[130px]">
                    <Tag className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">
                {activeTab === "pending" ? "Nenhuma tarefa pendente" : "Nenhuma tarefa concluída"}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === "pending" ? "Adicione uma nova tarefa para começar!" : "Complete algumas tarefas para vê-las aqui"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-all hover:shadow-sm ${
                    task.completed ? "bg-muted/50 opacity-75" : "bg-card"
                  }`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={`${priorityConfig[task.priority].color} text-white text-xs`}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                      {task.category && (
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                      {task.reminder_enabled && (
                        <Bell className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        <Clock className="h-3 w-3" />
                        <span className={isPast(parseISO(task.due_date)) && !task.completed ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {getDueDateLabel(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
