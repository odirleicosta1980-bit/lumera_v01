import Link from 'next/link';
import { CreateLicitacaoForm } from '../../components/create-licitacao-form';
import { ManageEtapasModal } from '../../components/etapas/manage-etapas-modal';
import { FilterableKanban } from '../../components/licitacoes/filterable-kanban';
import { ImportEditalModal } from '../../components/licitacoes/import-edital-modal';
import { getAssignableUsers, getEtapasForManagement, getKanbanData, getOrganizations } from '../../lib/kanban-api';
import { requireSessionUser } from '../../lib/server-auth';

export default async function LicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string }>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([requireSessionUser(), searchParams]);
  const primaryMembership = user.memberships[0];
  const canCreate = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );
  const isClientView = !canCreate;
  const showCreateModal = canCreate && resolvedSearchParams.modal === 'nova-licitacao';
  const showImportModal = canCreate && resolvedSearchParams.modal === 'importar-edital';
  const showManageColumnsModal = canCreate && resolvedSearchParams.modal === 'gerenciar-colunas';

  const [stages, organizations, assignableUsers, etapasForManagement] = await Promise.all([
    getKanbanData(primaryMembership.organizationId),
    getOrganizations(),
    canCreate ? getAssignableUsers(primaryMembership.organizationId) : Promise.resolve([]),
    showManageColumnsModal ? getEtapasForManagement(primaryMembership.organizationId) : Promise.resolve([]),
  ]);

  const currentOrganization =
    organizations.find((organization) => organization.id === primaryMembership.organizationId) ?? organizations[0];
  const participatingCompanies = (currentOrganization?.clientCompanies ?? []).filter((company) => company.isActive);

  return (
    <>
      <main style={{ padding: 32, display: 'grid', gap: 24 }}>
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <h1 style={{ margin: 0 }}>{isClientView ? 'Portal da empresa cliente' : 'Modulo de Licitacoes'}</h1>
              <p style={{ color: 'var(--muted)', maxWidth: 760, lineHeight: 1.6, marginBottom: 0 }}>
                {isClientView
                  ? 'Acompanhe as licitacoes compartilhadas com sua empresa, consulte comentarios visiveis, anexos e etapas do processo.'
                  : 'Use o quadro para acompanhar o fluxo das licitacoes. A gestao das colunas do Kanban fica disponivel apenas para a equipe da Lumera.'}
              </p>
            </div>

            {canCreate ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  href="/licitacoes?modal=importar-edital#quadro"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    background: '#fff',
                  }}
                >
                  Importar edital
                </Link>
                <Link
                  href="/licitacoes?modal=gerenciar-colunas#quadro"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    background: '#fff',
                  }}
                >
                  Gerenciar colunas
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <div id="quadro">
          <FilterableKanban stages={stages} showFilter={canCreate} showOwners={canCreate} canDrag={canCreate} />
        </div>
      </main>

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
            href="/licitacoes#quadro"
            aria-label="Fechar modal de nova licitacao"
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
              <div>
                <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                  Nova licitacao
                </div>
                <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                  Inclua uma nova licitacao sem sair do contexto do quadro.
                </div>
              </div>
              <Link href="/licitacoes#quadro" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Fechar
              </Link>
            </div>

            <CreateLicitacaoForm
              organizationId={primaryMembership.organizationId}
              defaultClientCompanyId={primaryMembership.clientCompanyId}
              companies={participatingCompanies}
              etapas={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
              users={assignableUsers}
              defaultResponsavelIds={[user.id]}
              redirectToOnSuccess="/licitacoes#quadro"
              cancelHref="/licitacoes#quadro"
            />
          </div>
        </div>
      ) : null}

      {showImportModal ? (
        <ImportEditalModal
          organizationId={primaryMembership.organizationId}
          companies={participatingCompanies}
          etapas={stages.map((stage) => ({ id: stage.id, name: stage.name }))}
          users={assignableUsers}
          defaultResponsavelIds={[user.id]}
          closeHref="/licitacoes#quadro"
        />
      ) : null}

      {showManageColumnsModal ? (
        <ManageEtapasModal
          organizationId={primaryMembership.organizationId}
          etapas={etapasForManagement}
          closeHref="/licitacoes#quadro"
        />
      ) : null}
    </>
  );
}
