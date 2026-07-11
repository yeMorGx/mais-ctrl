import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CoupleMember = { id: string; full_name: string | null; avatar_url: string | null };

export const useCoupleMembers = (ownerId?: string, partnerId?: string | null) => {
  const ids = [ownerId, partnerId].filter(Boolean) as string[];
  return useQuery({
    queryKey: ["couple-members-lookup", ids.sort().join(",")],
    queryFn: async (): Promise<CoupleMember[]> => {
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      return (data as CoupleMember[]) || [];
    },
    enabled: ids.length > 0,
  });
};

export const memberFirstName = (m?: CoupleMember | null) =>
  m?.full_name?.split(" ")[0] || "Membro";
