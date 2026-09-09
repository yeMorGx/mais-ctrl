import { ArrowLeft, Check, Download as DownloadIcon, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";
import { AnimatedBackground } from "@/components/AnimatedBackground";

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

            <section className="relative mx-auto w-full max-w-md lg:ml-auto" aria-label={t("download.cardLabel")}>
              <div className="absolute -inset-8 rounded-[3rem] bg-primary/15 blur-3xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-elegant backdrop-blur-2xl md:p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{t("download.cardEyebrow")}</p>
                    <h2 className="mt-1 text-2xl font-bold">MaisCtrl Android</h2>
                  </div>
                  <img
                    src="/assets/app-icon.svg"
                    alt=""
                    className="h-16 w-16 rounded-[1.15rem] shadow-lg"
                    draggable={false}
                  />
                </div>

                <div className="rounded-2xl bg-foreground p-5 text-background shadow-xl">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-background/10">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("download.panelTitle")}</p>
                      <p className="text-sm text-background/60">{t("download.panelSubtitle")}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-background/80">
                    {[t("download.feature1"), t("download.feature2"), t("download.feature3")].map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="h-4 w-4 shrink-0 text-primary-foreground" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-background/70 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{t("download.securityNote")}</p>
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
