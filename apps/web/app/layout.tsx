import './globals.css';
import type { Metadata } from 'next';
import { AppHeader } from '../components/auth/app-header';
import { getSessionUser } from '../lib/server-auth';

export const metadata: Metadata = {
  title: 'Lumera Licitacoes',
  description: 'SaaS de gestao de licitacoes operado pela Lumera',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="pt-BR">
      <body>
        {user ? <AppHeader user={user} /> : null}
        {children}
      </body>
    </html>
  );
}
