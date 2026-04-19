'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FinancialRule } from '../../lib/kanban-api';
import {
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

type CompanyFinanceProps = {
  organizationId: string;
  company: {
    id: string;
    legalName: string;
    tradeName: string | null;
    financialRule?: FinancialRule | null;
  };
};

export function UpdateEmpresaFinanceiroForm({ organizationId, company }: CompanyFinanceProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [valorFixoLumera, setValorFixoLumera] = useState(formatCurrencyEditValue(company.financialRule?.valorFixoLumera ?? ''));
  const [isValorFixoFocused, setIsValorFixoFocused] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      organizationId,
      chargingModel: formData.get('chargingModel')?.toString() ?? 'EXITO',
      percentualLumera: formData.get('percentualLumera')?.toString().trim() || null,
      valorFixoLumera: normalizeCurrencyForSubmit(valorFixoLumera) || null,
      formaPagamento: formData.get('formaPagamento')?.toString() || null,
      observacoesFinanceiras: formData.get('observacoesFinanceiras')?.toString().trim() || null,
    };

    const response = await fetch(`/api/empresas/${company.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? 'Nao foi possivel atualizar o financeiro da empresa.');
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
      <strong>Financeiro da empresa participante</strong>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Modelo de cobranca</span>
          <select name="chargingModel" defaultValue={company.financialRule?.chargingModel ?? 'EXITO'}>
            {COBRANCA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>% da Lumera</span>
          <input
            name="percentualLumera"
            type="text"
            inputMode="decimal"
            placeholder="10,00"
            defaultValue={company.financialRule?.percentualLumera ?? ''}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Valor fixo</span>
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
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Forma de pagamento</span>
          <select name="formaPagamento" defaultValue={company.financialRule?.formaPagamento ?? ''}>
            {PAGAMENTO_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: 'grid', gap: 6 }}>
        <span>Observacoes financeiras</span>
        <textarea
          name="observacoesFinanceiras"
          rows={2}
          placeholder="Observacoes da regra comercial desta empresa."
          defaultValue={company.financialRule?.observacoes ?? ''}
        />
      </label>
      {error ? <p style={{ color: '#b42318', margin: 0 }}>{error}</p> : null}
      <div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar financeiro'}
        </button>
      </div>
    </form>
  );
}
