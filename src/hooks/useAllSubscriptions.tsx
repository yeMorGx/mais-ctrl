import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CombinedSubscription {
  id: string;
  name: string;
  value: number;
  frequency: string;
  payment_method: string;
  renewal_date: string;
  is_shared?: boolean;
  total_value?: number;
}

export const useAllSubscriptions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Buscar assinaturas normais
      const { data: normalSubs, error: normalError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (normalError) throw normalError;

      // Buscar assinaturas compartilhadas onde o usuário é dono
      const { data: ownedShared, error: ownedError } = await supabase
        .from("shared_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (ownedError) {
        console.error('Error fetching owned shared subs:', ownedError);
      }

      // Buscar parceiros das assinaturas compartilhadas
      const { data: partners, error: partnersError } = await supabase
        .from("shared_subscription_partners")
        .select("*")
        .in("shared_subscription_id", ownedShared?.map(s => s.id) || []);

      if (partnersError) {
        console.error('Error fetching partners:', partnersError);
      }

      // Buscar assinaturas compartilhadas onde o usuário é parceiro
      const { data: partnerLinks, error: partnerError } = await supabase
        .from("shared_subscription_partners")
        .select("*")
        .eq("user_id", user.id);

      if (partnerError) {
        console.error('Error fetching partner links:', partnerError);
      }

      // Buscar detalhes das assinaturas compartilhadas onde é parceiro
      const { data: partnerSharedSubs, error: partnerSharedError } = await supabase
        .from("shared_subscriptions")
        .select("*")
        .in("id", partnerLinks?.map(p => p.shared_subscription_id) || []);

      if (partnerSharedError) {
        console.error('Error fetching partner shared subs:', partnerSharedError);
      }

      const combined: CombinedSubscription[] = [];

      // Adicionar assinaturas normais
      if (normalSubs) {
        combined.push(...normalSubs.map(sub => ({
          id: sub.id,
          name: sub.name,
          value: Number(sub.value),
          frequency: sub.frequency,
          payment_method: sub.payment_method,
          renewal_date: sub.renewal_date,
          is_shared: false
        })));
      }

      // Adicionar assinaturas compartilhadas onde é dono (valor = 0, pois dono não paga)
      if (ownedShared) {
        combined.push(...ownedShared.map(sub => ({
          id: `shared-${sub.id}`,
          name: sub.name,
          value: 0, // Dono não paga
          frequency: sub.frequency,
          payment_method: sub.payment_method,
          renewal_date: sub.renewal_date,
          is_shared: true,
          total_value: Number(sub.total_value)
        })));
      }

      // Adicionar assinaturas compartilhadas onde é parceiro (valor = o que ele paga)
      if (partnerLinks && partnerSharedSubs) {
        combined.push(...partnerLinks.map(partner => {
          const sharedSub = partnerSharedSubs.find(s => s.id === partner.shared_subscription_id);
          if (!sharedSub) return null;
          
          return {
            id: `partner-${partner.id}`,
            name: sharedSub.name,
            value: Number(partner.value), // Valor que o parceiro paga
            frequency: sharedSub.frequency,
            payment_method: sharedSub.payment_method,
            renewal_date: sharedSub.renewal_date,
            is_shared: true,
            total_value: Number(sharedSub.total_value)
          };
        }).filter(Boolean) as CombinedSubscription[]);
      }

      return combined;
    },
    enabled: !!user,
  });
};
