'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '../../lib/server-auth';
import { LogoutButton } from './logout-button';

export function AppHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const primaryMembership = user.memberships[0];
  const isLumeraOperator = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );
  const clientCompanyName = primaryMembership?.clientCompanyName ?? primaryMembership?.organizationName ?? user.email;
  const primaryAction =
    pathname === '/empresas'
      ? { href: '/empresas?modal=nova-empresa', label: 'Nova empresa' }
      : { href: '/licitacoes?modal=nova-licitacao', label: 'Nova licitacao' };

  return (
    <header style={{ display: 'grid', gap: 16, padding: '18px 28px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href='/' style={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--accent)' }}>
            {isLumeraOperator ? 'Lumera Licitacoes' : 'Portal do Cliente'}
          </Link>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>
            {primaryMembership?.roleName ?? 'Usuario autenticado'}
          </span>
          {isLumeraOperator ? (
            <>
              <Link href='/' style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>
                Dashboard
              </Link>
              <Link href='/licitacoes' style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>
                Licitacoes
              </Link>
              <Link href='/empresas' style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>
                Empresas
              </Link>
              <Link href='/usuarios' style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>
                Usuarios
              </Link>
              <Link href='/relatorios' style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>
                Relatorios
              </Link>
            </>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {isLumeraOperator ? (
            <Link
              href={primaryAction.href}
              style={{
                background: 'var(--accent)',
                color: '#fffaf2',
                padding: '10px 16px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {primaryAction.label}
            </Link>
          ) : null}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{clientCompanyName}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

