'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyDocument } from '../../lib/kanban-api';

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const STATUS_OPTIONS = [
  { value: '', label: 'Calcular automaticamente' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'NAO_APLICAVEL', label: 'Nao aplicavel' },
] as const;

export function UpdateEmpresaDocumentoForm({
  organizationId,
  companyId,
  document,
}: {
  organizationId: string;
  companyId: string;
  document: CompanyDocument;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('organizationId', organizationId);

    const response = await fetch(`/api/empresas/${companyId}/documentos/${document.documentType.id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar o documento da empresa.' }));
      setError(data.message ?? 'Nao foi possivel atualizar o documento da empresa.');
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Status</span>
          <select name='status' defaultValue={document.storedStatus === 'NAO_APLICAVEL' ? 'NAO_APLICAVEL' : ''} style={inputStyle}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'auto'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Data de emissao</span>
          <input
            name='issueDate'
            type='date'
            defaultValue={document.issueDate ? document.issueDate.slice(0, 10) : ''}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Data de vencimento</span>
          <input
            name='expirationDate'
            type='date'
            defaultValue={document.expirationDate ? document.expirationDate.slice(0, 10) : ''}
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Arquivo</span>
        <input name='file' type='file' style={inputStyle} />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Observacoes</span>
        <textarea
          name='observations'
          rows={3}
          defaultValue={document.observations ?? ''}
          placeholder='Observacoes sobre vigencia, renovacao ou conferencias deste documento.'
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      {error ? <div style={{ color: '#b42318', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type='submit'
          disabled={isPending}
          style={{
            background: 'var(--accent)',
            color: '#fffaf2',
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Salvando...' : 'Salvar documento'}
        </button>

        {document.storageKey ? (
          <a href={document.storageKey} target='_blank' rel='noreferrer' style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Abrir arquivo atual
          </a>
        ) : null}
      </div>
    </form>
  );
}
