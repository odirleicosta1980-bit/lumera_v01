# Lumera Licitacoes

Base inicial de um SaaS profissional para gestao de licitacoes operado pela Lumera.

## Stack principal

- Frontend: Next.js 15 + TypeScript
- Backend: NestJS + Fastify
- Banco: PostgreSQL + Prisma
- Auth: JWT access/refresh + RBAC/escopo no banco
- Arquivos: S3 compatível (MinIO local, AWS S3 em producao)
- Cache e filas: Redis + BullMQ

## Estrutura

- `apps/web`: aplicacao web
- `apps/api`: API backend
- `packages/types`: tipos compartilhados

## Subida local

1. Instale Node.js 22+ e pnpm 10+
2. Copie `.env.example` para `.env`
3. Suba infraestrutura local com `docker compose up -d`
4. Rode `pnpm install`
5. Rode `pnpm db:generate`
6. Rode `pnpm db:migrate`
7. Rode `pnpm dev`

## Decisao arquitetural

O projeto nasce como monolito modular para acelerar entrega sem abrir mao de separacao por dominios, multiempresa, auditoria e escalabilidade futura.

## Deploy

Veja o guia em `docs/deploy-gratis.md`.
