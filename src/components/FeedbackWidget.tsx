import { useState } from "react";
import { MessageCircleHeart, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const emojis = [
  { emoji: "😍", label: "Adorei", value: "love" },
  { emoji: "😊", label: "Gostei", value: "like" },
  { emoji: "😐", label: "Neutro", value: "neutral" },
  { emoji: "😕", label: "Confuso", value: "confused" },
  { emoji: "😤", label: "Frustrado", value: "frustrated" },
];

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  const handleSubmit = async () => {
    if (!selectedEmoji) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user?.id || null,
        emoji: selectedEmoji,
        page: location.pathname,
        comment: comment || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Obrigado pelo feedback! 💜",
        description: "Sua opinião nos ajuda a melhorar o +Ctrl.",
      });

      setTimeout(() => {
        setIsOpen(false);
        setSelectedEmoji(null);
        setComment("");
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:scale-110 transition-transform"
          >
            <MessageCircleHeart className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 mr-4" 
          side="top" 
          align="end"
        >
          {submitted ? (
            <div className="p-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-semibold text-lg">Obrigado!</h3>
              <p className="text-muted-foreground text-sm">
                Seu feedback foi enviado com sucesso.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Como está sua experiência?</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu feedback nos ajuda a melhorar!
                </p>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between gap-2">
                  {emojis.map(({ emoji, label, value }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedEmoji(value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-110 ${
                        selectedEmoji === value
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedEmoji && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Textarea
                      placeholder="Quer adicionar mais detalhes? (opcional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar Feedback
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
