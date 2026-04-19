'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatCurrencyEditValue,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

type CreateItemFormProps = {
  licitacaoId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CreateItemForm({ licitacaoId, onSuccess, onCancel }: CreateItemFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [numeroItem, setNumeroItem] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [descricao, setDescricao] = useState('');
  const [unidade, setUnidade] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valorReferencia, setValorReferencia] = useState('');
  const [valorProposto, setValorProposto] = useState('');
  const [isValorReferenciaFocused, setIsValorReferenciaFocused] = useState(false);
  const [isValorPropostoFocused, setIsValorPropostoFocused] = useState(false);
  const [marcaModelo, setMarcaModelo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState('PENDENTE');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/itens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numeroItem: numeroItem || undefined,
        numeroLote: numeroLote || undefined,
        descricao,
        unidade: unidade || undefined,
        quantidade: quantidade || undefined,
        valorReferencia: normalizeCurrencyForSubmit(valorReferencia) || undefined,
        valorProposto: normalizeCurrencyForSubmit(valorProposto) || undefined,
        marcaModelo: marcaModelo || undefined,
        observacoes: observacoes || undefined,
        status,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel adicionar o item.' }));
      setError(data.message ?? 'Nao foi possivel adicionar o item.');
      return;
    }

    setNumeroItem('');
    setNumeroLote('');
    setDescricao('');
    setUnidade('');
    setQuantidade('');
    setValorReferencia('');
    setValorProposto('');
    setMarcaModelo('');
    setObservacoes('');
    setStatus('PENDENTE');

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
        <h2 style={{ margin: '0 0 6px' }}>Novo item</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Registre manualmente os itens da licitacao para acompanhar precificacao, referencia e proposta.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <label style={fieldStyle}>
          <span>Numero do item</span>
          <input value={numeroItem} onChange={(event) => setNumeroItem(event.target.value)} placeholder='Numero do item' style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Numero do lote</span>
          <input value={numeroLote} onChange={(event) => setNumeroLote(event.target.value)} placeholder='Numero do lote' style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Unidade</span>
          <input value={unidade} onChange={(event) => setUnidade(event.target.value)} placeholder='Unidade' style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Quantidade</span>
          <input value={quantidade} onChange={(event) => setQuantidade(event.target.value)} placeholder='Quantidade' style={inputStyle} />
        </label>
      </div>

      <label style={fieldStyle}>
        <span>Descricao do item</span>
        <input value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder='Descricao do item' required style={inputStyle} />
      </label>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <label style={fieldStyle}>
          <span>Valor de referencia</span>
          <input
            value={isValorReferenciaFocused ? valorReferencia : getCurrencyFieldDisplay(valorReferencia)}
            onFocus={() => {
              setIsValorReferenciaFocused(true);
              setValorReferencia(formatCurrencyEditValue(valorReferencia));
            }}
            onBlur={() => {
              setIsValorReferenciaFocused(false);
              setValorReferencia(formatCurrencyEditValue(valorReferencia));
            }}
            onChange={(event) => setValorReferencia(sanitizeCurrencyEditInput(event.target.value))}
            placeholder='R$ 0,00'
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          <span>Valor proposto</span>
          <input
            value={isValorPropostoFocused ? valorProposto : getCurrencyFieldDisplay(valorProposto)}
            onFocus={() => {
              setIsValorPropostoFocused(true);
              setValorProposto(formatCurrencyEditValue(valorProposto));
            }}
            onBlur={() => {
              setIsValorPropostoFocused(false);
              setValorProposto(formatCurrencyEditValue(valorProposto));
            }}
            onChange={(event) => setValorProposto(sanitizeCurrencyEditInput(event.target.value))}
            placeholder='R$ 0,00'
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          <span>Marca / modelo</span>
          <input value={marcaModelo} onChange={(event) => setMarcaModelo(event.target.value)} placeholder='Marca / modelo' style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
            <option value='PENDENTE'>Pendente</option>
            <option value='EM_PRECIFICACAO'>Em precificacao</option>
            <option value='PRECIFICADO'>Precificado</option>
            <option value='DESCARTADO'>Descartado</option>
          </select>
        </label>
      </div>

      <label style={fieldStyle}>
        <span>Observacoes</span>
        <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder='Observacoes do item' rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Adicionar item'}
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
