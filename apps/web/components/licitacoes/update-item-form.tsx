'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LicitacaoItem } from '../../lib/kanban-api';
import {
  formatCurrencyEditValue,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

export function UpdateItemForm({ licitacaoId, item }: { licitacaoId: string; item: LicitacaoItem }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [numeroItem, setNumeroItem] = useState(item.numeroItem ?? '');
  const [numeroLote, setNumeroLote] = useState(item.numeroLote ?? '');
  const [descricao, setDescricao] = useState(item.descricao);
  const [unidade, setUnidade] = useState(item.unidade ?? '');
  const [quantidade, setQuantidade] = useState(item.quantidade ?? '');
  const [valorReferencia, setValorReferencia] = useState(formatCurrencyEditValue(item.valorReferencia ?? ''));
  const [valorProposto, setValorProposto] = useState(formatCurrencyEditValue(item.valorProposto ?? ''));
  const [isValorReferenciaFocused, setIsValorReferenciaFocused] = useState(false);
  const [isValorPropostoFocused, setIsValorPropostoFocused] = useState(false);
  const [marcaModelo, setMarcaModelo] = useState(item.marcaModelo ?? '');
  const [observacoes, setObservacoes] = useState(item.observacoes ?? '');
  const [status, setStatus] = useState(item.status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/itens/${item.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numeroItem,
        numeroLote,
        descricao,
        unidade,
        quantidade,
        valorReferencia: normalizeCurrencyForSubmit(valorReferencia) || undefined,
        valorProposto: normalizeCurrencyForSubmit(valorProposto) || undefined,
        marcaModelo,
        observacoes,
        status,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel atualizar o item.' }));
      setError(data.message ?? 'Nao foi possivel atualizar o item.');
      return;
    }

    setIsEditing(false);
    startTransition(() => router.refresh());
  }

  if (!isEditing) {
    return (
      <button type='button' onClick={() => setIsEditing(true)} style={secondaryButtonStyle}>
        Editar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <input value={numeroItem} onChange={(event) => setNumeroItem(event.target.value)} placeholder='Numero do item' style={inputStyle} />
        <input value={numeroLote} onChange={(event) => setNumeroLote(event.target.value)} placeholder='Numero do lote' style={inputStyle} />
        <input value={unidade} onChange={(event) => setUnidade(event.target.value)} placeholder='Unidade' style={inputStyle} />
        <input value={quantidade} onChange={(event) => setQuantidade(event.target.value)} placeholder='Quantidade' style={inputStyle} />
      </div>

      <input value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder='Descricao do item' required style={inputStyle} />

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
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
        <input value={marcaModelo} onChange={(event) => setMarcaModelo(event.target.value)} placeholder='Marca / modelo' style={inputStyle} />
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
          <option value='PENDENTE'>Pendente</option>
          <option value='EM_PRECIFICACAO'>Em precificacao</option>
          <option value='PRECIFICADO'>Precificado</option>
          <option value='DESCARTADO'>Descartado</option>
        </select>
      </div>

      <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder='Observacoes do item' rows={3} style={inputStyle} />

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type='submit' disabled={isPending} style={primaryButtonStyle}>
          {isPending ? 'Salvando...' : 'Salvar item'}
        </button>
        <button type='button' onClick={() => setIsEditing(false)} style={secondaryButtonStyle}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: 10,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const primaryButtonStyle = {
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  background: '#fff',
  color: 'var(--accent)',
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
