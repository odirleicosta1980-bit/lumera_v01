'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function UploadAnexoForm({ licitacaoId }: { licitacaoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/anexos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel enviar o anexo.' }));
      setError(data.message ?? 'Nao foi possivel enviar o anexo.');
      return;
    }

    form.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
      <input name="file" type="file" required style={inputStyle} />
      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}
      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? 'Enviando...' : 'Enviar anexo'}
      </button>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const buttonStyle = {
  justifySelf: 'start',
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
