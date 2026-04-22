import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Bell, TrendingUp, ArrowRight, Check, Star, Quote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { DemoModal } from "@/components/DemoModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CountdownTimer } from "@/components/CountdownTimer";
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
import { motion, useScroll, useTransform, useInView } from "framer-motion";

// Scroll-driven animation wrapper
const ScrollReveal = ({ 
  children, 
  className = "",
  delay = 0,
  direction = "up"
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      animate={isInView ? { 
        opacity: 1, 
        x: 0, 
        y: 0 
      } : {}}
      transition={{ 
        duration: 0.8, 
        delay: delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation
const StaggerContainer = ({ 
  children, 
  className = "",
  staggerDelay = 0.1
}: { 
  children: React.ReactNode; 
  className?: string;
  staggerDelay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 40, scale: 0.95 },
      visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          duration: 0.6,
          ease: [0.25, 0.4, 0.25, 1]
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Parallax text effect
const ParallaxText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

// Scale on scroll effect
const ScaleOnScroll = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
};

const Index = () => {
  const [showDemo, setShowDemo] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10 bg-gradient-hero">
      <Navigation />
      <DemoModal open={showDemo} onOpenChange={setShowDemo} />
      
      {/* Hero Section with Parallax */}
      <motion.section 
        ref={heroRef}
        id="hero" 
        className="container mx-auto px-4 pt-32 pb-24 md:pb-32 relative"
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      >
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <Logo size="xl" />
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-black leading-[0.95] tracking-normal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {t("hero.title")}
            <motion.span 
              className="bg-gradient-primary bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            > {t("hero.titleHighlight")}</motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {t("hero.description")}
          </motion.p>

          <motion.div 
            className="flex justify-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                {t("hero.cta")}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { text: t("hero.free5") },
              { text: t("hero.trial3Days") },
              { text: t("hero.noCard") }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <Check className="w-5 h-5 text-primary" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
       <section id="features" className="container mx-auto px-4 py-20">
        <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
          <StaggerItem>
            <FeatureCard
              icon={<CreditCard className="w-8 h-8" />}
              title={t("features.management.title")}
              description={t("features.management.description")}
            />
          </StaggerItem>
          <StaggerItem>
            <FeatureCard
              icon={<Bell className="w-8 h-8" />}
              title={t("features.alerts.title")}
              description={t("features.alerts.description")}
            />
          </StaggerItem>
          <StaggerItem>
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title={t("features.insights.title")}
              description={t("features.insights.description")}
            />
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Pricing Section */}
       <section id="pricing" className="container mx-auto px-4 py-20">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            {t("pricing.title")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-xl text-muted-foreground text-center mb-16">
            {t("pricing.subtitle")}
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" staggerDelay={0.2}>
          <StaggerItem>
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
          </StaggerItem>
          <StaggerItem>
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
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 overflow-hidden">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            {t("testimonials.title")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-xl text-muted-foreground text-center mb-16">
            {t("testimonials.subtitle")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
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
        </ScrollReveal>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32">
        <ScaleOnScroll>
           <div className="apple-section p-12 md:p-20 text-center shadow-glow relative overflow-hidden">
            {/* Animated background elements */}
            <motion.div 
              className="absolute inset-0 opacity-20"
              animate={{ 
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
              style={{
                backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)",
                backgroundSize: "50px 50px"
              }}
            />
            
            <motion.h2 
              className="text-4xl md:text-5xl font-black bg-gradient-primary bg-clip-text text-transparent mb-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {t("cta.title")}
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {t("cta.subtitle")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10"
            >
              <Link to="/auth">
                <Button variant="outline" size="xl" className="bg-background hover:bg-background/90 hover:scale-105 transition-transform">
                  {t("cta.button")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </ScaleOnScroll>
      </section>

      {/* Footer */}
      <motion.footer 
        className="border-t border-border py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-muted-foreground">© 2025 +Ctrl. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/affiliates" className="text-muted-foreground hover:text-primary transition-colors">
                Programa de Afiliados
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </motion.footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <motion.div 
      className="glass-panel kinetic-card rounded-2xl p-8 group"
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 text-primary-foreground shadow-glow"
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
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
  const navigate = useNavigate();
  
  const handleCTA = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <motion.div 
      className={`glass-panel kinetic-card rounded-2xl p-8 relative h-full ${highlighted ? 'border-primary shadow-glow' : ''}`}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {trialBadge && (
        <motion.div 
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className="bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
            {trialBadge}
          </span>
        </motion.div>
      )}
      
      {highlighted && (
        <div className="mb-4">
          <CountdownTimer />
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        {highlighted ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-muted-foreground line-through">
                R$ 249,90
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span 
                className="text-5xl font-black bg-gradient-primary bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                R$ 179,90
              </motion.span>
              <span className="text-muted-foreground">/ano</span>
            </div>
          </div>
        ) : (
          <div>
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
        )}
      </div>
      
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <motion.li 
            key={index} 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>
      
      <Button 
        variant={highlighted ? "gradient" : "outline"} 
        className="w-full hover:scale-105 transition-transform"
        size="lg"
        onClick={handleCTA}
      >
        {ctaText}
      </Button>
    </motion.div>
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
    <motion.div 
      className="glass-panel kinetic-card rounded-2xl p-8 relative h-full"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
      
      <div className="flex items-center gap-4 mb-6">
        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Star className="w-4 h-4 fill-primary text-primary" />
          </motion.div>
        ))}
      </div>

      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </motion.div>
  );
};

export default Index;
