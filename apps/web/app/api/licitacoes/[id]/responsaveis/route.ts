import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/licitacoes/${id}/responsaveis`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar os responsaveis.' }));
  return NextResponse.json(data, { status: response.status });
}
