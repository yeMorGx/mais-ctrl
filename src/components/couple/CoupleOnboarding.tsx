import { useState } from "react";
import { Heart, Copy, Mail, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCoupleCreate, type Couple } from "@/hooks/useCouple";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Props {
  couple: Couple | null;
}

export const CoupleOnboarding = ({ couple }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const create = useCoupleCreate();
  const [coupleName, setCoupleName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: invite } = useQuery({
    queryKey: ["couple-invite", couple?.id],
    queryFn: async () => {
      if (!couple) return null;
      const { data } = await db
        .from("couple_invites")
        .select("*")
        .eq("couple_id", couple.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!couple,
  });

  const sendInvite = async () => {
    if (!couple || !user) return;
    if (!inviteeEmail.includes("@")) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await db
        .from("couple_invites")
        .insert({
          couple_id: couple.id,
          sender_id: user.id,
          invitee_email: inviteeEmail.trim().toLowerCase(),
        })
        .select()
        .single();
      if (error) throw error;
      // Fire-and-forget e-mail via existing function (best-effort)
      const link = `${window.location.origin}/dashboard?space=couple&couple_token=${data.token}`;
      try {
        const { error: fnError } = await supabase.functions.invoke("send-couple-invite", {
          body: {
            email: inviteeEmail.trim().toLowerCase(),
            link,
            couple_name: couple.couple_name,
            sender_name: user.email,
          },
        });
        if (fnError) throw fnError;
      } catch (e) {
        console.warn("Invite email failed", e);
        toast({
          title: "Convite criado, mas o e-mail falhou",
          description: "Compartilhe o link manualmente com seu par.",
        });
      }
      qc.invalidateQueries({ queryKey: ["couple-invite", couple.id] });
      toast({ title: "Convite enviado ❤️", description: "Compartilhe o link com seu par." });
      setInviteeEmail("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tente novamente";
      toast({ title: "Erro ao enviar", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const inviteLink = invite
    ? `${window.location.origin}/dashboard?space=couple&couple_token=${invite.token}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!couple) {
    return (
      <Card className="mx-auto max-w-xl animate-fade-in border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
            <Heart className="h-7 w-7 fill-white text-white" />
          </div>
          <CardTitle className="text-2xl">Crie seu espaço +2</CardTitle>
          <CardDescription>Mais controle para dois — organize as finanças com quem você ama.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do casal</Label>
            <Input
              placeholder="Ex.: Gabriel & Maria"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
            />
          </div>
          <Button
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90"
            disabled={!coupleName.trim() || create.isPending}
            onClick={() => create.mutate(coupleName.trim())}
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Começar"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Couple exists, but pending partner
  if (couple.status === "pending") {
    return (
      <Card className="mx-auto max-w-xl animate-fade-in border-rose-500/20">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <CardTitle>Convide seu par</CardTitle>
          </div>
          <CardDescription>
            O espaço <strong>{couple.couple_name}</strong> está aguardando alguém para completar. Envie o convite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail do parceiro(a)</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="par@exemplo.com"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
              />
              <Button onClick={sendInvite} disabled={sending} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {invite && (
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <Label className="text-xs text-muted-foreground">Ou compartilhe o link direto:</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Enquanto aguarda, você já pode começar a cadastrar seus dados — tudo será compartilhado assim que aceito.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
