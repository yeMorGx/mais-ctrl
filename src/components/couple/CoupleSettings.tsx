import { useState } from "react";
import { Settings, Loader2, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Couple } from "@/hooks/useCouple";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Props { couple: Couple; }

export const CoupleSettings = ({ couple }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(couple.couple_name || "");
  const [startedAt, setStartedAt] = useState((couple.started_at || "").slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const isOwner = user?.id === couple.owner_id;

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await db.from("couples").update({ couple_name: name, started_at: startedAt || null }).eq("id", couple.id);
      if (error) throw error;
      toast({ title: "Configurações salvas" });
      qc.invalidateQueries({ queryKey: ["couple"] });
      setOpen(false);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const dissolve = async () => {
    setDissolving(true);
    try {
      // Owner: delete entire couple (cascades to related tables)
      // Partner: just leave the couple
      if (isOwner) {
        const { error } = await db.from("couples").delete().eq("id", couple.id);
        if (error) throw error;
        toast({ title: "Espaço +2 desfeito" });
      } else {
        const { error } = await db.from("couples").update({ partner_id: null, status: "pending" }).eq("id", couple.id);
        if (error) throw error;
        toast({ title: "Você saiu do espaço +2" });
      }
      qc.invalidateQueries({ queryKey: ["couple"] });
      setOpen(false);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setDissolving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações do +2</DialogTitle>
          <DialogDescription>Personalize o espaço compartilhado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do espaço</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: João & Maria" disabled={!isOwner} />
            {!isOwner && <p className="mt-1 text-xs text-muted-foreground">Apenas o criador do espaço pode alterar o nome.</p>}
          </div>
          <div>
            <Label>Data de início</Label>
            <Input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="mb-1 text-sm font-semibold text-destructive">
              {isOwner ? "Desfazer o par" : "Sair do espaço"}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {isOwner
                ? "Isso vai apagar o espaço +2 e todos os dados compartilhados (receitas, despesas, sonhos, timeline...). Ação irreversível."
                : "Você vai deixar de fazer parte deste espaço. O criador poderá convidar outra pessoa depois."}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {isOwner ? <><Trash2 className="mr-1 h-4 w-4" /> Desfazer par</> : <><LogOut className="mr-1 h-4 w-4" /> Sair do +2</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isOwner
                      ? "Todos os dados do espaço +2 serão apagados permanentemente."
                      : "Você sairá deste espaço +2. Poderá ser convidado(a) novamente pelo criador."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={dissolve} disabled={dissolving} className="bg-destructive hover:bg-destructive/90">
                    {dissolving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          <Button onClick={save} disabled={saving || !isOwner}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
