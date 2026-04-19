import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; documentTypeId: string }> },
) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const { id, documentTypeId } = await context.params;
  const formData = await request.formData();
  const organizationId = String(formData.get('organizationId') ?? '');
  const issueDate = formData.get('issueDate');
  const expirationDate = formData.get('expirationDate');
  const observations = formData.get('observations');
  const status = formData.get('status');
  const file = formData.get('file');

  const payload: Record<string, unknown> = {
    issueDate: typeof issueDate === 'string' && issueDate ? issueDate : undefined,
    expirationDate: typeof expirationDate === 'string' && expirationDate ? expirationDate : undefined,
    observations: typeof observations === 'string' ? observations : undefined,
    status: typeof status === 'string' && status ? status : undefined,
  };

  if (file instanceof File && file.size > 0) {
    const timestamp = Date.now();
    const safeFileName = sanitizeFileName(file.name);
    const relativeDirectory = path.join('uploads', 'empresas', id, 'documentos', documentTypeId);
    const relativePath = path.join(relativeDirectory, `${timestamp}_${safeFileName}`);
    const outputDirectory = path.join(process.cwd(), 'public', relativeDirectory);
    const outputPath = path.join(process.cwd(), 'public', relativePath);

    await mkdir(outputDirectory, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(outputPath, buffer);

    payload.fileName = `${timestamp}_${safeFileName}`;
    payload.originalFileName = file.name;
    payload.mimeType = file.type || 'application/octet-stream';
    payload.sizeBytes = buffer.byteLength;
    payload.storageKey = `/${relativePath.replace(/\\/g, '/')}`;
  }

  const response = await fetch(
    `${API_URL}/api/organizations/${organizationId}/client-companies/${id}/documents/${documentTypeId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar o documento da empresa.' }));
  return NextResponse.json(data, { status: response.status });
}
