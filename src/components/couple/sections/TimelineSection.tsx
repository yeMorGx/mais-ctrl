import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoupleList } from "@/hooks/useCouple";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props { coupleId: string; }
type Activ = { id: string; actor_id: string; action: string; entity_type: string | null; metadata: Record<string, unknown>; created_at: string };

export const TimelineSection = ({ coupleId }: Props) => {
  const { data: items = [], isLoading } = useCoupleList<Activ>("couple_activities", coupleId, { column: "created_at", ascending: false });

  const actorIds = Array.from(new Set(items.map((i) => i.actor_id)));
  const { data: profiles = [] } = useQuery({
    queryKey: ["couple-profiles", actorIds.sort().join(",")],
    queryFn: async () => {
      if (!actorIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", actorIds);
      return data || [];
    },
    enabled: actorIds.length > 0,
  });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Nossa timeline</CardTitle>
        <CardDescription>Tudo que aconteceu no espaço</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Sem atividades ainda.</p>
        : <div className="space-y-3">
            {items.slice(0, 50).map((a) => {
              const p = profileMap.get(a.actor_id);
              const name = p?.full_name || "Alguém";
              const meta = a.metadata as { name?: string; amount?: number };
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border bg-card/50 p-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={p?.avatar_url || undefined} /><AvatarFallback>{name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="text-sm"><strong>{name}</strong> {a.action}{meta?.name ? ` "${meta.name}"` : ""}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              );
            })}
          </div>}
      </CardContent>
    </Card>
  );
};
