'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    startTransition(() => {
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      style={{
        border: '1px solid var(--line)',
        background: '#fffaf2',
        borderRadius: 999,
        padding: '10px 14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {isPending ? 'Saindo...' : 'Sair'}
    </button>
  );
}
