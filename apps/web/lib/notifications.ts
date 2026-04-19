import 'server-only';

import { redirect } from 'next/navigation';
import { requireAccessToken } from './server-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  status: string;
  actionUrl?: string | null;
  createdAt: string;
};

export async function getNotifications() {
  const token = await requireAccessToken();
  const response = await fetch(`${API_URL}/api/notifications`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    redirect('/login');
  }

  if (!response.ok) {
    return [] as AppNotification[];
  }

  return (await response.json()) as AppNotification[];
}
