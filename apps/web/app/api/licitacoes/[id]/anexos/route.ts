import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Arquivo nao enviado.' }, { status: 400 });
  }

  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(file.name);
  const relativeDirectory = path.join('uploads', 'licitacoes', id);
  const relativePath = path.join(relativeDirectory, `${timestamp}_${safeFileName}`);
  const outputDirectory = path.join(process.cwd(), 'public', relativeDirectory);
  const outputPath = path.join(process.cwd(), 'public', relativePath);

  await mkdir(outputDirectory, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(outputPath, buffer);

  const response = await fetch(`${API_URL}/api/licitacoes/${id}/anexos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: `${timestamp}_${safeFileName}`,
      originalFileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buffer.byteLength,
      storageKey: `/${relativePath.replace(/\\/g, '/')}`,
    }),
  });

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel registrar o anexo.' }));
  return NextResponse.json(data, { status: response.status });
}
