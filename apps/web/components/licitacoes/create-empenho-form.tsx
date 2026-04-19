'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatCurrencyEditValue,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

type CreateEmpenhoFormProps = {
  licitacaoId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CreateEmpenhoForm({ licitacaoId, onSuccess, onCancel }: CreateEmpenhoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [codigoEmpenho, setCodigoEmpenho] = useState('');
  const [valor, setValor] = useState('');
  const [isValorFocused, setIsValorFocused] = useState(false);
  const [dataEmpenho, setDataEmpenho] = useState('');
  const [dataPagamentoEmpenho, setDataPagamentoEmpenho] = useState('');
  const [dataGeracaoBoleto, setDataGeracaoBoleto] = useState('');
  const [dataPagamentoBoleto, setDataPagamentoBoleto] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/licitacoes/${licitacaoId}/empenhos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codigoEmpenho,
        valor: normalizeCurrencyForSubmit(valor),
        dataEmpenho: dataEmpenho || undefined,
        dataPagamentoEmpenho: dataPagamentoEmpenho || undefined,
        dataGeracaoBoleto: dataGeracaoBoleto || undefined,
        dataPagamentoBoleto: dataPagamentoBoleto || undefined,
        observacoes: observacoes || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel adicionar o empenho.' }));
      setError(data.message ?? 'Nao foi possivel adicionar o empenho.');
      return;
    }

    setCodigoEmpenho('');
    setValor('');
    setIsValorFocused(false);
    setDataEmpenho('');
    setDataPagamentoEmpenho('');
    setDataGeracaoBoleto('');
    setDataPagamentoBoleto('');
    setObservacoes('');

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
        <h2 style={{ margin: '0 0 6px' }}>Novo empenho</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Registre os dados do empenho para acompanhar os pagamentos da empresa nesta licitacao.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <label style={fieldStyle}>
          <span>Empenho</span>
          <input value={codigoEmpenho} onChange={(event) => setCodigoEmpenho(event.target.value)} placeholder='Numero/codigo do empenho' required style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Valor</span>
          <input
            value={isValorFocused ? valor : getCurrencyFieldDisplay(valor)}
            onFocus={() => {
              setIsValorFocused(true);
              setValor(formatCurrencyEditValue(valor));
            }}
            onBlur={() => {
              setIsValorFocused(false);
              setValor(formatCurrencyEditValue(valor));
            }}
            onChange={(event) => setValor(sanitizeCurrencyEditInput(event.target.value))}
            placeholder='R$ 0,00'
            required
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          <span>Data empenho</span>
          <input type='date' value={dataEmpenho} onChange={(event) => setDataEmpenho(event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Data pagamento do empenho</span>
          <input type='date' value={dataPagamentoEmpenho} onChange={(event) => setDataPagamentoEmpenho(event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Data geracao boleto</span>
          <input type='date' value={dataGeracaoBoleto} onChange={(event) => setDataGeracaoBoleto(event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          <span>Data pagamento boleto</span>
          <input type='date' value={dataPagamentoBoleto} onChange={(event) => setDataPagamentoBoleto(event.target.value)} style={inputStyle} />
        </label>
      </div>

      <label style={fieldStyle}>
        <span>Observacoes</span>
        <textarea
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
          placeholder='Observacoes do empenho'
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Adicionar empenho'}
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
const inputStyle = { width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: '#fff' } as const;
const buttonStyle = { justifySelf: 'start', background: 'var(--accent)', color: '#fffaf2', border: 'none', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' } as const;
const cancelButtonStyle = { background: 'transparent', color: 'var(--accent)', border: 'none', padding: '10px 4px', fontWeight: 700, cursor: 'pointer' } as const;
