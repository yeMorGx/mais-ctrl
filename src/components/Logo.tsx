import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
  /** Hide the "+Ctrl" wordmark and show only the symbol */
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
  <svg
    viewBox="0 0 91 91"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M76.6955 90.6591C84.3521 90.7018 90.5931 84.5325 90.6358 76.8796L90.8103 45.5634C65.8481 45.4246 45.5012 65.5367 45.3623 90.4849L76.6955 90.6591Z" />
    <path d="M90.6713 13.9954C90.6713 6.34256 84.4641 0.138611 76.8076 0.138611H45.4744C45.4744 25.0874 65.7109 45.3121 90.6713 45.3121V13.9954Z" />
    <path d="M14.1412 0.0771235C6.48461 0.0345362 0.243613 6.20385 0.200879 13.8568L0.0263672 45.1728C24.9886 45.3116 45.3355 25.1996 45.4744 0.251352L14.1412 0.0771235Z" />
    <path d="M0.165283 76.7408C0.165283 84.3937 6.37245 90.5977 14.029 90.5977H45.3623C45.3623 65.649 25.1275 45.4241 0.165283 45.4241V76.7408Z" />
  </svg>
);

export const Logo = ({ size = "md", linkTo, markOnly = false, className = "" }: LogoProps) => {
  const s = sizeMap[size];

  const content = (
    <div className={`group inline-flex cursor-pointer items-center ${s.gap} ${className}`}>
      <LogoMark className={`${s.mark} text-foreground transition-transform duration-500 group-hover:rotate-90`} />
      {!markOnly && (
        <span className={`font-display font-bold tracking-tight text-foreground ${s.text}`}>+Ctrl</span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} aria-label="+Ctrl">
        {content}
      </Link>
    );
  }

  return content;
};
