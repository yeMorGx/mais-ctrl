import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCouple } from "@/hooks/useCouple";
import { CoupleOnboarding } from "./CoupleOnboarding";
import { CoupleDashboard } from "./CoupleDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const CoupleSpace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: couple, isLoading } = useCouple();
  const [params, setParams] = useSearchParams();

  // Accept an invite token if present
  useEffect(() => {
    const token = params.get("couple_token");
    if (!token || !user) return;
    (async () => {
      try {
        const { data: invite, error } = await db
          .from("couple_invites")
          .select("*")
          .eq("token", token)
          .maybeSingle();
        if (error || !invite) throw new Error("Convite inválido");
        if (invite.status !== "pending") throw new Error("Convite já usado ou expirado");
        // Attach partner to couple
        await db.from("couples").update({ partner_id: user.id, status: "active" }).eq("id", invite.couple_id);
        await db.from("couple_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);
        toast({ title: "Você entrou no espaço +2 ❤️" });
        params.delete("couple_token"); setParams(params, { replace: true });
        qc.invalidateQueries({ queryKey: ["couple"] });
      } catch (e) {
        toast({ title: "Não foi possível aceitar", description: e instanceof Error ? e.message : "", variant: "destructive" });
        params.delete("couple_token"); setParams(params, { replace: true });
      }
    })();
  }, [params, user, toast, qc, setParams]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!couple || couple.status !== "active") {
    return <CoupleOnboarding couple={couple ?? null} />;
  }
  return <CoupleDashboard couple={couple} />;
};
