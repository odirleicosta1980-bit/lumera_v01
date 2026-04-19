'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DeactivateUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDeactivate() {
    setError(null);
    const confirmed = window.confirm(`Deseja inativar o usuario "${userName}"?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel inativar o usuario.' }));
      setError(data.message ?? 'Nao foi possivel inativar o usuario.');
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <button type='button' onClick={handleDeactivate} disabled={isPending} style={dangerButtonStyle}>
        {isPending ? 'Inativando...' : 'Inativar'}
      </button>
      {error ? <div style={{ color: '#a4301d', fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

const dangerButtonStyle = {
  background: 'transparent',
  color: '#a4301d',
  border: '1px solid rgba(164, 48, 29, 0.25)',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
