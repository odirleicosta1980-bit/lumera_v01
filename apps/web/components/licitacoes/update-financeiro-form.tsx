'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FinancialRule, LicitacaoFinanceiro } from '../../lib/kanban-api';
import {
  formatCurrencyDisplay,
  formatCurrencyEditValue,
  formatDecimalInput,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

type UserOption = {
  id: string;
  name: string;
  roleCodes: string[];
};

type AllocationForm = {
  id: string;
  userId: string;
  label: string;
  percentual: string;
  valor: string;
};

type UpdateFinanceiroFormProps = {
  licitacaoId: string;
  financeiro?: LicitacaoFinanceiro | null;
  financialRule?: FinancialRule | null;
  users: UserOption[];
  canManageAllocations?: boolean;
};

const panelFieldStyle = {
  display: 'grid',
  gap: 6,
} as const;

const inputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid var(--border)',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.92)',
  font: 'inherit',
} as const;

const readOnlyInputStyle = {
  ...inputStyle,
  background: 'rgba(245, 239, 228, 0.95)',
  color: 'var(--muted)',
} as const;

const actionButtonStyle = {
  borderRadius: 999,
  border: 'none',
  background: 'var(--accent)',
  color: 'white',
  fontWeight: 700,
  padding: '10px 18px',
  cursor: 'pointer',
} as const;

const secondaryButtonStyle = {
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.78)',
  color: 'var(--foreground)',
  fontWeight: 600,
  padding: '10px 16px',
  cursor: 'pointer',
} as const;

const FUNCIONARIOS_OPTION = '__FUNCIONARIOS__';

function resolveAllocationUserId(allocation: LicitacaoFinanceiro['allocations'][number]) {
  if (allocation.user?.id) {
    return allocation.user.id;
  }

  if ((allocation.label ?? '').trim().toLowerCase() === 'funcionarios') {
    return FUNCIONARIOS_OPTION;
  }

  return '';
}

function getChargingModelLabel(value?: string | null) {
  switch (value) {
    case 'FIXO':
      return 'Fixo';
    case 'EXITO':
      return 'Exito';
    case 'FIXO_MAIS_EXITO':
      return 'Fixo + exito';
    case 'PERSONALIZADO':
      return 'Personalizado';
    default:
      return 'Nao informado';
  }
}

function getPaymentMethodLabel(value?: string | null) {
  switch (value) {
    case 'BOLETO':
      return 'Boleto';
    case 'PIX':
      return 'Pix';
    case 'TRANSFERENCIA':
      return 'Transferencia';
    case 'PARCELADO':
      return 'Parcelado';
    case 'FATURAMENTO':
      return 'Faturamento';
    case 'OUTRO':
      return 'Outro';
    default:
      return 'Nao informado';
  }
}

function parseDecimalLikeValue(value?: string | null) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createAllocation(id: string, userId = '', label = ''): AllocationForm {
  return {
    id,
    userId,
    label,
    percentual: '',
    valor: '',
  };
}

