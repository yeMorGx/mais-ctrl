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
        const { error } = await db.rpc("accept_couple_invite", { _token: token });
        if (error) throw error;
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
