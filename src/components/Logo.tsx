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

  const content = (
    <div className="group cursor-pointer">
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
