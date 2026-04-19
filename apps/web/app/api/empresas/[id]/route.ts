import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;
  const organizationId = String(body.organizationId ?? '');

  const response = await fetch(`${API_URL}/api/organizations/${organizationId}/client-companies/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isActive: body.isActive,
      chargingModel: body.chargingModel,
      percentualLumera: body.percentualLumera,
      valorFixoLumera: body.valorFixoLumera,
      formaPagamento: body.formaPagamento,
      observacoesFinanceiras: body.observacoesFinanceiras,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}