# Deploy gratuito do Lumera

Este projeto pode ser publicado sem custo mensal recorrente, mas hoje existe uma limitacao importante: os uploads ainda sao gravados no disco local do `apps/web`. Em hospedagens gratuitas isso costuma ser efemero, entao os arquivos podem sumir depois de um redeploy ou reinicio.

## Recomendacao mais viavel

- Frontend: Vercel Hobby
- API: Render Free Web Service
- Banco Postgres: Supabase Free ou Neon
- Uploads: Cloudflare R2 no plano gratuito

Se voce quiser publicar agora sem mexer no codigo de uploads, trate isso como uma demo. Login, CRUD e consultas podem funcionar bem, mas anexos/importacoes nao ficam confiaveis em producao.

## O que ja esta pronto no repositorio

- `render.yaml` com blueprint inicial para a API
- script `pnpm --filter @lumera/api prisma:migrate:deploy` para aplicar migrations em producao

## Passo 1: banco gratuito

Crie um banco Postgres no Supabase ou no Neon e copie a connection string para `DATABASE_URL`.

## Passo 2: publicar a API no Render

1. Suba este projeto para um repositorio GitHub.
2. No Render, escolha `New +` -> `Blueprint` e conecte o repositorio.
3. O arquivo `render.yaml` vai criar a API `lumera-api`.
4. Defina as variaveis abaixo no painel do Render:

`DATABASE_URL`
`JWT_ACCESS_SECRET`
`JWT_REFRESH_SECRET`

Opcional:

`APP_URL`

Depois do deploy, sua API deve responder em `/api/health`.

## Passo 3: publicar o frontend na Vercel

Crie um projeto apontando para `apps/web` e configure:

`NEXT_PUBLIC_API_URL=https://SEU-SERVICO-API.onrender.com`

Se quiser, ajuste tambem o nome exibido:

`NEXT_PUBLIC_APP_NAME=Lumera Licitacoes`

## Passo 4: tratar uploads para producao de verdade

Hoje os arquivos sao gravados em rotas como:

- `apps/web/app/api/licitacoes/[id]/anexos/route.ts`
- `apps/web/app/api/licitacoes/[id]/empenhos/[empenhoId]/anexos/route.ts`
- `apps/web/app/api/empresas/[id]/documentos/[documentTypeId]/route.ts`
- `apps/web/app/api/licitacoes/importacao/proposta/route.ts`

Para ficar estavel em hospedagem gratuita, o ideal e trocar a escrita em `public/uploads` por upload em bucket S3 compativel, como Cloudflare R2.

## Variaveis minimas esperadas

### API

`PORT`
`DATABASE_URL`
`JWT_ACCESS_SECRET`
`JWT_REFRESH_SECRET`
`JWT_ACCESS_TTL`
`JWT_REFRESH_TTL`

### Web

`NEXT_PUBLIC_API_URL`
`NEXT_PUBLIC_APP_NAME`

## Limites importantes

- Render Free pode hibernar por inatividade, entao a primeira requisicao da API pode demorar.
- Bancos gratis possuem cotas e limites de armazenamento.
- Sem migrar os uploads para bucket, anexos nao ficam confiaveis.

## Melhor proximo passo

Se o objetivo for colocar no ar ainda hoje, publique primeiro:

1. banco
2. API
3. frontend

Depois fazemos uma segunda passada curta para mover uploads para R2 e deixar a aplicacao realmente pronta para uso continuo.
