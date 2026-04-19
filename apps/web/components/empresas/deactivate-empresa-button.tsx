'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DeactivateEmpresaButton({
  companyId,
  organizationId,
  isActive,
}: {
  companyId: string;
  organizationId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleToggleStatus() {
    setError(null);

    const response = await fetch(`/api/empresas/${companyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        isActive: !isActive,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        message: `Nao foi possivel ${isActive ? 'inativar' : 'reativar'} a empresa participante.`,
      }));
      setError(data.message ?? `Nao foi possivel ${isActive ? 'inativar' : 'reativar'} a empresa participante.`);
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={isPending}
        style={{
          background: '#fff',
          color: 'var(--accent)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '10px 14px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {isPending ? (isActive ? 'Inativando...' : 'Reativando...') : isActive ? 'Inativar' : 'Reativar'}
      </button>
      {error ? <div style={{ color: '#a4301d', fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}
