import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail } from "lucide-react";

export const HelpTab = () => {
  const faqs = [
    {
      question: "Como adicionar uma nova assinatura?",
      answer:
        "Clique no botão 'Nova Assinatura' no dashboard, preencha as informações e clique em salvar.",
    },
    {
      question: "Como funciona o plano +Premium?",
      answer:
        "O plano +Premium oferece assinaturas ilimitadas, relatórios avançados, +Share e muito mais por R$ 12,49/mês (cobrado anualmente).",
    },
    {
      question: "O que é o +Share?",
      answer:
        "É um recurso exclusivo do +Premium que permite compartilhar assinaturas com parceiros e dividir os custos de forma automática.",
    },
    {
      question: "Como cancelar minha assinatura do +Premium?",
      answer:
        "Acesse a aba 'Plano' e clique em 'Gerenciar Assinatura'. Lá você pode cancelar ou pausar a qualquer momento.",
    },
    {
      question: "Posso exportar meus relatórios?",
      answer:
        "Sim! Usuários +Premium podem exportar relatórios em PDF e Excel na aba de Relatórios.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
          <CardDescription>Respostas para as dúvidas mais comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Formulário de Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Entre em Contato</CardTitle>
          <CardDescription>Envie sua dúvida ou sugestão</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input id="subject" placeholder="Digite o assunto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva sua dúvida ou sugestão..."
                rows={5}
              />
            </div>
            <Button className="w-full bg-gradient-primary">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Chat de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle>Chat ao Vivo</CardTitle>
          <CardDescription>Fale com nosso suporte em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Iniciar Chat
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Disponível: Seg-Sex, 9h-18h
          </p>
        </CardContent>
      </Card>
    </div>
  );
};