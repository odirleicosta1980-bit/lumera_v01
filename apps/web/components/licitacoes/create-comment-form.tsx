'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function CreateCommentForm({ licitacaoId, allowInternal = true }: { licitacaoId: string; allowInternal?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: String(formData.get('body') ?? ''),
        isInternal: allowInternal ? formData.get('isInternal') === 'on' : false,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel criar o comentario.' }));
      setError(data.message ?? 'Nao foi possivel criar o comentario.');
      return;
    }

    form.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
      <textarea name="body" placeholder="Escreva um comentario" rows={4} required style={{ ...inputStyle, resize: 'vertical' }} />
      {allowInternal ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14 }}>
          <input name="isInternal" type="checkbox" />
          Marcar como interno (visivel apenas para a equipe Lumera)
        </label>
      ) : null}
      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}
      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? 'Salvando...' : 'Adicionar comentario'}
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
