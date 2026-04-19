import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  const token = (await cookies()).get('lumera_access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const organizationId = String(formData.get('organizationId') ?? '').trim();

  if (!organizationId) {
    return NextResponse.json({ message: 'Organizacao obrigatoria para importar edital.' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Selecione um arquivo PDF textual ou TXT.' }, { status: 400 });
  }

  const originalFileName = file.name || 'edital';
  const extension = path.extname(originalFileName).toLowerCase();
  const normalizedMimeType = file.type || (extension === '.txt' ? 'text/plain' : extension === '.pdf' ? 'application/pdf' : '');

  if (!['text/plain', 'application/pdf'].includes(normalizedMimeType) && !['.txt', '.pdf'].includes(extension)) {
    return NextResponse.json({ message: 'Formato nao suportado. Envie um PDF textual ou TXT.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = createHash('sha256').update(buffer).digest('hex');
  const safeFileName = sanitizeFileName(originalFileName);
  const timestamp = Date.now();
  const relativeStorageKey = `/uploads/importacoes/${organizationId}/${timestamp}_${safeFileName}`;
  const absoluteStoragePath = path.join(process.cwd(), 'public', relativeStorageKey.replace(/^\//, '').replace(/\//g, path.sep));

  await mkdir(path.dirname(absoluteStoragePath), { recursive: true });
  await writeFile(absoluteStoragePath, buffer);

  const response = await fetch(`${API_URL}/api/licitacoes/importacao/analisar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      organizationId,
      fileName: `${timestamp}_${safeFileName}`,
      originalFileName,
      mimeType: normalizedMimeType,
      sizeBytes: buffer.byteLength,
      storageKey: relativeStorageKey,
      checksumSha256,
      contentBase64: buffer.toString('base64'),
    }),
  });

  const data = await response.json().catch(() => ({ message: 'Nao foi possivel analisar o edital enviado.' }));
  return NextResponse.json(data, { status: response.status });
}