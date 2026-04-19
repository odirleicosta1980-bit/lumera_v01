'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORY_OPTIONS = [
  { value: 'DOCUMENTO_EMPENHO', label: 'Documento do empenho' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'COMPROVANTE_PAGAMENTO', label: 'Comprovante de pagamento' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

export function UploadEmpenhoAnexoForm({ licitacaoId, empenhoId }: { licitacaoId: string; empenhoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]['value']>('DOCUMENTO_EMPENHO');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('category', category);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/empenhos/${empenhoId}/anexos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel enviar o arquivo do empenho.' }));
      setError(data.message ?? 'Nao foi possivel enviar o arquivo do empenho.');
      return;
    }

    form.reset();
    setCategory('DOCUMENTO_EMPENHO');
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginTop: 14 }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(180px, 220px) 1fr auto', alignItems: 'end' }}>
        <label style={fieldStyle}>
          <span>Tipo de arquivo</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORY_OPTIONS)[number]['value'])} style={inputStyle}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <input name='file' type='file' required style={inputStyle} />
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Enviando...' : 'Anexar arquivo'}
        </button>
      </div>
      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}
    </form>
  );
}

const fieldStyle = {
  display: 'grid',
  gap: 6,
} as const;

const inputStyle = {
  width: '100%',
  padding: 10,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const buttonStyle = {
  justifySelf: 'start',
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;