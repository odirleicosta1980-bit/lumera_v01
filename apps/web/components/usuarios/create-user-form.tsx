'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ParticipatingCompany } from '../../lib/kanban-api';

const ROLE_OPTIONS = [
  { code: 'LUMERA_ADMIN', label: 'Lumera Admin' },
  { code: 'LUMERA_OPERACIONAL', label: 'Lumera Operacional' },
  { code: 'CLIENTE_CONSULTA', label: 'Cliente Consulta' },
] as const;

export function CreateUserForm({
  organizationId,
  companies,
  onSuccess,
  onCancel,
}: {
  organizationId: string;
  companies: ParticipatingCompany[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('LUMERA_OPERACIONAL');
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
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      roleCode: String(formData.get('roleCode') ?? ''),
      clientCompanyId: isClientRole ? String(formData.get('clientCompanyId') ?? '') : undefined,
    };

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel cadastrar o usuario.' }));
      setError(data.message ?? 'Nao foi possivel cadastrar o usuario.');
      return;
    }

    form.reset();
    setSelectedRole('LUMERA_OPERACIONAL');
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
        <h2 style={{ margin: '0 0 6px' }}>Novo usuario</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Cadastre usuarios internos da Lumera ou usuarios das empresas participantes. Usuarios ativos podem ser escolhidos como responsaveis.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label htmlFor="name" style={labelStyle}>Nome completo</label>
          <input id="name" name="name" required style={inputStyle} />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>E-mail</label>
          <input id="email" name="email" type="email" required style={inputStyle} />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Senha inicial</label>
          <input id="password" name="password" type="password" minLength={8} required style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label htmlFor="roleCode" style={labelStyle}>Perfil</label>
          <select
            id="roleCode"
            name="roleCode"
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
            <label htmlFor="clientCompanyId" style={labelStyle}>Empresa participante</label>
            <select id="clientCompanyId" name="clientCompanyId" required style={inputStyle} defaultValue="">
              <option value="" disabled>
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
        <button type="submit" disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Cadastrar usuario'}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} style={cancelButtonStyle}>
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
