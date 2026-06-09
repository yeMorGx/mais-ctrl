## Objetivo

1. Reverter completamente o rebrand: voltar de **ZULU** para **+Ctrl**, com domínio `maisctrl.com`, plano **+Premium** e a logo antiga via componente `<Logo/>`.
2. Corrigir o envio de email para qualquer destinatário (hoje só funciona para `gabrielmcgoes@gmail.com` porque está usando `onboarding@resend.dev`).

## O que você precisa fazer (passo manual)

Antes de eu trocar os `from:` no código, você precisa **verificar `maisctrl.com` no Resend** (grátis no plano free):

1. Entrar em https://resend.com/domains
2. Clicar **Add Domain** → digitar `maisctrl.com` (ou um subdomínio tipo `mail.maisctrl.com`)
3. Copiar os 3 registros DNS que o Resend mostrar (MX, SPF/TXT, DKIM) e colar no provedor onde está seu DNS de `maisctrl.com`
4. Voltar no Resend e clicar **Verify**

Quando ficar **Verified**, me avisa que eu já habilito os envios para `noreply@maisctrl.com` / `suporte@maisctrl.com`.

## Mudanças que vou fazer no código

### Rebranding ZULU → +Ctrl

- **Textos visíveis:** substituir todas as ocorrências de "ZULU" / "Zulu" por "+Ctrl" e "ZULU Pro" por "+Premium" em:
  - `src/i18n/locales/*.json` (pt-BR, en, es, ar, ja)
  - Páginas: `Index.tsx`, `Pricing.tsx`, `Auth.tsx`, `Dashboard.tsx`, `Privacy.tsx`, `Terms.tsx`, `Affiliate.tsx`, `Support.tsx`, `Changelog.tsx`, `NotFound.tsx`
  - Componentes: `DashboardHeader.tsx`, `Navigation.tsx`, `HelpTab.tsx`, `SiteManagement.tsx`, `AdminSiteSettings.tsx`, etc.
  - `index.html` (title, meta description, OG tags)
  - `README.md`

- **Logo:** remover usos de `src/assets/zulu-logo.svg` e voltar ao componente `src/components/Logo.tsx` (`<Logo/>`). Apagar o arquivo `zulu-logo.svg`.

- **Domínio em links/textos:** trocar `zulu.app` → `maisctrl.com` e `suporte@zulu.app` → `suporte@maisctrl.com`.

### Edge Functions (emails)

Trocar o `from:` em todas as funções:

- `send-support-email` → `+Ctrl Suporte <suporte@maisctrl.com>`
- `send-notification` → `+Ctrl <noreply@maisctrl.com>`
- `send-test-notification` → `+Ctrl <noreply@maisctrl.com>`
- `send-reset-code` → `+Ctrl Segurança <noreply@maisctrl.com>`
- `stripe-webhook` (templates internos que dizem "SubsOrganizer") → "+Ctrl"

### Banco de dados

- INSERT em `public.changelog` registrando o rollback de marca para +Ctrl.

### Memória do projeto

- Atualizar `mem://index.md` para refletir que a marca é **+Ctrl** novamente, domínio `maisctrl.com`, plano **+Premium**, logo via `<Logo/>`.
- Remover/ajustar memórias específicas de ZULU.

## Fora do escopo

- **Não vou** trocar o domínio do Lovable Cloud / preview / publish (essas URLs continuam as mesmas).
- **Não vou** mexer no tema premium dourado, no design monocromático, nem em features funcionais.
- **Não vou** apagar usuários ou dados.

## Ordem de execução

1. Você verifica `maisctrl.com` no Resend (passo manual acima).
2. Eu rodo o rollback de marca + troca de `from:` em paralelo.
3. Deploy automático das edge functions.
4. INSERT no changelog + atualização de memória.

Se quiser, eu já posso começar o rollback de marca agora (sem mexer no `from:` ainda) e quando o domínio estiver verificado eu só troco os remetentes. Confirma que pode seguir?