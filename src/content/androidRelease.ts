export type AndroidReleaseChangeType = "feature" | "improvement" | "fix";

export type AndroidReleaseChange = {
  type: AndroidReleaseChangeType;
  text: string;
};

export const androidRelease = {
  version: "0.1.53",
  build: 53,
  releasedAt: "2026-09-14",
  changes: [
    { type: "feature", text: "Hub **Mais** no menu inferior, reunindo cartões, financiamentos, empréstimos, metas, tarefas, relatórios, Ctrl AI, +Couple, +Share e Premium." },
    { type: "feature", text: "Módulos locais para cartões e faturas, compromissos de crédito, metas, tarefas e assinaturas compartilhadas, com persistência no aparelho e suporte básico offline." },
    { type: "feature", text: "Relatório resumido com exportação CSV e área reservada para exportações Premium em Excel/PDF." },
    { type: "feature", text: "Ctrl AI local com respostas orientativas e limite de cinco perguntas no plano Free." },
    { type: "feature", text: "Tela de Premium com planos mensal/anual, teste de sete dias, contratação por cartão e indicação clara quando o checkout seguro ainda precisa ser conectado." },
    { type: "feature", text: "Área +Couple com código de convite e área +Share com divisão automática 50/50 e status de pagamento." },
    { type: "improvement", text: "Ícone do app atualizado com a imagem oficial enviada, com fundo preto, no Android, iOS e versão web instalável." },
    { type: "improvement", text: "Logo decorativa removida da tela de cadastro para deixar o formulário livre acima do teclado." },
    { type: "improvement", text: "Badge da logo MaisCtrl no painel pessoal transformado em entrada para o espaço +2." },
    { type: "improvement", text: "Nova tela fixa do +2 criada com identidade visual própria e retorno direto para o painel pessoal." },
    { type: "improvement", text: "Cadastro de assinaturas reorganizado em um fluxo modal de três etapas, com revisão antes de salvar." },
    { type: "improvement", text: "Badge principal renomeado para MaisCtrl e espaço do casal identificado como +Couple após o clique." },
    { type: "improvement", text: "Avatar do perfil exibido no botão do cabeçalho, ao lado das notificações." },
    { type: "improvement", text: "Menu inferior redesenhado como dock flutuante, com aba ativa destacada e respiro para a área segura do aparelho." },
    { type: "improvement", text: "Perfil removido do menu inferior; o acesso continua disponível pelo avatar no cabeçalho." },
    { type: "improvement", text: "Logos de marcas conhecidas adicionadas às assinaturas via CDN público, com fallback para a inicial." },
    { type: "improvement", text: "Ícone adaptativo do Android alinhado à logo oficial enviada, removendo o foreground padrão do template." },
    { type: "fix", text: "Tela inicial de autenticação mantida fixa, sem rolagem ou deslocamento do card de ações." },
    { type: "fix", text: "Campos de login reposicionados automaticamente para permanecerem visíveis acima do teclado." },
    { type: "fix", text: "Tela de cadastro mantida estática, sem rolagem, com o formulário acima do teclado." },
    { type: "fix", text: "Teclado simulado expandido até as laterais da tela, sem falhas nos cantos superiores." },
    { type: "fix", text: "Upload de foto de perfil habilitado no Supabase com bucket e políticas de acesso por usuário." },
    { type: "fix", text: "Formulários em bottom sheet mantidos fixos, com espaço de segurança acima do teclado." },
    { type: "fix", text: "Link de recuperação de senha passou a abrir o formulário de nova senha dentro do app." },
    { type: "fix", text: "Callback de recuperação separado do login normal para impedir entrada direta no painel sem trocar a senha." },
    { type: "fix", text: "Deep link `maisctrl://auth/callback` registrado também no iOS para completar a recuperação de senha." },
  ],
} as const;
