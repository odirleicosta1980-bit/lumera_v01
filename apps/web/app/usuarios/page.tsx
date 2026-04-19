import { CreateUserModal } from '../../components/usuarios/create-user-modal';
import { DeactivateUserButton } from '../../components/usuarios/deactivate-user-button';
import { ReactivateUserButton } from '../../components/usuarios/reactivate-user-button';
import { UpdateUserModal } from '../../components/usuarios/update-user-modal';
import { getAssignableUsers, getOrganizations } from '../../lib/kanban-api';
import { requireSessionUser } from '../../lib/server-auth';

export default async function UsuariosPage() {
  const [user, organizations] = await Promise.all([requireSessionUser(), getOrganizations()]);
  const canManage = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );
  const isLumeraAdmin = user.memberships.some((membership) => membership.roleCode === 'LUMERA_ADMIN');

  if (!canManage) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Acesso restrito</h1>
        <p style={{ color: 'var(--muted)' }}>Somente a equipe Lumera pode gerenciar usuarios.</p>
      </main>
    );
  }

  const primaryMembership = user.memberships[0];
  const currentOrganization = organizations.find((organization) => organization.id === primaryMembership.organizationId) ?? organizations[0];
  const users = await getAssignableUsers(primaryMembership.organizationId, true);
  const companies = currentOrganization?.clientCompanies ?? [];
  const activeUsers = users.filter((listedUser) => listedUser.isActive);
  const inactiveUsers = users.filter((listedUser) => !listedUser.isActive);

  return (
    <main style={{ padding: 32, display: 'grid', gap: 24 }}>
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Usuarios</h1>
        <CreateUserModal organizationId={primaryMembership.organizationId} companies={companies} />
      </section>

      <section>
        <p style={{ color: 'var(--muted)', marginTop: 0, maxWidth: 760 }}>
          Cadastre usuarios da equipe Lumera ou das empresas participantes. Usuarios ativos vinculados a organizacao ja podem ser escolhidos como responsaveis nas licitacoes.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 14,
          background: 'rgba(255, 250, 242, 0.88)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: 20,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Usuarios ativos</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Todos os usuarios ativos desta lista podem ser associados as licitacoes de acordo com o perfil e o escopo configurados.
          </p>
        </div>

        {activeUsers.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {activeUsers.map((listedUser) => (
              <article
                key={listedUser.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 14,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{listedUser.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>{listedUser.email}</div>
                </div>
                {isLumeraAdmin ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <UpdateUserModal
                      organizationId={primaryMembership.organizationId}
                      user={listedUser}
                      companies={companies}
                    />
                    <DeactivateUserButton userId={listedUser.id} userName={listedUser.name} />
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {listedUser.memberships.map((membership) => (
                    <span
                      key={membership.id}
                      style={{
                        border: '1px solid rgba(125, 63, 29, 0.18)',
                        background: 'rgba(125, 63, 29, 0.08)',
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}
                    >
                      {membership.roleName}
                      {membership.clientCompanyName ? ` - ${membership.clientCompanyName}` : ''}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum usuario ativo cadastrado no momento.</p>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gap: 14,
          background: 'rgba(255, 250, 242, 0.88)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: 20,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Usuarios inativos</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Usuarios inativos nao aparecem nas selecoes operacionais, mas podem ser reativados pelo Lumera Admin quando necessario.
          </p>
        </div>

        {inactiveUsers.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {inactiveUsers.map((listedUser) => (
              <article
                key={listedUser.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 14,
                  display: 'grid',
                  gap: 8,
                  opacity: 0.9,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{listedUser.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>{listedUser.email}</div>
                </div>
                {isLumeraAdmin ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <ReactivateUserButton userId={listedUser.id} userName={listedUser.name} />
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {listedUser.memberships.map((membership) => (
                    <span
                      key={membership.id}
                      style={{
                        border: '1px solid rgba(125, 63, 29, 0.18)',
                        background: 'rgba(125, 63, 29, 0.08)',
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}
                    >
                      {membership.roleName}
                      {membership.clientCompanyName ? ` - ${membership.clientCompanyName}` : ''}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum usuario inativo cadastrado no momento.</p>
        )}
      </section>
    </main>
  );
}
