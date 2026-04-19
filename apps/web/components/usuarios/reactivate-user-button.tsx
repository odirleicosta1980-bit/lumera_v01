'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function ReactivateUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleReactivate() {
    setError(null);
    const confirmed = window.confirm(`Deseja reativar o usuario "${userName}"?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/users/${userId}/reactivate`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel reativar o usuario.' }));
      setError(data.message ?? 'Nao foi possivel reativar o usuario.');
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <button type='button' onClick={handleReactivate} disabled={isPending} style={buttonStyle}>
        {isPending ? 'Reativando...' : 'Reativar'}
      </button>
      {error ? <div style={{ color: '#a4301d', fontSize: 13 }}>{error}</div> : null}
    </div>
  );
}

const buttonStyle = {
  background: 'transparent',
  color: 'var(--accent)',
  border: '1px solid rgba(125, 63, 29, 0.25)',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
