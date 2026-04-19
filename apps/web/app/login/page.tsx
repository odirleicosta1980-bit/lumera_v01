import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '../../components/auth/login-form';

export default async function LoginPage() {
  const accessToken = (await cookies()).get('lumera_access_token')?.value;

  if (accessToken) {
    redirect('/');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <section style={{ width: '100%', maxWidth: 460, display: 'grid', gap: 18 }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: 'var(--accent)' }}>
            Lumera Licitacoes
          </div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Acesso da operacao</h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Entre com o usuario inicial do ambiente para acessar o Kanban real de licitacoes e seguir a evolucao do MVP.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
