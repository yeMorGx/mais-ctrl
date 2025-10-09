import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, UserPlus } from "lucide-react";

export default function Invite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [inviterName, setInviterName] = useState("");
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  const subscriptionId = searchParams.get("assinatura");
  const fromUserId = searchParams.get("de");
  const token = searchParams.get("token");

  useEffect(() => {
    loadInviteData();
  }, [subscriptionId, fromUserId, token]);

  const loadInviteData = async () => {
    try {
      if (!subscriptionId) {
        toast.error("Convite inválido");
        navigate("/");
        return;
      }

      // Load subscription data
      const { data: subData, error: subError } = await supabase
        .from("shared_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single();

      if (subError) throw subError;
      setSubscription(subData);

      // Load inviter name
      if (fromUserId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", fromUserId)
          .single();
        
        if (profileData?.full_name) {
          setInviterName(profileData.full_name);
        }
      }

      // Check if already accepted
      if (user && token) {
        const { data: inviteData } = await supabase
          .from("invites")
          .select("*")
          .eq("token", token)
          .eq("status", "accepted")
          .maybeSingle();

        if (inviteData) {
          setAlreadyAccepted(true);
        }
      }
    } catch (error) {
      console.error("Error loading invite:", error);
      toast.error("Erro ao carregar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para aceitar o convite");
      navigate("/auth?redirect=/invite?" + searchParams.toString());
      return;
    }

    if (!subscriptionId || !token) {
      toast.error("Convite inválido");
      return;
    }

    setAccepting(true);

    try {
      console.log("[INVITE] Starting invite acceptance process", { subscriptionId, token, userId: user.id });

      // Get user email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) throw new Error("Email não encontrado");

      console.log("[INVITE] User authenticated", { email: authUser.email });

      // Check if user is already a partner
      const { data: existingPartner } = await supabase
        .from("shared_subscription_partners")
        .select("*")
        .eq("shared_subscription_id", subscriptionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPartner) {
        console.log("[INVITE] User is already a partner");
        toast.info("Você já está participando desta assinatura");
        navigate("/dashboard");
        return;
      }

      // Update invite status
      const { error: inviteError } = await supabase
        .from("invites")
        .update({
          to_email: authUser.email,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("token", token)
        .eq("shared_subscription_id", subscriptionId)
        .eq("status", "pending");

      if (inviteError) {
        console.error("[INVITE] Error updating invite:", inviteError);
        throw inviteError;
      }

      console.log("[INVITE] Invite status updated successfully");

      // Get current subscription and partners
      const { data: subData, error: subError } = await supabase
        .from("shared_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single();

      if (subError) {
        console.error("[INVITE] Error fetching subscription:", subError);
        throw subError;
      }

      const { data: currentPartners, error: partnersError } = await supabase
        .from("shared_subscription_partners")
        .select("*")
        .eq("shared_subscription_id", subscriptionId);

      if (partnersError) {
        console.error("[INVITE] Error fetching partners:", partnersError);
        throw partnersError;
      }

      console.log("[INVITE] Current data:", { 
        totalValue: subData.total_value, 
        currentPartnersCount: currentPartners?.length || 0 
      });

      const partnersCount = currentPartners?.length || 0;
      const newValuePerPerson = parseFloat(String(subData.total_value)) / (partnersCount + 1);

      console.log("[INVITE] Calculated new value per person:", newValuePerPerson);

      // Update existing partners values
      if (currentPartners && currentPartners.length > 0) {
        for (const partner of currentPartners) {
          const { error: updateError } = await supabase
            .from("shared_subscription_partners")
            .update({ value: newValuePerPerson })
            .eq("id", partner.id);

          if (updateError) {
            console.error("[INVITE] Error updating partner value:", updateError);
          }
        }
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      console.log("[INVITE] Adding new partner:", {
        user_id: user.id,
        name: profileData?.full_name || "Usuário",
        email: authUser.email,
        value: newValuePerPerson
      });

      // Add new partner
      const { data: newPartner, error: partnerError } = await supabase
        .from("shared_subscription_partners")
        .insert({
          shared_subscription_id: subscriptionId,
          user_id: user.id,
          name: profileData?.full_name || "Usuário",
          email: authUser.email,
          value: newValuePerPerson,
          status: "active",
        })
        .select();

      if (partnerError) {
        console.error("[INVITE] Error adding partner:", partnerError);
        throw partnerError;
      }

      console.log("[INVITE] Partner added successfully:", newPartner);

      toast.success("Convite aceito com sucesso! 🎉");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      console.error("[INVITE] Error accepting invite:", error);
      toast.error(error.message || "Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (alreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Convite já aceito</CardTitle>
            <CardDescription>
              Você já aceitou este convite anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Convite para compartilhar assinatura</CardTitle>
          <CardDescription>
            {inviterName ? (
              <>
                <strong>{inviterName}</strong> te convidou para compartilhar a assinatura{" "}
                <strong>{subscription?.name}</strong>
              </>
            ) : (
              <>Você foi convidado para compartilhar uma assinatura</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assinatura:</span>
                <span className="font-medium">{subscription.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total:</span>
                <span className="font-medium">
                  R$ {parseFloat(subscription.total_value || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequência:</span>
                <span className="font-medium">{subscription.frequency}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="w-full"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aceitando...
              </>
            ) : (
              "Aceitar convite"
            )}
          </Button>

          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Você precisa estar logado para aceitar este convite
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
