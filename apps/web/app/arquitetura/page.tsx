import { requireAccessToken } from '../../lib/server-auth';

const sections = [
  ['Backend', 'NestJS com monolito modular, RBAC no banco, auditoria e modulos por dominio.'],
  ['Frontend', 'Next.js App Router com shell B2B e consumo de API via camadas simples.'],
  ['Dados', 'PostgreSQL com Prisma, suporte a multiempresa, historico, anexos e etapas configuraveis.'],
  ['Infra', 'Docker Compose local e caminho de producao para AWS com RDS, ECS, S3 e Redis.'],
];

export default async function ArchitecturePage() {
  await requireAccessToken();

  return (
    <main style={{ padding: 32 }}>
      <h1>Arquitetura recomendada</h1>
      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        {sections.map(([title, description]) => (
          <section
            key={title}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 20,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>{description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
