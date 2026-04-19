'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type AssignResponsaveisFormProps = {
  licitacaoId: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  selectedUserIds: string[];
};

export function AssignResponsaveisForm({ licitacaoId, users, selectedUserIds }: AssignResponsaveisFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const userIds = formData.getAll('userIds').map((value) => String(value));

    const response = await fetch(`/api/licitacoes/${licitacaoId}/responsaveis`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar os responsaveis.' }));
      setError(data.message ?? 'Nao foi possivel atualizar os responsaveis.');
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <label htmlFor="userIds" style={{ display: 'block', fontWeight: 700 }}>
        Responsaveis da licitacao
      </label>
      <select id="userIds" name="userIds" multiple defaultValue={selectedUserIds} style={{ ...inputStyle, minHeight: 140 }}>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Use Ctrl para selecionar mais de um responsavel.</div>
      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}
      <button type="submit" disabled={isPending} style={buttonStyle}>
        {isPending ? 'Salvando...' : 'Salvar responsaveis'}
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
