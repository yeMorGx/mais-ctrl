## Objetivo

1. Em "Suas Assinaturas", mostrar **a logo oficial da marca** (Spotify, Netflix, Nubank, Apple, Meli+, HBO, etc.) automaticamente a partir do nome.
2. Garantir o botão **Editar** ao lado de cada assinatura (o `EditSubscriptionDialog` já existe e já está conectado no Dashboard via `showEdit`).

## Como obter as logos automaticamente

Usar o CDN público **Simple Icons** (`https://cdn.simpleicons.org/<slug>`), que serve a logo oficial em SVG para mais de 3.000 marcas — sem precisar baixar nada, sem chave de API, com cache global. Exemplos:
- `cdn.simpleicons.org/spotify`
- `cdn.simpleicons.org/netflix`
- `cdn.simpleicons.org/nubank`
- `cdn.simpleicons.org/apple`
- `cdn.simpleicons.org/mercadolibre` (Meli+)
- `cdn.simpleicons.org/hbo`

Fallback: se a marca não for reconhecida, mantém o ícone Lucide colorido atual (comportamento já existente).

## Mudanças

### `src/lib/subscriptionLogos.tsx`
- Adicionar um mapa `brandSlugs: Record<string, string>` com sinônimos → slug do Simple Icons. Cobertura inicial (~40 marcas):
  - Streaming vídeo: netflix, prime video → primevideo, disney+ → disneyplus, hbo max → hbo, paramount+ → paramountplus, star+ → disneyplus, globoplay, crunchyroll, apple tv → appletv, max
  - Música: spotify, apple music → applemusic, youtube music → youtubemusic, deezer, tidal, amazon music → amazonmusic
  - Games: playstation, xbox, nintendo, steam, epic games → epicgames, ea play → ea
  - Cloud: google drive → googledrive, google one → googleone (fallback googledrive), dropbox, icloud, onedrive
  - Educação/Dev: duolingo, coursera, udemy, github, gitlab, notion, figma, chatgpt → openai
  - Bancos/Compras BR: nubank, itau, bradesco, mercado livre/meli+ → mercadolibre, magalu → magazineluiza, ifood, uber, 99, amazon
  - Outros: audible, kindle → amazonkindle, twitch, discord nitro → discord, canva
- Nova função `getBrandLogo(name)` que devolve `{ type: 'image', url }` quando encontra slug, ou `{ type: 'icon', ...logo }` (estrutura atual) caso contrário. Casamento por nome normalizado + busca parcial (igual ao `getSubscriptionLogo` atual).

### `src/components/dashboard/SubscriptionList.tsx`
- No render de cada assinatura, trocar o bloco do ícone por:
  - Se `type === 'image'`: `<img src={url} alt={sub.name} className="w-7 h-7" loading="lazy" onError={fallbackToIcon}/>` dentro de um container `bg-muted/40` (sem tint colorido para não conflitar com a logo).
  - Caso contrário: comportamento atual (ícone Lucide colorido).
- `onError` usa `useState` para marcar a logo como falha e cair no fallback do ícone Lucide na próxima renderização — assim, se o CDN não tiver aquela marca, a UI não fica quebrada.

### Edição
- Já implementada (`EditSubscriptionDialog` + botão lápis com `showEdit` ativo no Dashboard). Confirmar visualmente após a mudança das logos; sem mudança de código necessária para esta parte, exceto se você quiser que o botão Editar fique disponível também no `UnifiedDashboard` (hoje passa `showEdit` apenas no Dashboard) — posso ativar lá também.

## Pergunta rápida
Quer que o botão **Editar** também apareça no `UnifiedDashboard` (visão consolidada), ou manter só no Dashboard como está hoje?
