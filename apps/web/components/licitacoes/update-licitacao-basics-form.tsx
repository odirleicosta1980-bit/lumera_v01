'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type UpdateLicitacaoBasicsFormProps = {
  licitacao: {
    id: string;
    titulo: string;
    numeroProcesso?: string | null;
    descricao?: string | null;
    dataSessao?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function UpdateLicitacaoBasicsForm({
  licitacao,
  onSuccess,
  onCancel,
}: UpdateLicitacaoBasicsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState(licitacao.titulo);
  const [numeroProcesso, setNumeroProcesso] = useState(licitacao.numeroProcesso ?? '');
  const [dataSessao, setDataSessao] = useState(toDateTimeLocalValue(licitacao.dataSessao));
  const [descricao, setDescricao] = useState(licitacao.descricao ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/licitacoes/${licitacao.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo: titulo.trim(),
        numeroProcesso: numeroProcesso.trim() || undefined,
        dataSessao: dataSessao ? new Date(dataSessao).toISOString() : undefined,
        descricao: descricao.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar os dados da licitacao.' }));
      setError(data.message ?? 'Nao foi possivel atualizar os dados da licitacao.');
      return;
    }

    startTransition(() => {
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 16,
        background: 'rgba(255, 250, 242, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Editar dados da licitacao</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Atualize os dados basicos desta licitacao, como titulo, processo, data da sessao e descricao.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label style={fieldStyle}>
          <span>Titulo</span>
          <input value={titulo} onChange={(event) => setTitulo(event.target.value)} required style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Numero do processo</span>
          <input value={numeroProcesso} onChange={(event) => setNumeroProcesso(event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Data da sessao</span>
          <input type='datetime-local' value={dataSessao} onChange={(event) => setDataSessao(event.target.value)} style={inputStyle} />
        </label>
      </div>

      <label style={fieldStyle}>
        <span>Descricao</span>
        <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Salvar dados'}
        </button>
        {onCancel ? (
          <button type='button' onClick={onCancel} style={cancelButtonStyle}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

const fieldStyle = { display: 'grid', gap: 6 } as const;
const inputStyle = {
  width: '100%',
  padding: 12,
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
const cancelButtonStyle = {
  background: 'transparent',
  color: 'var(--accent)',
  border: 'none',
  padding: '10px 4px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
