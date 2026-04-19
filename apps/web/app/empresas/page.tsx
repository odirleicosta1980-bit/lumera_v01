import Link from 'next/link';
import { requireSessionUser, type SessionUser } from '../../lib/server-auth';
import { getOrganizations, type ParticipatingCompany } from '../../lib/kanban-api';
import { CreateEmpresaForm } from '../../components/empresas/create-empresa-form';
import { UpdateEmpresaFinanceiroForm } from '../../components/empresas/update-empresa-financeiro-form';
import { DeactivateEmpresaButton } from '../../components/empresas/deactivate-empresa-button';
import { EmpresaDocumentosPanel } from '../../components/empresas/empresa-documentos-panel';
import { formatCpfCnpj, formatCurrencyDisplay } from '../../lib/formatters';

const pageStyle = {
  display: 'grid',
  gap: 24,
} satisfies React.CSSProperties;

const panelStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  padding: 24,
  boxShadow: 'var(--shadow-soft)',
} satisfies React.CSSProperties;

const companyRowStyle = {
  border: '1px solid var(--border)',
  borderRadius: 18,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.72)',
} satisfies React.CSSProperties;

function isLumeraOperator(user: SessionUser) {
  return user.memberships.some((membership) => ['LUMERA_ADMIN', 'LUMERA_OPERACIONAL'].includes(membership.roleCode));
}

function formatRuleSummary(company: ParticipatingCompany) {
  const rule = company.financialRule;
  if (!rule) {
    return 'Regra financeira nao configurada';
  }

  const parts = [rule.chargingModel ?? 'Sem modelo'];
  if (rule.percentualLumera) {
    parts.push(`${rule.percentualLumera}% Lumera`);
  }
  if (rule.valorFixoLumera) {
    parts.push(formatCurrencyDisplay(rule.valorFixoLumera));
  }
  if (rule.formaPagamento) {
    parts.push(rule.formaPagamento);
  }
  return parts.join(' | ');
}

function CompanyDetails({
  company,
  organizationId,
}: {
  company: ParticipatingCompany;
  organizationId: string;
}) {
  const primaryLabel = company.tradeName ?? company.legalName;
  const secondaryBits = [
    company.legalName !== primaryLabel ? company.legalName : null,
    company.taxId ? `CNPJ/CPF: ${formatCpfCnpj(company.taxId)}` : null,
    company.segmento ? `Segmento: ${company.segmento}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <details style={companyRowStyle}>
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <strong>{primaryLabel}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{secondaryBits || 'Clique para ver os detalhes desta empresa.'}</span>
        </div>
        <span style={{ color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>Ver detalhes</span>
      </summary>
      <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <strong>{primaryLabel}</strong>
            {company.legalName !== primaryLabel ? <div style={{ color: 'var(--muted)' }}>{company.legalName}</div> : null}
            {company.taxId ? <div style={{ color: 'var(--muted)' }}>CNPJ/CPF: {formatCpfCnpj(company.taxId)}</div> : null}
            {company.segmento ? <div style={{ color: 'var(--muted)' }}>Segmento: {company.segmento}</div> : null}
            <div style={{ color: 'var(--muted)' }}>{formatRuleSummary(company)}</div>
          </div>
          <DeactivateEmpresaButton companyId={company.id} organizationId={organizationId} isActive={company.isActive} />
        </div>
        <UpdateEmpresaFinanceiroForm organizationId={organizationId} company={company} />
        <EmpresaDocumentosPanel company={company} organizationId={organizationId} />
      </div>
    </details>
  );
}

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string }>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([requireSessionUser(), searchParams]);
  const primaryMembership = user.memberships[0] ?? null;

  if (!primaryMembership || !isLumeraOperator(user)) {
    return (
      <div style={pageStyle}>
        <section style={panelStyle}>
          <h1 style={{ marginTop: 0 }}>Empresas participantes</h1>
          <p style={{ marginBottom: 0 }}>Apenas usuarios da Lumera podem gerenciar empresas participantes.</p>
        </section>
      </div>
    );
  }

  const organizations = await getOrganizations();
  const organization = organizations.find((item) => item.id === primaryMembership.organizationId) ?? organizations[0] ?? null;
  const showCreateModal = resolvedSearchParams.modal === 'nova-empresa';

  if (!organization) {
    return (
      <div style={pageStyle}>
        <section style={panelStyle}>
          <h1 style={{ marginTop: 0 }}>Empresas participantes</h1>
          <p style={{ marginBottom: 0 }}>Nenhuma organizacao encontrada para este usuario.</p>
        </section>
      </div>
    );
  }

  const activeCompanies = organization.clientCompanies.filter((company) => company.isActive);
  const inactiveCompanies = organization.clientCompanies.filter((company) => !company.isActive);

  return (
    <>
      <div style={pageStyle}>
        <section>
          <div>
            <h1 style={{ marginBottom: 8 }}>Empresas participantes</h1>
            <p style={{ marginTop: 0, color: 'var(--muted)' }}>
              Consulte a base de empresas participantes e expanda cada linha para ver detalhes, status, configuracao financeira e documentacao obrigatoria.
            </p>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Empresas ativas</h2>
          <p style={{ color: 'var(--muted)' }}>
            Essas empresas ficam disponiveis no campo Empresa participante ao criar uma licitacao.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {activeCompanies.length ? (
              activeCompanies.map((company) => (
                <CompanyDetails key={company.id} company={company} organizationId={primaryMembership.organizationId} />
              ))
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhuma empresa ativa cadastrada.</p>
            )}
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Empresas inativas</h2>
          <p style={{ color: 'var(--muted)' }}>Empresas inativas nao aparecem mais na criacao de novas licitacoes, mas podem ser reativadas.</p>
          <div style={{ display: 'grid', gap: 12 }}>
            {inactiveCompanies.length ? (
              inactiveCompanies.map((company) => (
                <CompanyDetails key={company.id} company={company} organizationId={primaryMembership.organizationId} />
              ))
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhuma empresa inativa cadastrada.</p>
            )}
          </div>
        </section>
      </div>

      {showCreateModal ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 18, 10, 0.38)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 1000,
          }}
        >
          <Link
            href="/empresas"
            aria-label="Fechar modal de nova empresa"
            style={{
              position: 'absolute',
              inset: 0,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(1120px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              display: 'grid',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: '0 8px',
              }}
            >
              <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Nova empresa participante</div>
              <Link href="/empresas" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Fechar
              </Link>
            </div>

            <section style={panelStyle}>
              <CreateEmpresaForm
                organizationId={primaryMembership.organizationId}
                redirectToOnSuccess="/empresas"
                cancelHref="/empresas"
              />
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}


