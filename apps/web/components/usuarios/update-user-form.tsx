'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AssignableUser, ParticipatingCompany } from '../../lib/kanban-api';

const ROLE_OPTIONS = [
  { code: 'LUMERA_ADMIN', label: 'Lumera Admin' },
  { code: 'LUMERA_OPERACIONAL', label: 'Lumera Operacional' },
  { code: 'CLIENTE_CONSULTA', label: 'Cliente Consulta' },
] as const;

export function UpdateUserForm({
  organizationId,
  user,
  companies,
  onSuccess,
  onCancel,
}: {
  organizationId: string;
  user: AssignableUser;
  companies: ParticipatingCompany[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const activeMembership = user.memberships.find((membership) => membership.organizationId === organizationId) ?? user.memberships[0];
  const [selectedRole, setSelectedRole] = useState<string>(activeMembership?.roleCode ?? 'LUMERA_OPERACIONAL');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCompanies = useMemo(() => companies.filter((company) => company.isActive), [companies]);
  const isClientRole = selectedRole.startsWith('CLIENTE_');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const body = {
      organizationId,
      roleCode: String(formData.get('roleCode') ?? ''),
      clientCompanyId: isClientRole ? String(formData.get('clientCompanyId') ?? '') : undefined,
    };

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar o usuario.' }));
      setError(data.message ?? 'Nao foi possivel atualizar o usuario.');
      return;
    }

    onSuccess?.();
    startTransition(() => router.refresh());
  }

  return (
    <form
      onSubmit={handleSubmit}
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
        <h2 style={{ margin: '0 0 6px' }}>Editar usuario</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Atualize o perfil e o escopo do usuario cadastrado.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label htmlFor='edit-user-name' style={labelStyle}>Nome completo</label>
          <input id='edit-user-name' value={user.name} disabled style={readOnlyInputStyle} />
        </div>
        <div>
          <label htmlFor='edit-user-email' style={labelStyle}>E-mail</label>
          <input id='edit-user-email' value={user.email} disabled style={readOnlyInputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label htmlFor='edit-user-roleCode' style={labelStyle}>Perfil</label>
          <select
            id='edit-user-roleCode'
            name='roleCode'
            required
            style={inputStyle}
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.code} value={role.code}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {isClientRole ? (
          <div>
            <label htmlFor='edit-user-clientCompanyId' style={labelStyle}>Empresa participante</label>
            <select
              id='edit-user-clientCompanyId'
              name='clientCompanyId'
              required
              style={inputStyle}
              defaultValue={activeMembership?.clientCompanyId ?? ''}
            >
              <option value='' disabled>
                Selecione a empresa
              </option>
              {activeCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName ?? company.legalName}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Salvar alteracoes'}
        </button>
        {onCancel ? (
          <button type='button' onClick={onCancel} style={cancelButtonStyle}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const readOnlyInputStyle = {
  ...inputStyle,
  background: 'rgba(125, 63, 29, 0.06)',
  color: 'var(--muted)',
} as const;

const labelStyle = {
  display: 'block',
  fontWeight: 700,
  marginBottom: 8,
} as const;

const buttonStyle = {
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const cancelButtonStyle = {
  background: 'transparent',
  color: 'var(--accent)',
  border: 'none',
  padding: 0,
  fontWeight: 700,
  cursor: 'pointer',
} as const;
