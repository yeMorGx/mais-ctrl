import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCoupleList, logCoupleActivity, brl } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
type Asset = { id: string; category: string; name: string; value: number };

const CATS = { dinheiro: "Dinheiro", investimento: "Investimentos", veiculo: "Veículos", imovel: "Imóveis", eletronico: "Eletrônicos", outro: "Outros" };

interface Props { coupleId: string; }

export const AssetsSection = ({ coupleId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: assets = [], isLoading } = useCoupleList<Asset>("couple_assets", coupleId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "dinheiro", name: "", value: "" });

  const save = async () => {
    if (!user) return;
    await db.from("couple_assets").insert({ couple_id: coupleId, created_by: user.id, category: form.category, name: form.name, value: Number(form.value) });
    await logCoupleActivity(coupleId, user.id, "adicionou patrimônio", "asset", undefined, { name: form.name });
    qc.invalidateQueries({ queryKey: ["couple_assets", coupleId] });
    setOpen(false); setForm({ category: "dinheiro", name: "", value: "" });
  };
  const remove = async (id: string) => { await db.from("couple_assets").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["couple_assets", coupleId] }); };

  const grouped = Object.entries(CATS).map(([k, label]) => ({ key: k, label, items: assets.filter((a) => a.category === k) }));

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Nosso patrimônio</CardTitle><CardDescription>Tudo que possuímos como casal</CardDescription></div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : assets.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nada por aqui ainda.</p>
        : <div className="space-y-4">
            {grouped.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.key}>
                <p className="mb-2 text-sm font-medium text-muted-foreground">{g.label}</p>
                <div className="space-y-2">
                  {g.items.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-3">
                      <span>{a.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{brl(Number(a.value))}</span>
                        <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo item de patrimônio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CATS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Valor</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={!form.name || !form.value}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
