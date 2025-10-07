import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Bell, TrendingUp, ArrowRight, Check, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";
import { DemoModal } from "@/components/DemoModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialJoao from "@/assets/testimonial-joao.jpg";
import testimonialAna from "@/assets/testimonial-ana.jpg";
import { useTranslation } from "react-i18next";

const Index = () => {
  const [showDemo, setShowDemo] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10 bg-gradient-hero">
      <Navigation />
      <DemoModal open={showDemo} onOpenChange={setShowDemo} />
      
      {/* Hero Section */}
      <section id="hero" className="container mx-auto px-4 pt-32 pb-32">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {t("hero.title")}
            <span className="bg-gradient-primary bg-clip-text text-transparent"> {t("hero.titleHighlight")}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t("hero.description")}
          </p>

          <div className="flex justify-center pt-4">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                {t("hero.cta")}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>{t("hero.free5")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>{t("hero.trial3Days")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>{t("hero.noCard")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<CreditCard className="w-8 h-8" />}
            title={t("features.management.title")}
            description={t("features.management.description")}
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title={t("features.alerts.title")}
            description={t("features.alerts.description")}
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title={t("features.insights.title")}
            description={t("features.insights.description")}
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("pricing.title")}
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-16">
          {t("pricing.subtitle")}
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            name={t("pricing.free.name")}
            price={t("pricing.free.price")}
            period={t("pricing.free.period")}
            features={[
              t("pricing.free.feature1"),
              t("pricing.free.feature2"),
              t("pricing.free.feature3"),
              t("pricing.free.feature4")
            ]}
            highlighted={false}
            ctaText={t("pricing.free.cta")}
          />
          <PricingCard
            name={t("pricing.premium.name")}
            price={t("pricing.premium.price")}
            period={t("pricing.premium.period")}
            annualPrice={t("pricing.premium.annual")}
            trialBadge={t("pricing.premium.trial")}
            features={[
              t("pricing.premium.feature1"),
              t("pricing.premium.feature2"),
              t("pricing.premium.feature3"),
              t("pricing.premium.feature4"),
              t("pricing.premium.feature5"),
              t("pricing.premium.feature6"),
              t("pricing.premium.feature7")
            ]}
            highlighted={true}
            ctaText={t("pricing.premium.cta")}
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          {t("testimonials.title")}
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-16">
          {t("testimonials.subtitle")}
        </p>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="max-w-6xl mx-auto"
        >
          <CarouselContent>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="Maria Silva"
                role="Empresária"
                content="Com o +Ctrl consegui economizar mais de R$ 300 por mês cancelando assinaturas que nem usava mais. O relatório mensal é incrível!"
                rating={5}
                initials="MS"
                image={testimonialMaria}
              />
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="João Santos"
                role="Desenvolvedor"
                content="O recurso de dividir assinaturas com amigos (+Share) foi um divisor de águas. Netflix, Spotify... agora tudo sai mais barato!"
                rating={5}
                initials="JS"
                image={testimonialJoao}
              />
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="Ana Costa"
                role="Designer"
                content="Os insights automáticos me alertaram sobre um aumento de 40% em uma assinatura. Cancelei na hora e migrei para uma opção melhor!"
                rating={5}
                initials="AC"
                image={testimonialAna}
              />
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="Pedro Oliveira"
                role="Estudante"
                content="Como estudante, cada real conta. O +Ctrl me ajudou a identificar gastos desnecessários e hoje economizo quase 30% ao mês!"
                rating={5}
                initials="PO"
              />
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="Carla Mendes"
                role="Fotógrafa"
                content="Os alertas inteligentes salvaram minha vida! Nunca mais fui pega de surpresa com cobranças inesperadas. Recomendo muito!"
                rating={5}
                initials="CM"
              />
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <TestimonialCard
                name="Roberto Lima"
                role="Empreendedor"
                content="Gerencio várias ferramentas para meu negócio. O +Ctrl centralizou tudo e me deu visibilidade total dos custos. Essencial!"
                rating={5}
                initials="RL"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32">
        <div className="bg-gradient-primary rounded-3xl p-12 md:p-20 text-center shadow-glow">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Link to="/auth">
            <Button variant="outline" size="xl" className="bg-background hover:bg-background/90">
              {t("cta.button")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 +Ctrl. Todos os direitos reservados.</p>
        </div>
      </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-elegant transition-all duration-300 hover:scale-105">
      <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6 text-primary-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const PricingCard = ({ 
  name, 
  price, 
  period, 
  annualPrice,
  trialBadge,
  features, 
  highlighted,
  ctaText 
}: { 
  name: string; 
  price: string; 
  period: string; 
  annualPrice?: string;
  trialBadge?: string;
  features: string[]; 
  highlighted: boolean;
  ctaText: string;
}) => {
  return (
    <div className={`bg-card rounded-2xl p-8 border ${highlighted ? 'border-primary shadow-glow' : 'border-border'} transition-all duration-300 hover:scale-105 relative`}>
      {trialBadge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
            {trialBadge}
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black bg-gradient-primary bg-clip-text text-transparent">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        {annualPrice && (
          <p className="text-sm text-muted-foreground mt-2">
            {annualPrice}
          </p>
        )}
      </div>
      
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link to="/auth">
        <Button 
          variant={highlighted ? "gradient" : "outline"} 
          className="w-full"
          size="lg"
        >
          {ctaText}
        </Button>
      </Link>
    </div>
  );
};

const TestimonialCard = ({ 
  name, 
  role, 
  content, 
  rating, 
  initials,
  image 
}: { 
  name: string; 
  role: string; 
  content: string; 
  rating: number; 
  initials: string;
  image?: string;
}) => {
  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-elegant transition-all duration-300 relative">
      <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
      
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>

      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
};

export default Index;
