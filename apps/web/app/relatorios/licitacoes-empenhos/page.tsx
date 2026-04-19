import Link from 'next/link';
import { Fragment } from 'react';
import { redirect } from 'next/navigation';
import { fetchApi, getLicitacao } from '../../../lib/kanban-api';
import { requireSessionUser } from '../../../lib/server-auth';

type LicitacaoListItem = {
  id: string;
};

type RelatorioEmpenhoRow = {
  id: string;
  codigoEmpenho: string;
  valor: string;
  dataEmpenho?: string | null;
  dataPagamentoEmpenho?: string | null;
  dataGeracaoBoleto?: string | null;
  dataPagamentoBoleto?: string | null;
  observacoes?: string | null;
};

type RelatorioRow = {
  id: string;
  empresa: string;
  titulo: string;
  numeroProcesso?: string | null;
  etapa: string;
  empenhos: RelatorioEmpenhoRow[];
};

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatMoney(value?: string | null) {
  if (!value) return '-';

  const normalized = value.replace(/\./g, '').replace(',', '.');
  const numericValue = Number(normalized);
  if (Number.isNaN(numericValue)) return value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

export default async function RelatorioLicitacoesEmpenhosPage() {
  const user = await requireSessionUser();
  const isLumeraOperator = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );

  if (!isLumeraOperator) {
    redirect('/');
  }

  const licitacoes = await fetchApi<LicitacaoListItem[]>('/api/licitacoes');
  const details = await Promise.all(licitacoes.map((licitacao) => getLicitacao(licitacao.id)));

  const rows: RelatorioRow[] = details
    .map((licitacao) => ({
      id: licitacao.id,
      empresa: licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName,
      titulo: licitacao.titulo,
      numeroProcesso: licitacao.numeroProcesso,
      etapa: licitacao.etapa.name,
      empenhos: (licitacao.empenhos ?? []).map((empenho) => ({
        id: empenho.id,
        codigoEmpenho: empenho.codigoEmpenho,
        valor: empenho.valor,
        dataEmpenho: empenho.dataEmpenho,
        dataPagamentoEmpenho: empenho.dataPagamentoEmpenho,
        dataGeracaoBoleto: empenho.dataGeracaoBoleto,
        dataPagamentoBoleto: empenho.dataPagamentoBoleto,
        observacoes: empenho.observacoes,
      })),
    }))
    .sort((a, b) => {
      const empresaComparison = a.empresa.localeCompare(b.empresa, 'pt-BR');
      if (empresaComparison !== 0) return empresaComparison;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });

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
              Relatorio sintetico
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.02 }}>
              Licitacoes x Empenhos
            </h1>
            <p style={{ maxWidth: 900, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, margin: 0 }}>
              Listagem simples das licitacoes com todos os empenhos vinculados em sequencia para facilitar a conferencia financeira.
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
            <Link
              href='/licitacoes'
              style={{
                background: 'var(--accent)',
                color: '#fffaf2',
                padding: '14px 18px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Abrir quadro
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
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Relacao simples por licitacao</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Cada licitacao aparece em uma linha principal e os empenhos ficam listados logo abaixo.
          </p>
        </div>

        {rows.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                <th style={headerCellStyle}>Empresa</th>
                <th style={headerCellStyle}>Licitacao</th>
                <th style={headerCellStyle}>Processo</th>
                <th style={headerCellStyle}>Etapa</th>
                <th style={headerCellStyle}>Empenho</th>
                <th style={headerCellStyle}>Valor</th>
                <th style={headerCellStyle}>Data empenho</th>
                <th style={headerCellStyle}>Pagamento do empenho</th>
                <th style={headerCellStyle}>Geracao do boleto</th>
                <th style={headerCellStyle}>Pagamento do boleto</th>
                <th style={headerCellStyle}>Observacoes</th>
                <th style={headerCellStyle}>Acao</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    <td style={licitacaoCellStyle}>{row.empresa}</td>
                    <td style={licitacaoCellStyle}>{row.titulo}</td>
                    <td style={licitacaoCellStyle}>{row.numeroProcesso ?? '-'}</td>
                    <td style={licitacaoCellStyle}>{row.etapa}</td>
                    <td style={mutedCellStyle} colSpan={7}>
                      {row.empenhos.length ? 'Empenhos cadastrados abaixo' : 'Nao ha empenhos cadastrados'}
                    </td>
                    <td style={actionCellStyle}>
                      <Link href={`/licitacoes/${row.id}`} style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        Ver detalhe
                      </Link>
                    </td>
                  </tr>

                  {row.empenhos.map((empenho, index) => {
                    const isLastEmpenho = index === row.empenhos.length - 1;

                    return (
                      <tr
                        key={empenho.id}
                        style={{
                          borderBottom: isLastEmpenho ? '1px solid var(--line)' : 'none',
                          background: '#fffaf5',
                        }}
                      >
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}></td>
                        <td style={subCellStyle}>{empenho.codigoEmpenho}</td>
                        <td style={subCellStyle}>{formatMoney(empenho.valor)}</td>
                        <td style={subCellStyle}>{formatDate(empenho.dataEmpenho)}</td>
                        <td style={subCellStyle}>{formatDate(empenho.dataPagamentoEmpenho)}</td>
                        <td style={subCellStyle}>{formatDate(empenho.dataGeracaoBoleto)}</td>
                        <td style={subCellStyle}>{formatDate(empenho.dataPagamentoBoleto)}</td>
                        <td style={subCellStyle}>{empenho.observacoes || '-'}</td>
                        <td style={subCellStyle}></td>
                      </tr>
                    );
                  })}

                  {!row.empenhos.length ? <tr style={{ borderBottom: '1px solid var(--line)' }}><td colSpan={12} style={{ padding: 0 }} /></tr> : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhuma licitacao cadastrada ainda.</p>
        )}
      </section>
    </main>
  );
}

const headerCellStyle = {
  padding: '12px 10px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: 'var(--muted)',
} as const;

const licitacaoCellStyle = {
  padding: '14px 10px 10px',
  verticalAlign: 'top',
  fontWeight: 600,
} as const;

const mutedCellStyle = {
  padding: '14px 10px 10px',
  verticalAlign: 'top',
  color: 'var(--muted)',
} as const;

const subCellStyle = {
  padding: '6px 10px',
  verticalAlign: 'top',
  fontSize: 14,
} as const;

const actionCellStyle = {
  padding: '14px 10px 10px',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
} as const;

