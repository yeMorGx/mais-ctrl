import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditCard, Bell, TrendingUp, ArrowRight, BarChart3, Calendar, Share2 } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoModal = ({ open, onOpenChange }: DemoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Demonstração do +Ctrl
          </DialogTitle>
          <DialogDescription className="text-base">
            Veja como você pode ter controle total das suas assinaturas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature 1 */}
          <div className="flex gap-4 items-start p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Gerencie todas as suas assinaturas</h3>
              <p className="text-muted-foreground">
                Adicione Netflix, Spotify, Amazon Prime e todas as suas assinaturas em um só lugar. 
                Acompanhe valores, datas de renovação e muito mais.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 items-start p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Receba alertas inteligentes</h3>
              <p className="text-muted-foreground">
                Seja notificado antes das cobranças, nunca mais seja pego de surpresa. 
                Configure alertas personalizados para cada assinatura.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 items-start p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Visualize seus gastos</h3>
              <p className="text-muted-foreground">
                Gráficos interativos mostram onde seu dinheiro está indo. 
                Identifique oportunidades de economia e tome decisões informadas.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex gap-4 items-start p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Calendário de pagamentos</h3>
              <p className="text-muted-foreground">
                Veja todos os seus pagamentos futuros em um calendário visual. 
                Planeje seu orçamento com antecedência.
              </p>
            </div>
          </div>

          {/* Feature 5 - Premium */}
          <div className="flex gap-4 items-start p-4 rounded-lg border border-primary/50 bg-gradient-primary/10">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                +Share: Divida assinaturas
                <span className="text-xs bg-gradient-primary text-primary-foreground px-2 py-1 rounded-full">
                  Premium
                </span>
              </h3>
              <p className="text-muted-foreground">
                Divida assinaturas com amigos e família. O +Ctrl calcula automaticamente 
                quanto cada pessoa deve pagar e envia lembretes.
              </p>
            </div>
          </div>

          {/* Screenshot Placeholder */}
          <div className="rounded-lg border border-border overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <TrendingUp className="w-16 h-16 mx-auto text-primary" />
                <p className="text-lg font-medium">Interface intuitiva e moderna</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Dashboard completo com visualizações em tempo real dos seus gastos
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to="/auth" className="flex-1">
              <Button 
                variant="gradient" 
                size="lg" 
                className="w-full group"
                onClick={() => onOpenChange(false)}
              >
                Começar gratuitamente
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing" className="flex-1">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Ver planos
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
