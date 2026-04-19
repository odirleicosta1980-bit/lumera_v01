'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel entrar.' }));
      setError(data.message ?? 'Nao foi possivel entrar.');
      return;
    }

    startTransition(() => {
      router.push('/');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 16,
        background: 'rgba(255, 250, 242, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 24,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <label htmlFor="email" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue="admin@lumera.local"
          required
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid var(--line)', background: '#fff' }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue="Lumera@123"
          required
          style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid var(--line)', background: '#fff' }}
        />
      </div>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <button
        type="submit"
        disabled={isPending}
        style={{
          background: 'var(--accent)',
          color: '#fffaf2',
          border: 'none',
          borderRadius: 999,
          padding: '14px 18px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {isPending ? 'Entrando...' : 'Entrar no Lumera'}
      </button>
    </form>
  );
}
