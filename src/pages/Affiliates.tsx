import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { 
  Users, 
  Share2, 
  Wallet, 
  DollarSign, 
  Bell, 
  LayoutList, 
  Brain,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar,
  CreditCard,
  ShieldCheck,
  Zap
} from "lucide-react";

const Affiliates = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Programa CTRL 20
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              Ganhe <span className="bg-gradient-primary bg-clip-text text-transparent">20% TODO MÊS</span>
              <br />indicando o MaisCtrl
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ajude pessoas a organizar as contas e receba comissão recorrente enquanto elas usarem a plataforma.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-medium">Sem investimento. Sem estoque. Sem promessa milagrosa.</span>
            </div>
            
            <Link to="/affiliate">
              <Button size="xl" variant="gradient" className="mt-4">
                Quero ser afiliado
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sub-hero - Proof Points */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-bold text-lg">Planos acessíveis</h3>
                <p className="text-sm text-muted-foreground">Fácil de vender pra qualquer pessoa</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-bold text-lg">Comissão recorrente</h3>
                <p className="text-sm text-muted-foreground">Ganha enquanto o cliente usar</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <Zap className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-bold text-lg">Pagamento via PIX</h3>
                <p className="text-sm text-muted-foreground">Rápido e sem burocracia</p>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            O MaisCtrl é uma ferramenta simples pra quem vive no aperto dos boletos e precisa de controle de verdade.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Como funciona
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-black text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold">Cadastre-se</h3>
              <p className="text-muted-foreground">
                Crie sua conta no programa de afiliados e receba seu link exclusivo.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-black text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold">Compartilhe</h3>
              <p className="text-muted-foreground">
                Indique o MaisCtrl para amigos, seguidores ou clientes que precisam organizar as contas.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-black text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold">Ganhe todo mês</h3>
              <p className="text-muted-foreground">
                Quando a pessoa assinar, você recebe 20% recorrente enquanto ela continuar usando.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Example */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Quanto dá pra ganhar
          </h2>
          <p className="text-center text-muted-foreground mb-12">Valores aproximados</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-black text-primary mb-2">~R$ 60</div>
                <div className="text-lg font-medium mb-2">/mês</div>
                <p className="text-muted-foreground">10 pessoas no plano mensal</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-black text-primary mb-2">~R$ 360</div>
                <div className="text-lg font-medium mb-2">em comissão</div>
                <p className="text-muted-foreground">10 pessoas no plano anual</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary/40 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-black text-primary mb-2">50+</div>
                <div className="text-lg font-medium mb-2">pessoas ativas</div>
                <p className="text-muted-foreground">= renda mensal recorrente</p>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center text-muted-foreground mt-8 font-medium">
            ⏳ Quanto mais tempo o cliente fica, mais você ganha.
          </p>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Planos do MaisCtrl
          </h2>
          <p className="text-center text-muted-foreground mb-12">Pra você vender fácil</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Plano Mensal</h3>
                <div className="text-4xl font-black mb-2">R$ 29,90</div>
                <p className="text-muted-foreground mb-6">/ mês</p>
                <Badge variant="secondary" className="text-sm">
                  <Wallet className="w-4 h-4 mr-1" />
                  Comissão: R$ 5,98/mês
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium">
                Mais vendido
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Plano Anual</h3>
                <div className="text-4xl font-black mb-1">R$ 179,90</div>
                <p className="text-muted-foreground mb-2">/ ano</p>
                <p className="text-sm text-muted-foreground mb-4">Equivale a R$ 14,99 / mês</p>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">3 dias de teste grátis</span>
                </div>
                <Badge variant="default" className="text-sm">
                  <Wallet className="w-4 h-4 mr-1" />
                  Comissão: R$ 35,98
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center mt-8 font-medium text-primary">
            👉 Comissão de 20% em ambos os planos
          </p>
        </div>
      </section>

      {/* Why it Converts */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Por que o MaisCtrl converte?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
              <LayoutList className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-1">Lista de contas organizada</h3>
                <p className="text-muted-foreground text-sm">Por vencimento, sem esquecer nenhum boleto</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
              <Bell className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-1">Alertas inteligentes</h3>
                <p className="text-muted-foreground text-sm">Antes do boleto estourar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
              <DollarSign className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-1">Visão clara do mês</h3>
                <p className="text-muted-foreground text-sm">Sem planilhas complicadas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
              <Brain className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold mb-1">Feito pra vida real</h3>
                <p className="text-muted-foreground text-sm">Pra quem precisa de controle de verdade</p>
              </div>
            </div>
          </div>
          
          <Card className="border-0 bg-primary/5">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-medium">
                O MaisCtrl não te manda parar de gastar.
                <br />
                <span className="text-primary font-bold">Ele te mostra onde você tá gastando.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pra quem é esse programa?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Criadores de conteúdo",
              "Estudantes",
              "CLT / primeiro emprego",
              "Autônomos e freelancers",
              "Educadores financeiros",
              "Quem fala sobre vida adulta"
            ].map((audience, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium text-sm md:text-base">{audience}</span>
              </div>
            ))}
          </div>
          
          <Card className="mt-8 border-0 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-6 text-center">
              <p className="text-lg">
                Se você conhece alguém que vive no susto do boleto,
                <br />
                <span className="font-bold">você já sabe vender o MaisCtrl.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Payment Rules */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pagamentos e regras
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card">
              <DollarSign className="w-6 h-6 text-primary" />
              <div>
                <span className="font-medium">Comissão:</span>
                <span className="ml-2 text-muted-foreground">20% recorrente</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card">
              <Calendar className="w-6 h-6 text-primary" />
              <div>
                <span className="font-medium">Liberação:</span>
                <span className="ml-2 text-muted-foreground">após 14 dias</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card">
              <Wallet className="w-6 h-6 text-primary" />
              <div>
                <span className="font-medium">Saque mínimo:</span>
                <span className="ml-2 text-muted-foreground">R$ 50</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card">
              <CreditCard className="w-6 h-6 text-primary" />
              <div>
                <span className="font-medium">Pagamento:</span>
                <span className="ml-2 text-muted-foreground">via PIX</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-center text-sm">
              ❌ Proibido spam, fraude ou autoindicação
            </p>
          </div>
          
          <p className="text-center mt-6 text-muted-foreground">
            Programa sério, simples e transparente.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto max-w-3xl text-center">
          <Badge variant="default" className="mb-6 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            CTRL 20
          </Badge>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            Faça parte do <span className="bg-gradient-primary bg-clip-text text-transparent">CTRL 20</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            Ganhe dinheiro ajudando pessoas a terem controle financeiro.
          </p>
          
          <Link to="/affiliate">
            <Button size="xl" variant="gradient" className="shadow-glow">
              Quero ser afiliado agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" linkTo="/" />
            <p className="text-sm text-muted-foreground">
              © 2025 +Ctrl. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Affiliates;
