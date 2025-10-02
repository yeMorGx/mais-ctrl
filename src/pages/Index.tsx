import { Button } from "@/components/ui/button";
import { CreditCard, Bell, TrendingUp, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      {/* Hero Section */}
      <section id="hero" className="container mx-auto px-4 pt-32 pb-32">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Controle total das suas
            <span className="bg-gradient-primary bg-clip-text text-transparent"> assinaturas</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Organize, gerencie e economize com suas assinaturas mensais. 
            Nunca mais perca o controle dos seus gastos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                Começar agora
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="xl">
              Ver demonstração
            </Button>
          </div>

          <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Gratuito para 5 assinaturas</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span>Sem cartão de crédito</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<CreditCard className="w-8 h-8" />}
            title="Gestão completa"
            description="Adicione, edite e organize todas as suas assinaturas em um único lugar"
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title="Alertas inteligentes"
            description="Receba lembretes antes das cobranças e nunca mais seja pego de surpresa"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Insights financeiros"
            description="Visualize gráficos e relatórios para entender seus gastos mensais"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Planos para cada necessidade
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-16">
          Comece grátis e evolua quando precisar
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            name="Gratuito"
            price="R$ 0"
            period="/mês"
            features={[
              "Até 5 assinaturas",
              "Dashboard básico",
              "Notificações por email",
              "Suporte por email"
            ]}
            highlighted={false}
          />
          <PricingCard
            name="+Premium"
            price="R$ 12,49"
            period="/mês"
            annualPrice="R$ 149,90/ano"
            features={[
              "Assinaturas ilimitadas",
              "Dashboard avançado com gráficos",
              "Notificações inteligentes",
              "Relatórios e exportação em PDF",
              "+Share: Divida assinaturas",
              "Insights automáticos",
              "Suporte prioritário"
            ]}
            highlighted={true}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32">
        <div className="bg-gradient-primary rounded-3xl p-12 md:p-20 text-center shadow-glow">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para ter controle?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já economizam com +Ctrl
          </p>
          <Link to="/auth">
            <Button variant="outline" size="xl" className="bg-background hover:bg-background/90">
              Criar conta grátis
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
  features, 
  highlighted 
}: { 
  name: string; 
  price: string; 
  period: string; 
  annualPrice?: string;
  features: string[]; 
  highlighted: boolean;
}) => {
  return (
    <div className={`bg-card rounded-2xl p-8 border ${highlighted ? 'border-primary shadow-glow' : 'border-border'} transition-all duration-300 hover:scale-105`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black bg-gradient-primary bg-clip-text text-transparent">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        {annualPrice && (
          <p className="text-sm text-muted-foreground mt-2">
            Cobrado anualmente: {annualPrice}
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
          {highlighted ? "Começar Premium" : "Começar grátis"}
        </Button>
      </Link>
    </div>
  );
};

export default Index;
