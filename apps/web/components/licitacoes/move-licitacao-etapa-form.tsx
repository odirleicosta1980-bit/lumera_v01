'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type MoveLicitacaoEtapaFormProps = {
  licitacaoId: string;
  currentEtapaId: string;
  etapas: Array<{
    id: string;
    name: string;
  }>;
};

export function MoveLicitacaoEtapaForm({ licitacaoId, currentEtapaId, etapas }: MoveLicitacaoEtapaFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const etapaId = String(formData.get('etapaId') ?? '');

    const response = await fetch(`/api/licitacoes/${licitacaoId}/etapa`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ etapaId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel mover a licitacao.' }));
      setError(data.message ?? 'Nao foi possivel mover a licitacao.');
      return;
    }

    startTransition(() => {
      router.push('/licitacoes');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div>
        <label htmlFor="etapaId" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          Mover para etapa
        </label>
        <select id="etapaId" name="etapaId" defaultValue={currentEtapaId} style={inputStyle}>
          {etapas.map((etapa) => (
            <option key={etapa.id} value={etapa.id}>
              {etapa.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <button
        type="submit"
        disabled={isPending}
        style={{
          justifySelf: 'start',
          background: 'var(--accent)',
          color: '#fffaf2',
          border: 'none',
          borderRadius: 999,
          padding: '12px 18px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {isPending ? 'Movendo...' : 'Salvar etapa'}
      </button>
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
