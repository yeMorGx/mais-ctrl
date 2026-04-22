import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" linkTo="/" />

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href.substring(1))}
                className="text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="ghost">{t("nav.login")}</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient">{t("nav.signup")}</Button>
            </Link>
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
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href.substring(1))}
                  className="rounded-lg px-4 py-2 text-left font-medium text-foreground/80 transition-colors hover:bg-accent/80 hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border">
                <LanguageSwitcher />
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="gradient" className="w-full">
                    {t("nav.signup")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
