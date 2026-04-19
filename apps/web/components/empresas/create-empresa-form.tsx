'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatCpfCnpj,
  formatCurrencyEditValue,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

const COBRANCA_OPTIONS = [
  { value: 'EXITO', label: 'Exito' },
  { value: 'FIXO', label: 'Fixo' },
  { value: 'FIXO_MAIS_EXITO', label: 'Fixo + exito' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
] as const;

const PAGAMENTO_OPTIONS = [
  { value: '', label: 'Nao informado' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'FATURAMENTO', label: 'Faturamento' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

type CreateEmpresaFormProps = {
  organizationId: string;
  redirectToOnSuccess?: string;
  cancelHref?: string;
};

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

export function CreateEmpresaForm({ organizationId, redirectToOnSuccess, cancelHref }: CreateEmpresaFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [taxId, setTaxId] = useState('');
  const [valorFixoLumera, setValorFixoLumera] = useState('');
  const [isValorFixoFocused, setIsValorFixoFocused] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      organizationId,
      legalName: formData.get('legalName')?.toString().trim() ?? '',
      tradeName: formData.get('tradeName')?.toString().trim() || null,
      taxId: taxId.trim() || null,
      segmento: formData.get('segmento')?.toString().trim() || null,
      notes: formData.get('notes')?.toString().trim() || null,
      chargingModel: formData.get('chargingModel')?.toString() ?? 'EXITO',
      percentualLumera: formData.get('percentualLumera')?.toString().trim() || null,
      valorFixoLumera: normalizeCurrencyForSubmit(valorFixoLumera) || null,
      formaPagamento: formData.get('formaPagamento')?.toString() || null,
      observacoesFinanceiras: formData.get('observacoesFinanceiras')?.toString().trim() || null,
    };

    if (!payload.legalName) {
      setError('Informe a razao social da empresa participante.');
      return;
    }

    if (!payload.percentualLumera) {
      setError('Informe o % da Lumera. O valor pode ser 0, mas precisa ser preenchido.');
      return;
    }

    const response = await fetch('/api/empresas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? 'Nao foi possivel cadastrar a empresa participante.');
      return;
    }

    form.reset();
    setTaxId('');
    setValorFixoLumera('');
    setIsValorFixoFocused(false);

    startTransition(() => {
      if (redirectToOnSuccess) {
        router.push(redirectToOnSuccess);
        return;
      }

      router.refresh();
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
        <h2 style={{ margin: '0 0 6px' }}>Nova empresa participante</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Cadastre a empresa cliente que sera representada pela Lumera nas licitacoes.
        </p>
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Razao social</span>
          <input name="legalName" type="text" placeholder="Copos Plasticos LTDA" required style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Nome fantasia</span>
          <input name="tradeName" type="text" placeholder="Copos Plasticos" style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>CNPJ/CPF</span>
          <input name="taxId" type="text" placeholder="00.000.000/0001-00" value={taxId} onChange={(event) => setTaxId(formatCpfCnpj(event.target.value))} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Segmento</span>
          <input name="segmento" type="text" placeholder="Industria plastica" style={inputStyle} />
        </label>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Modelo de cobranca</span>
          <select name="chargingModel" defaultValue="EXITO" style={inputStyle}>
            {COBRANCA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>% da Lumera</span>
          <input name="percentualLumera" type="text" inputMode="decimal" placeholder="10,00" required style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Valor fixo da Lumera</span>
          <input
            name="valorFixoLumera"
            type="text"
            inputMode="decimal"
            placeholder="R$ 0,00"
            value={isValorFixoFocused ? valorFixoLumera : getCurrencyFieldDisplay(valorFixoLumera)}
            onFocus={() => {
              setIsValorFixoFocused(true);
              setValorFixoLumera(formatCurrencyEditValue(valorFixoLumera));
            }}
            onBlur={() => {
              setIsValorFixoFocused(false);
              setValorFixoLumera(formatCurrencyEditValue(valorFixoLumera));
            }}
            onChange={(event) => setValorFixoLumera(sanitizeCurrencyEditInput(event.target.value))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Forma de pagamento</span>
          <select name="formaPagamento" defaultValue="" style={inputStyle}>
            {PAGAMENTO_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={{ display: 'grid', gap: 8 }}>
        <span>Observacoes</span>
        <textarea name="notes" rows={3} placeholder="Informacoes gerais da empresa participante." style={{ ...inputStyle, resize: 'vertical' }} />
      </label>
      <label style={{ display: 'grid', gap: 8 }}>
        <span>Observacoes financeiras</span>
        <textarea name="observacoesFinanceiras" rows={3} placeholder="Regras especificas de cobranca, divisao ou excecoes comerciais." style={{ ...inputStyle, resize: 'vertical' }} />
      </label>

      {error ? <p style={{ color: '#b42318', margin: 0 }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            background: 'var(--accent)',
            color: '#fffaf2',
            border: 'none',
            borderRadius: 999,
            padding: '12px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Cadastrando...' : 'Cadastrar empresa participante'}
        </button>
        {cancelHref ? (
          <Link href={cancelHref} style={{ color: 'var(--accent)', fontWeight: 700, padding: '12px 4px' }}>
            Cancelar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
