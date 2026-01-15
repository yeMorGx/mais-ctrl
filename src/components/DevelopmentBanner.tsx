import { AlertTriangle, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const DevelopmentBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white px-4 py-2.5 relative z-50">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-center">
          <strong>Site em desenvolvimento constante.</strong>{" "}
          Encontrou um bug?{" "}
          <Link 
            to="/dashboard?tab=help" 
            className="underline underline-offset-2 hover:no-underline font-semibold inline-flex items-center gap-1"
          >
            Entre em contato
            <MessageCircle className="w-3.5 h-3.5" />
          </Link>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-white/20 absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
