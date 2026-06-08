import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

const Privacy = () => {
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

        <h1 className="text-4xl font-bold mb-8 text-center">Política de Privacidade</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground mb-4">
              Coletamos as seguintes informações quando você usa o +Ctrl:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Informações de Conta:</strong> Nome, e-mail, senha (criptografada)</li>
              <li><strong>Informações de Assinaturas:</strong> Nome das assinaturas, valores, datas de renovação</li>
              <li><strong>Informações de Pagamento:</strong> Processadas e armazenadas de forma segura pelo Stripe</li>
              <li><strong>Dados de Uso:</strong> Como você interage com nossa plataforma</li>
              <li><strong>Informações Técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Enviar notificações sobre pagamentos pendentes</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Comunicar atualizações e novos recursos</li>
              <li>Detectar e prevenir fraudes</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
            <p className="text-muted-foreground mb-4">
              Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Processadores de Pagamento:</strong> Stripe para processar transações</li>
              <li><strong>Provedores de Serviços:</strong> Supabase para infraestrutura e banco de dados</li>
              <li><strong>Autoridades Legais:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
            <p className="text-muted-foreground mb-4">
              Implementamos medidas de segurança para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Criptografia SSL/TLS para todas as comunicações</li>
              <li>Senhas armazenadas com hash seguro (bcrypt)</li>
              <li>Autenticação de dois fatores (2FA) disponível</li>
              <li>Acesso restrito aos dados por nossa equipe</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e seguros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos (LGPD/GDPR)</h2>
            <p className="text-muted-foreground mb-4">
              Você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Acessar:</strong> Solicitar cópia de seus dados pessoais</li>
              <li><strong>Corrigir:</strong> Atualizar informações imprecisas</li>
              <li><strong>Excluir:</strong> Solicitar exclusão de sua conta e dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogar Consentimento:</strong> Retirar permissões concedidas</li>
              <li><strong>Opor-se:</strong> Contestar o processamento de seus dados</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Para exercer esses direitos, entre em contato através da página de Suporte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies essenciais para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Manter você conectado</li>
              <li>Lembrar suas preferências</li>
              <li>Melhorar o desempenho da plataforma</li>
              <li>Analisar o uso do serviço</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Você pode controlar cookies através das configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer serviços. 
              Após a exclusão da conta, seus dados são removidos permanentemente dentro de 30 dias, 
              exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Transferência Internacional de Dados</h2>
            <p className="text-muted-foreground">
              Seus dados podem ser processados em servidores localizados fora do Brasil. 
              Garantimos que todas as transferências cumpram as leis de proteção de dados aplicáveis, 
              incluindo LGPD e GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Privacidade de Menores</h2>
            <p className="text-muted-foreground">
              Nosso serviço não é destinado a menores de 18 anos. 
              Não coletamos intencionalmente informações de menores sem o consentimento dos pais ou responsáveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Atualizações desta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade periodicamente. 
              Notificaremos você sobre mudanças significativas por e-mail ou através de um aviso em nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-2 mt-4">
              <li><strong>E-mail:</strong> privacidade@maisctrl.com</li>
              <li><strong>Página de Suporte:</strong> Através da plataforma</li>
            </ul>
          </section>

          <p className="text-sm text-muted-foreground mt-8 pt-8 border-t">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
