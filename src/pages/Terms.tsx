import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center">Termos de Serviço</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar o +Ctrl, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O +Ctrl é uma plataforma de gerenciamento de assinaturas que permite aos usuários:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acompanhar e gerenciar suas assinaturas mensais e anuais</li>
              <li>Receber alertas sobre pagamentos pendentes</li>
              <li>Visualizar análises financeiras de seus gastos com assinaturas</li>
              <li>Acessar recursos premium mediante pagamento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Contas de Usuário</h2>
            <p className="text-muted-foreground mb-4">
              Para utilizar nossos serviços, você deve:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer informações precisas e completas durante o registro</li>
              <li>Manter a segurança de sua senha e conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Ser responsável por todas as atividades que ocorrem em sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground mb-4">
              Oferecemos planos gratuitos e premium:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Plano Gratuito:</strong> Permite gerenciar até 5 assinaturas</li>
              <li><strong>Plano Premium:</strong> Acesso ilimitado a assinaturas e recursos avançados</li>
              <li>Os pagamentos são processados de forma segura através do Stripe</li>
              <li>Assinaturas são cobradas mensalmente ou anualmente, conforme escolhido</li>
              <li>Você pode cancelar sua assinatura premium a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Política de Reembolso</h2>
            <p className="text-muted-foreground">
              Reembolsos podem ser solicitados dentro de 7 dias após a compra, mediante análise. 
              Entre em contato com nosso suporte para solicitar um reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Uso Aceitável</h2>
            <p className="text-muted-foreground mb-4">
              Você concorda em não:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Usar o serviço para qualquer finalidade ilegal</li>
              <li>Tentar acessar áreas não autorizadas do sistema</li>
              <li>Interferir ou interromper o serviço</li>
              <li>Compartilhar suas credenciais de acesso com terceiros</li>
              <li>Realizar engenharia reversa ou tentar extrair código-fonte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo, recursos e funcionalidades do +Ctrl são de propriedade exclusiva da empresa 
              e são protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              O +Ctrl não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Perda de dados ou lucros</li>
              <li>Interrupções no serviço</li>
              <li>Erros ou omissões no conteúdo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Notificaremos os usuários sobre mudanças significativas por e-mail ou através da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre estes Termos de Serviço, entre em contato conosco através da página de Suporte.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