export function UpdateFinanceiroForm({
  licitacaoId,
  financeiro,
  financialRule,
  users,
  canManageAllocations = true,
}: UpdateFinanceiroFormProps) {
  const router = useRouter();
  const lumeraAdminUser = useMemo(
    () => users.find((user) => user.roleCodes.includes('LUMERA_ADMIN')) ?? null,
    [users],
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [valorEstimadoEdital, setValorEstimadoEdital] = useState(formatCurrencyEditValue(financeiro?.valorEstimadoEdital));
  const [valorPropostaEmpresa, setValorPropostaEmpresa] = useState(formatCurrencyEditValue(financeiro?.valorPropostaEmpresa));
  const [valorHomologado, setValorHomologado] = useState(formatCurrencyEditValue(financeiro?.valorHomologado));
  const [valorEstimadoEditalFocused, setValorEstimadoEditalFocused] = useState(false);
  const [valorPropostaEmpresaFocused, setValorPropostaEmpresaFocused] = useState(false);
  const [valorHomologadoFocused, setValorHomologadoFocused] = useState(false);
  const [statusFinanceiro, setStatusFinanceiro] = useState(financeiro?.statusFinanceiro ?? 'PENDENTE');
  const [vencimento, setVencimento] = useState(financeiro?.vencimento?.slice(0, 10) ?? '');
  const [observacoes, setObservacoes] = useState(financeiro?.observacoes ?? '');
  const [allocations, setAllocations] = useState<AllocationForm[]>(() => {
    const persistedAllocations = financeiro?.allocations.length
      ? financeiro.allocations.map((allocation) => ({
        id: allocation.id,
        userId: resolveAllocationUserId(allocation),
        label: allocation.label ?? '',
        percentual: formatDecimalInput(allocation.percentual),
        valor: formatCurrencyEditValue(allocation.valor),
      }))
      : [];

    if (persistedAllocations.length) {
      if (lumeraAdminUser && !persistedAllocations.some((allocation) => allocation.userId === lumeraAdminUser.id)) {
        return [createAllocation(crypto.randomUUID(), lumeraAdminUser.id, lumeraAdminUser.name), ...persistedAllocations];
      }

      return persistedAllocations;
    }

    if (lumeraAdminUser) {
      return [createAllocation(crypto.randomUUID(), lumeraAdminUser.id, lumeraAdminUser.name)];
    }

    return [createAllocation(crypto.randomUUID())];
  });

  const chargingModel = financialRule?.chargingModel ?? financeiro?.chargingModel ?? null;
  const percentualLumera = formatDecimalInput(financialRule?.percentualLumera ?? financeiro?.percentualLumera);
  const valorFixoLumera = formatCurrencyDisplay(financialRule?.valorFixoLumera ?? financeiro?.valorFixoLumera ?? 0);
  const formaPagamento = financialRule?.formaPagamento ?? financeiro?.formaPagamento ?? null;
  const valorTotalRateio = useMemo(() => {
    const percentual = parseDecimalLikeValue(percentualLumera);
    const valorBase = Number(normalizeCurrencyForSubmit(valorHomologado) || 0);
    return formatCurrencyDisplay((valorBase * percentual) / 100);
  }, [percentualLumera, valorHomologado]);
  const valorTotalRateioNumber = useMemo(
    () => Number(normalizeCurrencyForSubmit(valorTotalRateio) || 0),
    [valorTotalRateio],
  );
  const valorTotalAlocado = useMemo(
    () =>
      allocations.reduce((total, item) => {
        const percentual = parseDecimalLikeValue(item.percentual);
        if (!item.percentual.trim() || valorTotalRateioNumber <= 0) {
          return total;
        }

        return total + (valorTotalRateioNumber * percentual) / 100;
      }, 0),
    [allocations, valorTotalRateioNumber],
  );
  const adminAllocationId = useMemo(() => {
    if (!lumeraAdminUser) {
      return null;
    }

    return allocations.find((item) => item.userId === lumeraAdminUser.id)?.id ?? null;
  }, [allocations, lumeraAdminUser]);

  const regraFinanceiraTexto = useMemo(() => {
    if (!financialRule && !financeiro) {
      return 'A regra comercial da empresa participante ainda nao foi configurada.';
    }

    return 'Os dados comerciais da empresa participante sao aplicados automaticamente nesta licitacao.';
  }, [financialRule, financeiro]);

  function updateAllocation(id: string, field: keyof AllocationForm, value: string) {
    setAllocations((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === 'userId') {
          const selectedUser = users.find((user) => user.id === value);

          if (value === FUNCIONARIOS_OPTION) {
            return {
              ...item,
              userId: value,
              label: 'Funcionarios',
            };
          }

          return {
            ...item,
            userId: value,
            label:
              selectedUser?.roleCodes.includes('LUMERA_ADMIN')
                ? selectedUser.name
                : item.label === 'Funcionarios'
                  ? ''
                  : item.label,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  }

  function addAllocation() {
    setAllocations((current) => [
      ...current,
      createAllocation(crypto.randomUUID()),
    ]);
  }

  function removeAllocation(id: string) {
    if (adminAllocationId && id === adminAllocationId) {
      setError('A linha do Administrador Lumera e obrigatoria e nao pode ser removida.');
      return;
    }

    setAllocations((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (canManageAllocations && !adminAllocationId) {
      setError('Inclua uma linha de rateio para o usuario Administrador Lumera.');
      return;
    }

    if (canManageAllocations && valorTotalAlocado > valorTotalRateioNumber + 0.001) {
      setError('A soma dos valores do rateio nao pode ser maior que o Valor Total Rateio.');
      return;
    }

    const payload = {
      valorEstimadoEdital: normalizeCurrencyForSubmit(valorEstimadoEdital) || null,
      valorPropostaEmpresa: normalizeCurrencyForSubmit(valorPropostaEmpresa) || null,
      valorHomologado: normalizeCurrencyForSubmit(valorHomologado) || null,
      chargingModel,
      percentualLumera: percentualLumera.trim() || null,
      valorFixoLumera: normalizeCurrencyForSubmit(valorFixoLumera) || null,
      formaPagamento,
      statusFinanceiro,
      vencimento: vencimento || null,
      observacoes: observacoes.trim() || null,
      allocations: canManageAllocations
        ? allocations
            .filter((item) => item.label.trim() || item.userId === FUNCIONARIOS_OPTION)
            .map((item, index) => ({
              userId: item.userId && item.userId !== FUNCIONARIOS_OPTION ? item.userId : null,
              label: item.userId === FUNCIONARIOS_OPTION ? 'Funcionarios' : item.label.trim(),
              percentual: item.percentual.trim() || null,
              valor:
                item.percentual.trim()
                  ? normalizeCurrencyForSubmit(
                      formatCurrencyDisplay((valorTotalRateioNumber * parseDecimalLikeValue(item.percentual)) / 100),
                    ) || null
                  : null,
              sortOrder: index,
            }))
        : undefined,
    };

    const response = await fetch(`/api/licitacoes/${licitacaoId}/financeiro`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(result?.message ?? 'Nao foi possivel salvar os dados financeiros.');
      return;
    }

    setSuccess('Financeiro atualizado com sucesso.');
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{regraFinanceiraTexto}</div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        <label style={panelFieldStyle}>
          <span>Valor estimado do edital</span>
          <input
            style={inputStyle}
            value={valorEstimadoEditalFocused ? valorEstimadoEdital : getCurrencyFieldDisplay(valorEstimadoEdital)}
            onFocus={() => setValorEstimadoEditalFocused(true)}
            onBlur={() => setValorEstimadoEditalFocused(false)}
            onChange={(event) => setValorEstimadoEdital(sanitizeCurrencyEditInput(event.target.value))}
          />
        </label>
        <label style={panelFieldStyle}>
          <span>Valor da proposta</span>
          <input
            style={inputStyle}
            value={valorPropostaEmpresaFocused ? valorPropostaEmpresa : getCurrencyFieldDisplay(valorPropostaEmpresa)}
            onFocus={() => setValorPropostaEmpresaFocused(true)}
            onBlur={() => setValorPropostaEmpresaFocused(false)}
            onChange={(event) => setValorPropostaEmpresa(sanitizeCurrencyEditInput(event.target.value))}
          />
        </label>
        <label style={panelFieldStyle}>
          <span>Valor homologado</span>
          <input
            style={inputStyle}
            value={valorHomologadoFocused ? valorHomologado : getCurrencyFieldDisplay(valorHomologado)}
            onFocus={() => setValorHomologadoFocused(true)}
            onBlur={() => setValorHomologadoFocused(false)}
            onChange={(event) => setValorHomologado(sanitizeCurrencyEditInput(event.target.value))}
          />
        </label>
        <label style={panelFieldStyle}>
          <span>Modelo de cobranca</span>
          <input style={readOnlyInputStyle} value={getChargingModelLabel(chargingModel)} readOnly />
        </label>
        <label style={panelFieldStyle}>
          <span>% da Lumera</span>
          <input style={readOnlyInputStyle} value={percentualLumera} readOnly />
        </label>
        <label style={panelFieldStyle}>
          <span>Valor Total Rateio</span>
          <input style={readOnlyInputStyle} value={valorTotalRateio} readOnly />
        </label>
        <label style={panelFieldStyle}>
          <span>Valor fixo da Lumera</span>
          <input style={readOnlyInputStyle} value={valorFixoLumera} readOnly />
        </label>
        <label style={panelFieldStyle}>
          <span>Forma de pagamento</span>
          <input style={readOnlyInputStyle} value={getPaymentMethodLabel(formaPagamento)} readOnly />
        </label>
        <label style={panelFieldStyle}>
          <span>Status financeiro</span>
          <select style={inputStyle} value={statusFinanceiro} onChange={(event) => setStatusFinanceiro(event.target.value)}>
            <option value="PENDENTE">Pendente</option>
            <option value="FATURADO">Faturado</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="NAO_APLICAVEL">Nao aplicavel</option>
          </select>
        </label>
        <label style={panelFieldStyle}>
          <span>Vencimento</span>
          <input style={inputStyle} type="date" value={vencimento} onChange={(event) => setVencimento(event.target.value)} />
        </label>
      </div>

      <label style={panelFieldStyle}>
        <span>Observacoes</span>
        <textarea
          style={{ ...inputStyle, minHeight: 76, resize: 'vertical' }}
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
        />
      </label>

      {canManageAllocations ? (
        <section style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong>Rateio interno da Lumera</strong>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Soma do rateio: {formatCurrencyDisplay(valorTotalAlocado)} de {valorTotalRateio}
            </div>
          </div>
          <button type="button" style={secondaryButtonStyle} onClick={addAllocation}>
            Adicionar rateio
          </button>
        </div>

        {allocations.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhum rateio cadastrado ainda. Use o botao acima para incluir.</p>
        ) : null}

        {allocations.map((allocation) => {
          const percentualAllocation = parseDecimalLikeValue(allocation.percentual);
          const calculatedValue =
            allocation.percentual.trim() && valorTotalRateioNumber > 0
              ? formatCurrencyDisplay((valorTotalRateioNumber * percentualAllocation) / 100)
              : '';

          const isAdminAllocation = Boolean(lumeraAdminUser && allocation.userId === lumeraAdminUser.id);

          return (
          <div
            key={allocation.id}
            style={{
              display: 'grid',
              rowGap: 10,
              columnGap: 18,
              gridTemplateColumns: 'minmax(220px, 1.15fr) minmax(240px, 1fr) minmax(110px, 130px) minmax(150px, 170px) minmax(120px, auto)',
              alignItems: 'start',
            }}
          >
            <label style={panelFieldStyle}>
              <span>Usuario</span>
              <select value={allocation.userId} onChange={(event) => updateAllocation(allocation.id, 'userId', event.target.value)} style={inputStyle}>
                <option value="">Nao vinculado</option>
                <option value={FUNCIONARIOS_OPTION}>Funcionarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={panelFieldStyle}>
              <span>Descricao do rateio</span>
              <input style={inputStyle} value={allocation.label} onChange={(event) => updateAllocation(allocation.id, 'label', event.target.value)} />
            </label>

            <label style={panelFieldStyle}>
              <span>%</span>
              <input style={inputStyle} value={allocation.percentual} onChange={(event) => updateAllocation(allocation.id, 'percentual', event.target.value)} />
            </label>

            <label style={panelFieldStyle}>
              <span>Valor</span>
              <input style={readOnlyInputStyle} value={calculatedValue} readOnly />
            </label>

            <div style={panelFieldStyle}>
              <span>Acao</span>
              {isAdminAllocation ? (
                <div
                  style={{
                    ...readOnlyInputStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Obrigatorio
                </div>
              ) : (
                <button type="button" style={{ ...secondaryButtonStyle, minHeight: 44 }} onClick={() => removeAllocation(allocation.id)}>
                  Remover
                </button>
              )}
            </div>
          </div>
          );
        })}
        </section>
      ) : null}

      {error ? <p style={{ color: '#8f3b2e', margin: 0 }}>{error}</p> : null}
      {success ? <p style={{ color: '#265f45', margin: 0 }}>{success}</p> : null}

      <div>
        <button type="submit" disabled={isPending} style={actionButtonStyle}>
          {isPending ? 'Salvando...' : 'Salvar financeiro'}
        </button>
      </div>
    </form>
  );
}
