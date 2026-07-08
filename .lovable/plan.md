# ❤️ +2 — Ambiente Financeiro do Casal

Novo espaço dentro do +Ctrl (sem substituir nada existente). Um seletor no topo do dashboard alterna entre **👤 Meu Espaço** e **❤️ +2**. Todo o design reaproveita o Design System atual (tokens, shadcn, animações, Framer Motion, glassmorphism leve, dark mode).

---

## 1. Estrutura & Navegação

- Novo componente `SpaceSwitcher` no header do Dashboard (dropdown/toggle com avatar).
- Persistência da escolha em `localStorage` + query param `?space=couple`.
- Nova rota interna `/dashboard` continua igual; quando `space=couple`, renderiza `<CoupleDashboard />` no lugar do `<UnifiedDashboard />`.
- Pasta nova: `src/components/couple/` para isolar tudo (permite expandir depois: Lista de compras, Wishlist, Viagens, etc.).
- Linguagem compartilhada: "Nosso / Nossa / do Casal" — util `src/lib/coupleCopy.ts`.

---

## 2. Backend (Lovable Cloud)

Migração única criando as tabelas do espaço do casal, todas com RLS + GRANTs:

- `couples` — vínculo entre 2 users (owner + partner, status pending/active).
- `couple_invites` — convites por e-mail (token único).
- `couple_incomes` — receitas por membro (nome, valor, recorrência, member_id).
- `couple_expenses` — despesas (nome, categoria, valor, data, responsável enum: `me`/`partner`/`both`, status, recorrência, parcelamento, obs).
- `couple_dreams` — sonhos (imagem, nome, valor_desejado, valor_atual, prazo).
- `couple_dream_contributions` — aportes nos sonhos.
- `couple_investments` — investimentos (tipo, instituição, valor_investido, valor_atual).
- `couple_assets` — patrimônio (categoria: dinheiro/veículo/imóvel/eletrônico/outro, valor).
- `couple_activities` — timeline (user_id, action, entity_type, entity_id, metadata).
- `couple_checkins` — check-in semanal (semana, dados agregados, concluído).
- `couple_achievements` — conquistas desbloqueadas (couple_id, code, unlocked_at, progress).

RLS: apenas membros ativos do casal (`owner_id = auth.uid()` OR `partner_id = auth.uid()`). Helper SECURITY DEFINER `is_couple_member(_couple_id, _user_id)`.

Bucket storage `dream-images` para imagens de sonhos.

---

## 3. Dashboard do Casal — `<CoupleDashboard />`

Header dedicado com avatares dos dois membros + nome do casal + saudação ("Olá, casal!").

**Grid de Cards** (todos com hover, skeleton, animação, responsivos):
- 💵 Receita Total do Casal
- 💸 Despesas Totais
- 💰 Saldo Atual (destaque grande)
- 📈 Economia do Mês
- 🎯 Sonhos (progresso agregado)
- 🏦 Patrimônio Líquido
- 📊 Investimentos
- 📅 Próximo Vencimento
- ❤️ Saúde Financeira (score 0-100 calculado)

**Seções (tabs internas do +2)**:
1. **Visão Geral** — cards + gráfico entrada×saída + insights.
2. **Receitas** — por membro, soma automática.
3. **Despesas** — lista + filtros por responsável/status/categoria.
4. **Sonhos** — cards com imagem, barra de progresso, contribuições.
5. **Investimentos** — lista + distribuição (pie chart via recharts já usado).
6. **Patrimônio** — categorias + líquido total.
7. **Timeline** — atividades recentes com avatar+nome+hora.
8. **Check-in** — revisão semanal com botão "Concluir revisão".
9. **Conquistas** — grid de badges (desbloqueadas + em progresso).

---

## 4. Insights Automáticos

Componente `CoupleInsights` que calcula no cliente a partir dos dados carregados:
- % economia vs mês anterior
- % despesas fixas sobre renda
- previsão de conclusão de sonhos baseado no ritmo de contribuição
- capacidade de investimento estimada
- alerta de saúde do orçamento

Sem chamada de IA — regras determinísticas, rápido e sem custo.

---

## 5. Gamificação

Regras avaliadas ao carregar o dashboard; conquistas destravadas gravam em `couple_achievements` e disparam toast celebratório. Lista inicial:
- Primeiro mês sem atrasos
- Reserva de emergência criada
- Primeiro sonho concluído
- R$10.000 investidos
- 3 meses economizando
- 1 ano de +2
- Zero atrasos no mês
- Todas as contas em dia
- Primeira viagem/veículo conquistado

---

## 6. Convite do parceiro

Fluxo de onboarding do +2:
1. Usuário entra no +2 pela primeira vez → tela "Convide seu par".
2. Envia convite por e-mail (edge function `send-notification` reaproveitada, template novo).
3. Parceiro aceita via link `/invite/couple?token=...` → cria vínculo `active`.
4. Enquanto pendente, dashboard mostra estado "Aguardando aceitação" mas já permite cadastrar dados individuais.

---

## 7. Design

- Reusa tokens semânticos do `index.css` (nada de cor hardcoded).
- Micro-animações: `animate-fade-in`, `hover-scale`, staggered reveal com Framer Motion.
- Glassmorphism leve nos cards (`bg-card/60 backdrop-blur border`).
- Toque afetivo: gradiente sutil rosa/vermelho SOMENTE no badge ❤️ +2 e header do casal (sem invadir o resto).
- Dark mode nativo (já é o padrão do projeto).

---

## 8. Detalhes técnicos

- Hooks: `useCouple()`, `useCoupleIncomes()`, `useCoupleExpenses()`, `useCoupleDreams()`, `useCoupleInvestments()`, `useCoupleAssets()`, `useCoupleActivities()`, `useCoupleAchievements()` — todos via React Query.
- Logger de atividades: helper `logCoupleActivity(action, entityType, entityId, metadata)` chamado nas mutações.
- Tipos atualizados via `src/integrations/supabase/types.ts` (auto-geradas após migração).
- Changelog: inserir linha na tabela `changelog` anunciando o lançamento do +2.
- i18n: strings novas apenas em `pt-BR.json` inicialmente (mesma abordagem de features recentes); demais idiomas herdam chaves faltantes.

---

## 9. Ordem de entrega

1. Migração SQL (tabelas + RLS + GRANTs + helper + bucket).
2. Types + hooks + logger de atividade.
3. `SpaceSwitcher` + roteamento interno no Dashboard.
4. Fluxo de convite do parceiro.
5. Layout do `CoupleDashboard` + cards + skeletons.
6. Módulos: Receitas → Despesas → Sonhos → Investimentos → Patrimônio.
7. Timeline + Check-in semanal.
8. Insights + Conquistas.
9. Revisão final (consistência, reuso, UX) + changelog.

Quer que eu siga com essa proposta ou ajusto algo antes de começar?
