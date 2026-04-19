import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ACCESS_TOKEN_COOKIE = 'lumera_access_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  lastLoginAt?: string | null;
  memberships: Array<{
    membershipId: string;
    organizationId: string;
    organizationName: string;
    clientCompanyId: string | null;
    clientCompanyName: string | null;
    scopeType: string;
    roleCode: string;
    roleName: string;
  }>;
};

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function requireAccessToken() {
  const token = await getAccessToken();

  if (!token) {
    redirect('/login');
  }

  return token;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SessionUser;
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function clearAccessToken() {
  (await cookies()).delete(ACCESS_TOKEN_COOKIE);
  (await cookies()).delete('lumera_refresh_token');
}
