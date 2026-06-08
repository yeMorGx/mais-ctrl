import { Link } from "react-router-dom";
import zuluLogo from "@/assets/zulu-logo.svg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
}

export const Logo = ({ size = "md", linkTo }: LogoProps) => {
  const sizeClasses = {
    sm: "h-5",
    md: "h-7",
    lg: "h-10",
    xl: "h-16",
  };

  const content = (
    <div className="group inline-flex cursor-pointer items-center">
      <img
        src={zuluLogo}
        alt="ZULU"
        className={`${sizeClasses[size]} w-auto transition-transform duration-300 group-hover:scale-105 dark:invert-0 invert`}
        draggable={false}
      />
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} aria-label="ZULU">{content}</Link>;
  }

  return content;
};
