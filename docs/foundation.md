# Fundacao do Produto

## Stack recomendada

- Frontend: Next.js 15 + TypeScript
- Backend: NestJS 11 + Fastify
- Banco de dados: PostgreSQL 16
- ORM: Prisma
- Autenticacao: JWT access + refresh com RBAC e escopo no banco
- Arquivos grandes: S3 compativel, usando MinIO local e AWS S3 em producao
- Cache: Redis
- Tempo real: WebSocket/SSE via Nest para notificacoes e atualizacao de quadro
- Filas: BullMQ com Redis para notificacoes, processamento de anexos e jobs assíncronos
- Testes: Jest/Supertest no backend e Vitest/Playwright na evolucao do frontend
- Logs e monitoramento: Pino, OpenTelemetry e Sentry
- Deploy: Docker + AWS ECS/Fargate, RDS PostgreSQL, ElastiCache Redis, S3 e CloudFront

## Arquitetura recomendada

- Estilo: monolito modular
- Camadas: presentation, application, domain, infrastructure
- Modulos iniciais:
  - auth
  - organizations
  - users
  - roles
  - permissions
  - client-companies
  - licitacoes
  - etapas-licitacao
  - tarefas
  - comentarios
  - anexos
  - notifications
  - audit
- Multiempresa:
  - `organization` representa a Lumera operadora
  - `client_company` representa cada empresa cliente operada pela Lumera
  - `membership` define o escopo do usuario por organizacao e opcionalmente por empresa cliente
- Controle de acesso:
  - RBAC com permissoes por role
  - Escopo por `organization_id` e `client_company_id`
  - Regra base: cliente nunca enxerga dados de outra empresa

## Dominio

- `licitacao` e a entidade principal do produto
- `etapa_licitacao` controla as colunas configuraveis do Kanban
- `licitacao_responsavel` suporta multiplos responsaveis
- `tarefa` nasce sempre vinculada a uma licitacao
- `comentario` pode ser interno ou compartilhado com cliente
- `anexo` referencia storage externo e nao guarda binario no banco
- `activity_log` guarda eventos operacionais
- `audit_log` guarda trilha detalhada de alteracoes para compliance

## Perfis iniciais

- Lumera Admin
  - gerencia usuarios, perfis, empresas, etapas, licitacoes e auditoria
- Lumera Operacional
  - cria, edita e move licitacoes, tarefas, comentarios e anexos
- Cliente Gestor
  - visualiza licitacoes da propria empresa, comenta e acompanha progresso
- Cliente Consulta
  - apenas consulta dados liberados da propria empresa

## MVP

- Autenticacao e login
- Multiempresa basico
- Cadastro de usuarios
- Cadastro de empresas clientes
- Kanban de licitacoes
- Criacao e edicao de licitacoes
- Responsaveis multiplos
- Tarefas por licitacao
- Comentarios
- Anexos
- Historico de movimentacoes
- Auditoria base

## Fase 2

- Notificacoes em tempo real
- Automacoes por etapa
- SLA e alertas
- Checklists por tipo de licitacao
- Relatorios gerenciais
- Assinatura eletrônica e fluxos documentais
- Portal do cliente mais completo
