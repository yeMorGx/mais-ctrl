import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface InvitesListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  subscriptionName: string;
}

export const InvitesListDialog = ({
  open,
  onOpenChange,
  subscriptionId,
  subscriptionName,
}: InvitesListDialogProps) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && subscriptionId) {
      loadInvites();
    }
  }, [open, subscriptionId]);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("shared_subscription_id", subscriptionId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error loading invites:", error);
      toast.error("Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm("Deseja realmente excluir este convite?")) return;

    try {
      const { error } = await supabase
        .from("invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Convite excluído");
      loadInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Erro ao excluir convite");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceito
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convites Enviados</DialogTitle>
          <DialogDescription>
            Gerencie os convites da assinatura <strong>{subscriptionName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum convite enviado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(invite.status)}
                    {invite.to_email && (
                      <span className="text-sm font-medium">{invite.to_email}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enviado em {format(new Date(invite.sent_at), "dd/MM/yyyy 'às' HH:mm")}
                    {invite.accepted_at && (
                      <> • Aceito em {format(new Date(invite.accepted_at), "dd/MM/yyyy")}</>
                    )}
                  </div>
                </div>
                {invite.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteInvite(invite.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
