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
        .select(`
          *,
          shared_subscription_partners(*)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (ownedError) throw ownedError;

      // Buscar assinaturas compartilhadas onde o usuário é parceiro
      const { data: partnerSubs, error: partnerError } = await supabase
        .from("shared_subscription_partners")
        .select(`
          *,
          shared_subscriptions(*)
        `)
        .eq("user_id", user.id);

      if (partnerError) throw partnerError;

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
      if (partnerSubs) {
        combined.push(...partnerSubs.map(partner => ({
          id: `partner-${partner.id}`,
          name: partner.shared_subscriptions.name,
          value: Number(partner.value), // Valor que o parceiro paga
          frequency: partner.shared_subscriptions.frequency,
          payment_method: partner.shared_subscriptions.payment_method,
          renewal_date: partner.shared_subscriptions.renewal_date,
          is_shared: true,
          total_value: Number(partner.shared_subscriptions.total_value)
        })));
      }

      return combined;
    },
    enabled: !!user,
  });
};
