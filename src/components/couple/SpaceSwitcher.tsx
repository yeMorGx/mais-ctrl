import { Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  space: "solo" | "couple";
  onChange: (space: "solo" | "couple") => void;
}

export const SpaceSwitcher = ({ space, onChange }: Props) => {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-card/70 p-1 shadow-soft backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onChange("solo")}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          space === "solo"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <User className="h-4 w-4" />
        Meu Espaço
      </button>
      <button
        type="button"
        onClick={() => onChange("couple")}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          space === "couple"
            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Heart className="h-4 w-4 fill-current" />
        +2
      </button>
    </div>
  );
};
