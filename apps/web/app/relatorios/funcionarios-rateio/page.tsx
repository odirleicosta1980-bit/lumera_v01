import Link from 'next/link';
import { Fragment } from 'react';
import { redirect } from 'next/navigation';
import {
  fetchApi,
  getAssignableUsers,
  getLicitacao,
  type AssignableUser,
  type FinanceiroAllocation,
  type LicitacaoDetail,
} from '../../../lib/kanban-api';
import { requireSessionUser } from '../../../lib/server-auth';

type LicitacaoListItem = {
  id: string;
};

type FuncionarioRateioRow = {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  empresa: string;
  licitacaoId: string;
  licitacaoTitulo: string;
  numeroProcesso?: string | null;
  etapa: string;
  dataSessao?: string | null;
  chargingModel: string;
  percentualLumera: number;
  valorHomologado: number;
  valorTotalRateio: number;
  valorRepasse: number;
  criterioRateio: string;
  observacoes?: string | null;
};

type FuncionarioGroup = {
  funcionarioId: string;
  funcionarioNome: string;
  totalRateio: number;
  rows: FuncionarioRateioRow[];
};

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function parseMoney(value?: string | null) {
  if (!value) return 0;

  const trimmed = value.trim();
  const normalized =
    trimmed.includes(',') && trimmed.includes('.')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.includes(',')
        ? trimmed.replace(',', '.')
        : trimmed;
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function parsePercent(value?: string | null) {
  return parseMoney(value);
}

function buildRateioLabel(allocation: FinanceiroAllocation) {
  if (allocation.percentual) {
    return `${allocation.label} (${allocation.percentual}%)`;
  }

  if (allocation.valor) {
    return `${allocation.label} (${allocation.valor})`;
  }

  return allocation.label;
}

function getOperationalUsers(users: AssignableUser[], organizationId: string) {
  return users.filter((user) =>
    user.memberships.some(
      (membership) => membership.organizationId === organizationId && membership.roleCode === 'LUMERA_OPERACIONAL',
    ),
  );
}

function toMonthValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const reference = new Date(Date.UTC(year, (month || 1) - 1, 1));
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(reference);
}

