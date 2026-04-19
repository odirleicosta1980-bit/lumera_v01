'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AppNotification } from '../../lib/notifications';

export function NotificationsPanel({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!notifications.length) {
    return null;
  }

  const unreadCount = notifications.filter((notification) => notification.status !== 'READ').length;

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });

    startTransition(() => router.refresh());
  }

  return (
    <section
      style={{
        background: 'rgba(255, 250, 242, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: 16,
        boxShadow: 'var(--shadow)',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong>Notificacoes internas</strong>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{unreadCount} novas</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 12,
              background: notification.status === 'READ' ? '#fff' : '#fff7e8',
            }}
          >
            <div style={{ fontWeight: 700 }}>{notification.title}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 8px' }}>{notification.body}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: 'UTC',
                }).format(new Date(notification.createdAt))}
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {notification.status !== 'READ' ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => markAsRead(notification.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {isPending ? '...' : 'Marcar como lida'}
                  </button>
                ) : null}
                {notification.actionUrl ? (
                  <Link href={notification.actionUrl} style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
                    Abrir
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
