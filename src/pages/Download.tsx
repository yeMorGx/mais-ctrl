import { ArrowLeft, Download as DownloadIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { AndroidPhoneMockup } from "@/components/AndroidPhoneMockup";

const androidDownloadUrl = import.meta.env.VITE_ANDROID_DOWNLOAD_URL?.trim();

const Download = () => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      <div className="relative z-10 bg-gradient-hero">
        <Navigation />

        <main className="container mx-auto px-4 pb-20 pt-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <section className="text-center lg:text-left">
              <Link
                to="/"
                className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("download.back")}
              </Link>

              <div className="mb-8 flex justify-center lg:justify-start">
                <Logo size="lg" />
              </div>

              <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-primary">
                {t("download.eyebrow")}
              </p>
              <h1 className="mb-6 text-5xl font-black leading-[0.98] tracking-tight md:text-6xl">
                {t("download.title")} {" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {t("download.titleHighlight")}
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                {t("download.description")}
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                {androidDownloadUrl ? (
                  <a href={androidDownloadUrl} target="_blank" rel="noreferrer">
                    <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                      <DownloadIcon />
                      {t("download.cta")}
                    </Button>
                  </a>
                ) : (
                  <Button variant="gradient" size="xl" className="w-full sm:w-auto" disabled>
                    <DownloadIcon />
                    {t("download.comingSoon")}
                  </Button>
                )}
                <Link to="/auth">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    {t("download.webCta")}
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {androidDownloadUrl ? t("download.readyNote") : t("download.pendingNote")}
              </p>
            </section>

            <section className="relative mx-auto w-full max-w-xl lg:ml-auto" aria-label={t("download.cardLabel")}>
              <div className="absolute inset-x-10 top-20 h-72 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <AndroidPhoneMockup />
                <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-foreground/90 px-4 py-2.5 text-background shadow-2xl backdrop-blur-xl">
                  <img src="/assets/app-icon.svg" alt="" className="h-8 w-8 rounded-lg" draggable={false} />
                  <div className="whitespace-nowrap">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground">Android</p>
                    <p className="text-sm font-semibold">{t("download.panelSubtitle")}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-border/70 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            {t("download.footer")}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Download;
