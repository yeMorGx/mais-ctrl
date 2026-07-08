import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Loose typing — couple_* tables are new and not yet in generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type Couple = {
  id: string;
  owner_id: string;
  partner_id: string | null;
  couple_name: string | null;
  status: "pending" | "active" | "archived";
  started_at: string;
  created_at: string;
  updated_at: string;
};

export const useCouple = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["couple", user?.id],
    queryFn: async (): Promise<Couple | null> => {
      if (!user) return null;
      const { data } = await db
        .from("couples")
        .select("*")
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as Couple) ?? null;
    },
    enabled: !!user,
  });
};

export const useCoupleCreate = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupleName: string) => {
      if (!user) throw new Error("Sem sessão");
      const { data, error } = await db
        .from("couples")
        .insert({ owner_id: user.id, couple_name: coupleName, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data as Couple;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["couple"] }),
  });
};

export const useCoupleList = <T,>(
  table: string,
  coupleId: string | undefined,
  order: { column: string; ascending?: boolean } = { column: "created_at", ascending: false },
) =>
  useQuery({
    queryKey: [table, coupleId],
    queryFn: async (): Promise<T[]> => {
      if (!coupleId) return [];
      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("couple_id", coupleId)
        .order(order.column, { ascending: order.ascending ?? false });
      if (error) throw error;
      return (data as T[]) ?? [];
    },
    enabled: !!coupleId,
  });

export const logCoupleActivity = async (
  coupleId: string,
  actorId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) => {
  try {
    await db.from("couple_activities").insert({
      couple_id: coupleId,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (e) {
    console.warn("logCoupleActivity failed", e);
  }
};

export const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 sun .. 6 sat
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