function belongsToMonth(value: string | null | undefined, month: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` === month;
}

function buildRowsForLicitacao(detail: LicitacaoDetail, operationalUsers: AssignableUser[]) {
  const financeiro = detail.financeiro;
  if (!financeiro?.allocations?.length) {
    return [] as FuncionarioRateioRow[];
  }

  const company = detail.clientCompany.tradeName ?? detail.clientCompany.legalName;
  const valorHomologado =
    parseMoney(financeiro.valorHomologado) ||
    parseMoney(financeiro.valorPropostaEmpresa) ||
    parseMoney(financeiro.valorEstimadoEdital) ||
    0;
  const valorTotalRateio = parseMoney(financeiro.valorReceitaLumera);
  const percentualLumera = parsePercent(financeiro.percentualLumera);

  return financeiro.allocations.flatMap((allocation) => {
    const allocationValue = parseMoney(allocation.valor);
    if (allocationValue <= 0) {
      return [] as FuncionarioRateioRow[];
    }

    const normalizedLabel = (allocation.label ?? '').trim().toLowerCase();
    const criterioRateio = buildRateioLabel(allocation);

    if (!allocation.userId && normalizedLabel === 'funcionarios') {
      if (!operationalUsers.length) {
        return [
          {
            id: `${detail.id}-${allocation.id}-funcionarios`,
            funcionarioId: 'funcionarios',
            funcionarioNome: 'Funcionarios',
            empresa: company,
            licitacaoId: detail.id,
            licitacaoTitulo: detail.titulo,
            numeroProcesso: detail.numeroProcesso,
            etapa: detail.etapa.name,
            dataSessao: detail.dataSessao,
            chargingModel: financeiro.chargingModel,
            percentualLumera,
            valorHomologado,
            valorTotalRateio,
            valorRepasse: allocationValue,
            criterioRateio,
            observacoes: financeiro.observacoes,
          },
        ];
      }

      const valorPorFuncionario = allocationValue / operationalUsers.length;
      return operationalUsers.map((user) => ({
        id: `${detail.id}-${allocation.id}-${user.id}`,
        funcionarioId: user.id,
        funcionarioNome: user.name,
        empresa: company,
        licitacaoId: detail.id,
        licitacaoTitulo: detail.titulo,
        numeroProcesso: detail.numeroProcesso,
        etapa: detail.etapa.name,
        dataSessao: detail.dataSessao,
        chargingModel: financeiro.chargingModel,
        percentualLumera,
        valorHomologado,
        valorTotalRateio,
        valorRepasse: valorPorFuncionario,
        criterioRateio: `${criterioRateio} dividido entre ${operationalUsers.length} funcionario(s)`,
        observacoes: financeiro.observacoes,
      }));
    }

    const funcionarioNome = allocation.user?.name ?? allocation.label;
    const funcionarioId = allocation.userId ?? `label-${normalizedLabel || allocation.id}`;

    return [
      {
        id: `${detail.id}-${allocation.id}`,
        funcionarioId,
        funcionarioNome,
        empresa: company,
        licitacaoId: detail.id,
        licitacaoTitulo: detail.titulo,
        numeroProcesso: detail.numeroProcesso,
        etapa: detail.etapa.name,
        chargingModel: financeiro.chargingModel,
        percentualLumera,
        valorHomologado,
        valorTotalRateio,
        valorRepasse: allocationValue,
        criterioRateio,
        observacoes: financeiro.observacoes,
      },
    ];
  });
}

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article
      style={{
        background: 'rgba(255, 250, 242, 0.82)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: 18,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, margin: '10px 0 8px' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{hint}</div>
    </article>
  );
}

export default async function RelatorioFuncionariosRateioPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; month?: string }>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([requireSessionUser(), searchParams]);
  const isLumeraAdmin = user.memberships.some((membership) => membership.roleCode === 'LUMERA_ADMIN');

  if (!isLumeraAdmin) {
    redirect('/');
  }

  const primaryMembership = user.memberships[0] ?? null;
  if (!primaryMembership) {
    redirect('/');
  }

  const selectedCompany = resolvedSearchParams.company?.trim() ?? '';
  const selectedMonth =
    resolvedSearchParams.month && /^\d{4}-\d{2}$/.test(resolvedSearchParams.month)
      ? resolvedSearchParams.month
      : toMonthValue(new Date());

  const [licitacoes, users] = await Promise.all([
    fetchApi<LicitacaoListItem[]>('/api/licitacoes'),
    getAssignableUsers(primaryMembership.organizationId),
  ]);
  const details = await Promise.all(licitacoes.map((licitacao) => getLicitacao(licitacao.id)));
  const operationalUsers = getOperationalUsers(users, primaryMembership.organizationId);

  const allRows = details.flatMap((detail) => buildRowsForLicitacao(detail, operationalUsers));
  const companyOptions = Array.from(new Set(allRows.map((row) => row.empresa))).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const filteredRows = allRows
    .filter((row) => belongsToMonth(row.dataSessao, selectedMonth))
    .filter((row) => (selectedCompany ? row.empresa === selectedCompany : true))
    .sort((a, b) => {
      const funcionarioComparison = a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR');
      if (funcionarioComparison !== 0) return funcionarioComparison;

      const empresaComparison = a.empresa.localeCompare(b.empresa, 'pt-BR');
      if (empresaComparison !== 0) return empresaComparison;

      const dateA = rowDateValue(a.dataSessao);
      const dateB = rowDateValue(b.dataSessao);
      if (dateA !== dateB) return dateA - dateB;

      return a.licitacaoTitulo.localeCompare(b.licitacaoTitulo, 'pt-BR');
    });

  const groupedMap = new Map<string, FuncionarioGroup>();

  filteredRows.forEach((row) => {
    const existing = groupedMap.get(row.funcionarioId);
    if (existing) {
      existing.rows.push(row);
      existing.totalRateio += row.valorRepasse;
      return;
    }

    groupedMap.set(row.funcionarioId, {
      funcionarioId: row.funcionarioId,
      funcionarioNome: row.funcionarioNome,
      totalRateio: row.valorRepasse,
      rows: [row],
    });
  });

  const groups = Array.from(groupedMap.values()).sort((a, b) => {
    if (b.totalRateio !== a.totalRateio) return b.totalRateio - a.totalRateio;
    return a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR');
  });

  const totalRateioDistribuido = filteredRows.reduce((sum, row) => sum + row.valorRepasse, 0);
  const totalRateioLicitacoes = Array.from(new Set(filteredRows.map((row) => row.licitacaoId))).reduce((sum, licitacaoId) => {
    const row = filteredRows.find((item) => item.licitacaoId === licitacaoId);
    return sum + (row?.valorTotalRateio ?? 0);
  }, 0);

  return (
    <main style={{ padding: '32px 28px 48px', display: 'grid', gap: 24 }}>
      <section
        style={{
          background: 'rgba(255, 250, 242, 0.72)',
          border: '1px solid var(--line)',
          borderRadius: 28,
          padding: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: 'var(--accent)' }}>
              Relatorio consolidado
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.02 }}>
              Funcionarios x Rateio
            </h1>
          <p style={{ maxWidth: 920, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, margin: 0 }}>
              Visao direta do rateio definido em cada licitacao, agrupando por funcionario sem considerar os empenhos do processo.
          </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href='/relatorios'
              style={{
                border: '1px solid var(--line)',
                padding: '14px 18px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Voltar aos relatorios
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          background: 'rgba(255, 250, 242, 0.86)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: 20,
          boxShadow: 'var(--shadow)',
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Filtros</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Consulte o rateio por funcionario e filtre por periodo e empresa participante quando precisar focar em uma carteira especifica.
          </p>
        </div>

        <form method='get' style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'end' }}>
          <label style={fieldStyle}>
            <span>Periodo</span>
            <input type='month' name='month' defaultValue={selectedMonth} style={inputStyle} />
          </label>

          <label style={fieldStyle}>
            <span>Empresa</span>
            <select name='company' defaultValue={selectedCompany} style={inputStyle}>
              <option value=''>Todas as empresas</option>
              {companyOptions.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type='submit' style={actionButtonStyle}>
              Aplicar filtros
            </button>
            <Link href='/relatorios/funcionarios-rateio' style={secondaryButtonStyle}>
              Limpar
            </Link>
          </div>
        </form>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <SummaryCard label='Periodo' value={monthLabel(selectedMonth)} hint='Competencia pela data da sessao' />
        <SummaryCard label='Funcionarios' value={groups.length} hint='Com rateio encontrado nos filtros atuais' />
        <SummaryCard label='Licitacoes' value={new Set(filteredRows.map((row) => row.licitacaoId)).size} hint='Com rateio definido' />
        <SummaryCard label='Rateio distribuido' value={formatMoney(totalRateioDistribuido)} hint='Soma das linhas do relatorio' />
        <SummaryCard label='Base de rateio' value={formatMoney(totalRateioLicitacoes)} hint='Soma do Valor Total Rateio das licitacoes filtradas' />
      </section>

      <section
        style={{
          background: 'rgba(255, 250, 242, 0.86)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: 20,
          boxShadow: 'var(--shadow)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Detalhamento por funcionario</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Cada linha abaixo mostra o valor de rateio definido para o funcionario dentro de cada licitacao.
          </p>
        </div>

        {groups.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1280 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                <th style={headerCellStyle}>Funcionario</th>
                <th style={headerCellStyle}>Total do funcionario</th>
                <th style={headerCellStyle}>Licitacao</th>
                <th style={headerCellStyle}>Empresa</th>
                <th style={headerCellStyle}>Processo</th>
                <th style={headerCellStyle}>Data da sessao</th>
                <th style={headerCellStyle}>Etapa</th>
                <th style={headerCellStyle}>Modelo de cobranca</th>
                <th style={headerCellStyle}>% da Lumera</th>
                <th style={headerCellStyle}>Valor homologado</th>
                <th style={headerCellStyle}>Valor Total Rateio</th>
                <th style={headerCellStyle}>Valor do funcionario</th>
                <th style={headerCellStyle}>Criterio do rateio</th>
                <th style={headerCellStyle}>Observacoes</th>
                <th style={headerCellStyle}>Acao</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.funcionarioId}>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={groupCellStyle}>
                      <div style={{ fontWeight: 800 }}>{group.funcionarioNome}</div>
                    </td>
                    <td style={groupCellStyle}>
                      <strong>{formatMoney(group.totalRateio)}</strong>
                    </td>
                    <td style={mutedCellStyle} colSpan={13}>
                      Rateios definidos nas licitacoes
                    </td>
                  </tr>

                  {group.rows.map((row, index) => {
                    const isLastRow = index === group.rows.length - 1;
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: isLastRow ? '1px solid var(--line)' : 'none',
                          background: '#fffaf5',
                        }}
                      >
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}>{row.licitacaoTitulo}</td>
                        <td style={subCellStyle}>{row.empresa}</td>
                        <td style={subCellStyle}>{row.numeroProcesso ?? '-'}</td>
                        <td style={subCellStyle}>{formatDate(row.dataSessao)}</td>
                        <td style={subCellStyle}>{row.etapa}</td>
                        <td style={subCellStyle}>{row.chargingModel}</td>
                        <td style={subCellStyle}>{row.percentualLumera ? `${row.percentualLumera}%` : '-'}</td>
                        <td style={subCellStyle}>{formatMoney(row.valorHomologado)}</td>
                        <td style={subCellStyle}>{formatMoney(row.valorTotalRateio)}</td>
                        <td style={subCellStyle}><strong>{formatMoney(row.valorRepasse)}</strong></td>
                        <td style={subCellStyle}>{row.criterioRateio}</td>
                        <td style={subCellStyle}>{row.observacoes || '-'}</td>
                        <td style={subCellStyle}>
                          <Link href={`/licitacoes/${row.licitacaoId}`} style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            Ver detalhe
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhum rateio encontrado para os filtros selecionados.</p>
        )}
      </section>
    </main>
  );
}

const fieldStyle = { display: 'grid', gap: 6 } as const;

const inputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid var(--line)',
  padding: '10px 12px',
  background: '#fff',
  font: 'inherit',
} as const;

const actionButtonStyle = {
  borderRadius: 999,
  border: 'none',
  background: 'var(--accent)',
  color: '#fffaf2',
  fontWeight: 700,
  padding: '10px 18px',
  cursor: 'pointer',
  textDecoration: 'none',
} as const;

const secondaryButtonStyle = {
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'rgba(255,255,255,0.86)',
  color: 'var(--foreground)',
  fontWeight: 700,
  padding: '10px 16px',
  textDecoration: 'none',
} as const;

const headerCellStyle = {
  padding: '12px 10px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: 'var(--muted)',
} as const;

const groupCellStyle = {
  padding: '14px 10px 10px',
  verticalAlign: 'top',
  fontWeight: 600,
  background: '#fff',
} as const;

const mutedCellStyle = {
  padding: '14px 10px 10px',
  verticalAlign: 'top',
  color: 'var(--muted)',
  background: '#fff',
} as const;

const subCellStyle = {
  padding: '8px 10px',
  verticalAlign: 'top',
  fontSize: 14,
} as const;

function rowDateValue(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
