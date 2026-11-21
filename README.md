# MyRadio Admin

Painel de administração do MyRadio: cadastro de rádios, cidades e categorias, e acompanhamento das listas e usuários do app. Consome a API Spring Boot (`radios-api`).

Substitui o `my-radio-list-front-web` (Flowbite).

## Stack

Vite 8 · React 19 · Tailwind CSS v4 · TanStack Query 5 · React Router 7 · lucide-react · hls.js (carregado sob demanda)

## Rodando

```bash
cp .env.example .env      # ajuste VITE_RADIOS_API_URL se precisar
npm install
npm run dev               # http://localhost:5173 (já liberado no CORS da API)
```

Build: `npm run build` (saída em `dist/`). Na Vercel, o `vercel.json` já faz o rewrite das rotas para a SPA.

Só entram contas com `ROLE_ADMIN` no token. A sessão termina sozinha quando o JWT expira (24 h).

## O que tem

- **Painel**: totais, saúde dos streams, pendências de cadastro (streams `http://`, streams duplicados, cidades e categorias sem rádio), favoritas dos ouvintes, rádios por estado e categoria, listas recentes.
- **Rádios**: busca instantânea (ignora acentos), filtros por estado, cidade, categoria, tipo e situação do stream; ordem A–Z, mais salvas ou cidade; grade ou tabela. Os filtros ficam na URL (dá para compartilhar e voltar).
  - Editor lateral com prévia de como o ouvinte vê, botão **Ouvir** e **Testar conexão**, nome curto sugerido, HLS marcado sozinho para `.m3u8` e aviso de stream `http://`.
  - Exclusão pede para digitar o nome quando a rádio está em listas de ouvintes.
- **Verificar streams**: testa a conexão de todas (ou só das filtradas), 4 por vez, sem som. O resultado fica salvo na sessão.
- **Player**: ouça qualquer rádio direto do painel (mini player no canto, com volume).
- **Categorias e Cidades**: contagem de rádios, avisos de duplicidade, bloqueio de exclusão quando estão em uso. Cidades agrupadas por estado.
- **Listas**: mestre-detalhe com capa em mosaico, dono e rádios tocáveis.
- **Usuários**: perfil, quantidade de listas, edição de nome, exclusão com confirmação.
- **Ctrl K**: paleta de comandos para ir a qualquer tela, criar itens ou abrir/ouvir uma rádio (`Shift+Enter` toca). `/` foca a busca na tela de rádios.
- Tema claro, escuro ou do sistema; layout responsivo.

## Estrutura

```
src/
  lib/          api (fetch + erros em português), auth, data (queries), player, health, theme, format
  components/   ui (base), radio (logo, play, status), RadioEditor, NameForm, Layout, CommandPalette, MiniPlayer
  pages/        Dashboard, Radios, Categories, Cities, Lists, Users, Login
```

## Observação sobre streams `http://`

Páginas `https` (como o painel na Vercel) não conseguem tocar áudio `http://`. Essas rádios aparecem como **Só no app (http)**: funcionam no app Android, mas não na versão web.
