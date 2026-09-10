import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const navLinks = [
    { label: t("nav.home"), href: "#hero" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
  ];

  const renderNavLink = (link: (typeof navLinks)[number], mobile = false) => {
    const className = mobile
      ? "rounded-lg px-4 py-2 text-left font-medium text-foreground/80 transition-colors hover:bg-accent/80 hover:text-foreground"
      : "text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground";

    if (location.pathname === "/") {
      return (
        <button
          type="button"
          onClick={() => scrollToSection(link.href.substring(1))}
          className={className}
        >
          {link.label}
        </button>
      );
    }

    return (
      <Link to={`/${link.href}`} onClick={() => setIsOpen(false)} className={className}>
        {link.label}
      </Link>
    );
  };

  return (
    <nav
      className="fixed left-0 right-0 z-50 border-b border-border/70 bg-background/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60"
      style={{ top: "var(--development-banner-height, 0px)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" linkTo="/" hideWordmarkOnMobile />

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <span key={link.href}>{renderNavLink(link)}</span>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button asChild variant="outline" className="gap-2">
              <Link to="/download">
                <Download className="h-4 w-4" />
                {t("nav.download")}
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
            <Button asChild variant="gradient">
              <Link to="/auth">{t("nav.signup")}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <span key={link.href}>{renderNavLink(link, true)}</span>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border">
                <LanguageSwitcher />
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/download" onClick={() => setIsOpen(false)}>
                    <Download className="h-4 w-4" />
                    {t("nav.download")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild variant="gradient" className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    {t("nav.signup")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
