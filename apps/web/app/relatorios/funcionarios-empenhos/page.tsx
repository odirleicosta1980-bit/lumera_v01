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

type StatusRepasse = 'PREVISTO' | 'PROGRAMADO' | 'PAGO';

type FuncionarioRepasseRow = {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  empresa: string;
  licitacaoId: string;
  licitacaoTitulo: string;
  numeroProcesso?: string | null;
  etapa: string;
  empenhoCodigo: string;
  valorEmpenho: number;
  valorRateioLicitacao: number;
  valorRepasse: number;
  criterioRateio: string;
  statusRepasse: StatusRepasse;
  dataReferencia?: string | null;
  observacoes?: string | null;
};

type FuncionarioGroup = {
  funcionarioId: string;
  funcionarioNome: string;
  totalGeral: number;
  totalPrevisto: number;
  totalProgramado: number;
  totalPago: number;
  rows: FuncionarioRepasseRow[];
};

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
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

function getEmpenhoReference(empenho: LicitacaoDetail['empenhos'][number], month: string) {
  if (belongsToMonth(empenho.dataPagamentoBoleto, month)) {
    return { status: 'PAGO' as const, date: empenho.dataPagamentoBoleto };
  }

  if (belongsToMonth(empenho.dataGeracaoBoleto, month)) {
    return { status: 'PROGRAMADO' as const, date: empenho.dataGeracaoBoleto };
  }

  if (belongsToMonth(empenho.dataPagamentoEmpenho, month)) {
    return { status: 'PROGRAMADO' as const, date: empenho.dataPagamentoEmpenho };
  }

  if (belongsToMonth(empenho.dataEmpenho, month)) {
    return { status: 'PREVISTO' as const, date: empenho.dataEmpenho };
  }

  return null;
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

function calculateAllocationTotalForEmpenho(
  allocation: FinanceiroAllocation,
  valorBaseRateio: number,
  participationRatio: number,
) {
  const valorFixo = parseMoney(allocation.valor);

  if (valorFixo > 0) {
    return valorFixo * participationRatio;
  }

  return valorBaseRateio * participationRatio;
}

function getOperationalUsers(users: AssignableUser[], organizationId: string) {
  return users.filter((user) =>
    user.memberships.some(
      (membership) => membership.organizationId === organizationId && membership.roleCode === 'LUMERA_OPERACIONAL',
    ),
  );
}

function buildRowsForLicitacao(detail: LicitacaoDetail, operationalUsers: AssignableUser[], selectedMonth: string) {
  const financeiro = detail.financeiro;
  const empenhos = detail.empenhos ?? [];

  if (!financeiro?.allocations?.length || !empenhos.length) {
    return [] as FuncionarioRepasseRow[];
  }

  const company = detail.clientCompany.tradeName ?? detail.clientCompany.legalName;
  const valorBaseLicitacao =
    parseMoney(financeiro.valorHomologado) ||
    parseMoney(financeiro.valorPropostaEmpresa) ||
    parseMoney(financeiro.valorEstimadoEdital) ||
    0;
  const totalEmpenhos = empenhos.reduce((sum, empenho) => sum + parseMoney(empenho.valor), 0);
  const fallbackParticipation =
    valorBaseLicitacao > 0
      ? 0
      : empenhos.length
        ? 1 / empenhos.length
        : 0;

  return empenhos.flatMap((empenho) => {
    const reference = getEmpenhoReference(empenho, selectedMonth);
    if (!reference) {
      return [] as FuncionarioRepasseRow[];
    }

    const valorEmpenho = parseMoney(empenho.valor);
    const participationRatio =
      valorBaseLicitacao > 0
        ? Math.max(0, valorEmpenho / valorBaseLicitacao)
        : totalEmpenhos > 0
          ? valorEmpenho / totalEmpenhos
          : fallbackParticipation;

    return financeiro.allocations.flatMap((allocation) => {
      const allocationBase = parseMoney(allocation.valor);
      const allocationTotal = calculateAllocationTotalForEmpenho(allocation, allocationBase, participationRatio);
      if (allocationTotal <= 0) {
        return [] as FuncionarioRepasseRow[];
      }

      const normalizedLabel = (allocation.label ?? '').trim().toLowerCase();
      const criterioRateio = buildRateioLabel(allocation);

      if (!allocation.userId && normalizedLabel === 'funcionarios') {
        if (!operationalUsers.length) {
          return [
            {
              id: `${detail.id}-${empenho.id}-${allocation.id}-funcionarios`,
              funcionarioId: 'funcionarios',
              funcionarioNome: 'Funcionarios',
              empresa: company,
              licitacaoId: detail.id,
              licitacaoTitulo: detail.titulo,
              numeroProcesso: detail.numeroProcesso,
              etapa: detail.etapa.name,
              empenhoCodigo: empenho.codigoEmpenho,
              valorEmpenho,
              valorRateioLicitacao: allocationBase,
              valorRepasse: allocationTotal,
              criterioRateio,
              statusRepasse: reference.status,
              dataReferencia: reference.date,
              observacoes: empenho.observacoes,
            },
          ];
        }

        const valorPorFuncionario = allocationTotal / operationalUsers.length;
        return operationalUsers.map((user) => ({
          id: `${detail.id}-${empenho.id}-${allocation.id}-${user.id}`,
          funcionarioId: user.id,
          funcionarioNome: user.name,
          empresa: company,
          licitacaoId: detail.id,
          licitacaoTitulo: detail.titulo,
          numeroProcesso: detail.numeroProcesso,
          etapa: detail.etapa.name,
          empenhoCodigo: empenho.codigoEmpenho,
          valorEmpenho,
          valorRateioLicitacao: allocationBase / operationalUsers.length,
          valorRepasse: valorPorFuncionario,
          criterioRateio: `${criterioRateio} dividido entre ${operationalUsers.length} funcionario(s)`,
          statusRepasse: reference.status,
          dataReferencia: reference.date,
          observacoes: empenho.observacoes,
        }));
      }

      const funcionarioNome = allocation.user?.name ?? allocation.label;
      const funcionarioId = allocation.userId ?? `label-${normalizedLabel || allocation.id}`;

      return [
        {
          id: `${detail.id}-${empenho.id}-${allocation.id}`,
          funcionarioId,
          funcionarioNome,
          empresa: company,
          licitacaoId: detail.id,
          licitacaoTitulo: detail.titulo,
          numeroProcesso: detail.numeroProcesso,
          etapa: detail.etapa.name,
          empenhoCodigo: empenho.codigoEmpenho,
          valorEmpenho,
          valorRateioLicitacao: allocationBase,
          valorRepasse: allocationTotal,
          criterioRateio,
          statusRepasse: reference.status,
          dataReferencia: reference.date,
          observacoes: empenho.observacoes,
        },
      ];
    });
  });
}

function getStatusLabel(status: StatusRepasse) {
  switch (status) {
    case 'PAGO':
      return 'Pago';
    case 'PROGRAMADO':
      return 'Programado';
    default:
      return 'Previsto';
  }
}

function getStatusBadgeStyle(status: StatusRepasse) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 12px',
    border:
      status === 'PAGO'
        ? '1px solid #22c55e'
        : status === 'PROGRAMADO'
          ? '1px solid #f59e0b'
          : '1px solid #94a3b8',
    background:
      status === 'PAGO'
        ? '#f0fdf4'
        : status === 'PROGRAMADO'
          ? '#fff7ed'
          : '#f8fafc',
    color:
      status === 'PAGO'
        ? '#166534'
        : status === 'PROGRAMADO'
          ? '#b45309'
          : '#475569',
    fontSize: 12,
    fontWeight: 700,
  } as const;
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

export default async function RelatorioFuncionariosEmpenhosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; company?: string; status?: string }>;
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

  const selectedMonth =
    resolvedSearchParams.month && /^\d{4}-\d{2}$/.test(resolvedSearchParams.month)
      ? resolvedSearchParams.month
      : toMonthValue(new Date());
  const selectedCompany = resolvedSearchParams.company?.trim() ?? '';
  const selectedStatus =
    resolvedSearchParams.status === 'PREVISTO' ||
    resolvedSearchParams.status === 'PROGRAMADO' ||
    resolvedSearchParams.status === 'PAGO'
      ? resolvedSearchParams.status
      : '';

  const [licitacoes, users] = await Promise.all([
    fetchApi<LicitacaoListItem[]>('/api/licitacoes'),
    getAssignableUsers(primaryMembership.organizationId),
  ]);
  const details = await Promise.all(licitacoes.map((licitacao) => getLicitacao(licitacao.id)));
  const operationalUsers = getOperationalUsers(users, primaryMembership.organizationId);

  const allRows = details.flatMap((detail) => buildRowsForLicitacao(detail, operationalUsers, selectedMonth));
  const companyOptions = Array.from(new Set(allRows.map((row) => row.empresa))).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const filteredRows = allRows
    .filter((row) => (selectedCompany ? row.empresa === selectedCompany : true))
    .filter((row) => (selectedStatus ? row.statusRepasse === selectedStatus : true))
    .sort((a, b) => {
      const funcionarioComparison = a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR');
      if (funcionarioComparison !== 0) return funcionarioComparison;
      const dateA = a.dataReferencia ? new Date(a.dataReferencia).getTime() : 0;
      const dateB = b.dataReferencia ? new Date(b.dataReferencia).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.licitacaoTitulo.localeCompare(b.licitacaoTitulo, 'pt-BR');
    });

  const groupedMap = new Map<string, FuncionarioGroup>();

  filteredRows.forEach((row) => {
    const existing = groupedMap.get(row.funcionarioId);
    if (existing) {
      existing.rows.push(row);
      existing.totalGeral += row.valorRepasse;
      if (row.statusRepasse === 'PAGO') existing.totalPago += row.valorRepasse;
      if (row.statusRepasse === 'PROGRAMADO') existing.totalProgramado += row.valorRepasse;
      if (row.statusRepasse === 'PREVISTO') existing.totalPrevisto += row.valorRepasse;
      return;
    }

    groupedMap.set(row.funcionarioId, {
      funcionarioId: row.funcionarioId,
      funcionarioNome: row.funcionarioNome,
      totalGeral: row.valorRepasse,
      totalPrevisto: row.statusRepasse === 'PREVISTO' ? row.valorRepasse : 0,
      totalProgramado: row.statusRepasse === 'PROGRAMADO' ? row.valorRepasse : 0,
      totalPago: row.statusRepasse === 'PAGO' ? row.valorRepasse : 0,
      rows: [row],
    });
  });

  const groups = Array.from(groupedMap.values()).sort((a, b) => {
    if (b.totalGeral !== a.totalGeral) return b.totalGeral - a.totalGeral;
    return a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR');
  });

  const totalPrevisto = filteredRows
    .filter((row) => row.statusRepasse === 'PREVISTO')
    .reduce((sum, row) => sum + row.valorRepasse, 0);
  const totalProgramado = filteredRows
    .filter((row) => row.statusRepasse === 'PROGRAMADO')
    .reduce((sum, row) => sum + row.valorRepasse, 0);
  const totalPago = filteredRows
    .filter((row) => row.statusRepasse === 'PAGO')
    .reduce((sum, row) => sum + row.valorRepasse, 0);
  const totalGeral = totalPrevisto + totalProgramado + totalPago;

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
              Funcionarios x Empenhos
            </h1>
            <p style={{ maxWidth: 920, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, margin: 0 }}>
              Visao mensal dos valores por funcionario com base no rateio definido na licitacao. Os empenhos determinam quando cada parcela entra como previsto, programado ou pago.
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
            Ajuste o mes, a empresa ou a situacao para concentrar a leitura do fechamento.
          </p>
        </div>

        <form method='get' style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end' }}>
          <label style={fieldStyle}>
            <span>Mes</span>
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

          <label style={fieldStyle}>
            <span>Situacao</span>
            <select name='status' defaultValue={selectedStatus} style={inputStyle}>
              <option value=''>Todas</option>
              <option value='PREVISTO'>Previsto</option>
              <option value='PROGRAMADO'>Programado</option>
              <option value='PAGO'>Pago</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type='submit' style={actionButtonStyle}>
              Aplicar filtros
            </button>
            <Link href='/relatorios/funcionarios-empenhos' style={secondaryButtonStyle}>
              Limpar
            </Link>
          </div>
        </form>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <SummaryCard label='Mes analisado' value={monthLabel(selectedMonth)} hint='Competencia atual do relatorio' />
        <SummaryCard label='Funcionarios' value={groups.length} hint='Com repasse encontrado nos filtros atuais' />
        <SummaryCard label='Previsto' value={formatMoney(totalPrevisto)} hint='Valores ainda sem programacao financeira' />
        <SummaryCard label='Programado' value={formatMoney(totalProgramado)} hint='Valores ja vinculados a pagamento previsto' />
        <SummaryCard label='Pago' value={formatMoney(totalPago)} hint='Valores ja realizados no periodo' />
        <SummaryCard label='Total geral' value={formatMoney(totalGeral)} hint='Soma do relatorio filtrado' />
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
            Cada linha abaixo mostra como os empenhos do periodo impactam o rateio definido na licitacao para cada funcionario.
          </p>
        </div>

        {groups.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                <th style={headerCellStyle}>Funcionario</th>
                <th style={headerCellStyle}>Resumo do mes</th>
                <th style={headerCellStyle}>Licitacao</th>
                <th style={headerCellStyle}>Empresa</th>
                <th style={headerCellStyle}>Processo</th>
                <th style={headerCellStyle}>Etapa</th>
                <th style={headerCellStyle}>Empenho</th>
                <th style={headerCellStyle}>Valor do empenho</th>
                <th style={headerCellStyle}>Rateio da licitacao</th>
                <th style={headerCellStyle}>Valor do funcionario</th>
                <th style={headerCellStyle}>Situacao</th>
                <th style={headerCellStyle}>Data referencia</th>
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
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div>Previsto: <strong>{formatMoney(group.totalPrevisto)}</strong></div>
                        <div>Programado: <strong>{formatMoney(group.totalProgramado)}</strong></div>
                        <div>Pago: <strong>{formatMoney(group.totalPago)}</strong></div>
                        <div>Total: <strong>{formatMoney(group.totalGeral)}</strong></div>
                      </div>
                    </td>
                    <td style={mutedCellStyle} colSpan={13}>
                      Empenhos que compoem o fechamento do periodo
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
                        <td style={subCellStyle}>{row.etapa}</td>
                        <td style={subCellStyle}>{row.empenhoCodigo}</td>
                        <td style={subCellStyle}>{formatMoney(row.valorEmpenho)}</td>
                        <td style={subCellStyle}>{formatMoney(row.valorRateioLicitacao)}</td>
                        <td style={subCellStyle}><strong>{formatMoney(row.valorRepasse)}</strong></td>
                        <td style={subCellStyle}>
                          <span style={getStatusBadgeStyle(row.statusRepasse)}>{getStatusLabel(row.statusRepasse)}</span>
                        </td>
                        <td style={subCellStyle}>{formatDate(row.dataReferencia)}</td>
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
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhum repasse encontrado para os filtros selecionados.</p>
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
