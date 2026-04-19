import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const { id, itemId } = await context.params;
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/licitacoes/${id}/itens/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar o item.' }));
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const { id, itemId } = await context.params;

  const response = await fetch(`${API_URL}/api/licitacoes/${id}/itens/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel remover o item.' }));
  return NextResponse.json(data, { status: response.status });
}