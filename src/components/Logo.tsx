import { Command } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
}

export const Logo = ({ size = "md", linkTo }: LogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl"
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16"
  };

  const content = (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="bg-gradient-primary rounded-xl p-2 flex items-center justify-center transition-transform group-hover:scale-110 shadow-glow">
        <Command className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <div className={`bg-gradient-primary bg-clip-text text-transparent font-black ${sizeClasses[size]} transition-transform group-hover:scale-105`}>
        +Ctrl
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};
