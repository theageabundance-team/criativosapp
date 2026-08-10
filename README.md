# Creative OS

SaaS pra armazenar seus criativos (substitui o Google Drive) + acompanhar performance
financeira via Utmify, organizado numa esteira: **Em Teste → Pré-Escala → Escalando → Pausado**.

## O que já tem (MVP)

- Biblioteca de criativos com upload de vídeo/imagem (Supabase Storage)
- Esteira em Kanban com drag-and-drop entre fases
- Dashboard com gasto, receita, lucro, ROAS, ROI, CPA, ticket médio — via API oficial da Utmify
- Login/cadastro por e-mail e senha (Supabase Auth)
- Banco de dados com RLS (cada usuário só vê os próprios dados)

## O que fica pra próxima etapa

- Hook rate / retenção por criativo (precisa da Meta Marketing API e/ou TikTok Ads API —
  a Utmify não expõe esse dado por criativo, só o financeiro agregado). O schema
  (`creative_engagement_metrics`) já está pronto pra isso.
- Vincular automaticamente um criativo ao seu `external_ad_id` quando ele for publicado.

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql`
3. Vá em **Storage** e confirme que o bucket `creatives` foi criado (o schema já cria via SQL)
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha no client)

## 2. Configurar a Utmify

1. Confirme que seu plano é Monster, Scale ou Enterprise e que você tem acesso liberado
   ao beta fechado da API Oficial (se não tiver, o dashboard mostra um aviso claro em vez
   de quebrar)
2. Na Utmify: **Avançado → API Oficial → Novo Token** → escolha o escopo (todos os
   dashboards ou específicos)
3. Copie o token → `UTMIFY_API_KEY`
4. Copie o ID do dashboard que você quer acompanhar → `UTMIFY_DASHBOARD_ID`
   (aparece na URL do dashboard dentro da Utmify)

## 3. Rodar localmente

```bash
cp .env.example .env.local
# preencha as variáveis
npm install
npm run dev
```

Acesse `http://localhost:3000`, crie sua conta na tela de login.

## 4. Subir pro GitHub e fazer deploy na Vercel

```bash
git init
git add .
git commit -m "creative os - mvp"
gh repo create creative-os --private --source=. --push
# ou crie o repo manualmente no github.com e faça git remote add + push
```

Na [Vercel](https://vercel.com):

1. **Add New → Project** → importe o repositório
2. Em **Environment Variables**, adicione as mesmas 5 variáveis do `.env.local`
3. Deploy

Pronto — o domínio `*.vercel.app` já sobe funcionando.

## Estrutura

```
app/
  dashboard/     métricas financeiras (Utmify)
  biblioteca/    grid de criativos + upload
  esteira/       kanban de fases
  api/utmify/    proxy server-side pra API da Utmify (chave nunca vai pro client)
  login/         auth
components/      UI reutilizável
lib/
  supabase/      clientes browser/server/admin
  utmify.ts      wrapper da API de consulta da Utmify
  types.ts       tipos compartilhados
supabase/
  schema.sql     schema completo com RLS, triggers e storage bucket
```
