import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
  /** Hide the "MaisCtrl" wordmark and show only the symbol */
  markOnly?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { mark: "h-6 w-6", text: "text-lg", gap: "gap-2" },
  md: { mark: "h-8 w-8", text: "text-2xl", gap: "gap-2.5" },
  lg: { mark: "h-11 w-11", text: "text-3xl", gap: "gap-3" },
  xl: { mark: "h-16 w-16", text: "text-5xl", gap: "gap-4" },
};

export const LogoMark = ({ className = "h-8 w-8" }: { className?: string }) => (
  <img
    src="/assets/logo.svg"
    alt=""
    className={className}
    draggable={false}
  />
);

export const Logo = ({ size = "md", linkTo, markOnly = false, className = "" }: LogoProps) => {
  const s = sizeMap[size];

  const content = (
    <div className={`group inline-flex cursor-pointer items-center ${s.gap} ${className}`}>
      <LogoMark className={`${s.mark} brightness-0 dark:invert transition-transform duration-500 group-hover:rotate-90`} />
      {!markOnly && (
        <span className={`font-display font-bold tracking-tight text-foreground ${s.text}`}>MaisCtrl</span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} aria-label="MaisCtrl">
        {content}
      </Link>
    );
  }

  return content;
};
