import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getExecutiveSummary } from '../../lib/kanban-api';
import { requireSessionUser } from '../../lib/server-auth';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article
      style={{
        background: 'rgba(255, 250, 242, 0.82)',
        border: '2px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05, margin: '10px 0 8px' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{hint}</div>
    </article>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 14,
        background: 'rgba(255, 250, 242, 0.86)',
        border: '2px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 6px' }}>{title}</h2>
        {subtitle ? <p style={{ color: 'var(--muted)', margin: 0 }}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default async function RelatoriosPage() {
  const user = await requireSessionUser();
  const isLumeraOperator = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );
  const isLumeraAdmin = user.memberships.some((membership) => membership.roleCode === 'LUMERA_ADMIN');

  if (!isLumeraOperator) {
    redirect('/');
  }

  const executive = await getExecutiveSummary();

  return (
    <main style={{ padding: '32px 28px 48px', display: 'grid', gap: 24 }}>
      <section
        style={{
          background: 'rgba(255, 250, 242, 0.72)',
          border: '2px solid var(--line)',
          borderRadius: 28,
          padding: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: 'var(--accent)' }}>
              Relatorios e visao executiva
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.02 }}>
              Leitura executiva da carteira de licitacoes.
            </h1>
            <p style={{ maxWidth: 920, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, margin: 0 }}>
              Consulte concentracao por empresa, situacao financeira, previsao de recebimentos e acesse os relatorios operacionais em telas separadas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href='/relatorios/licitacoes-empenhos'
              style={{
                border: '2px solid var(--line)',
                padding: '14px 18px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Licitacoes x Empenhos
            </Link>
            {isLumeraAdmin ? (
              <>
                <Link
                  href='/relatorios/funcionarios-empenhos'
                  style={{
                    border: '2px solid var(--line)',
                    padding: '14px 18px',
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  Funcionarios x Empenhos
                </Link>
                <Link
                  href='/relatorios/funcionarios-rateio'
                  style={{
                    border: '2px solid var(--line)',
                    padding: '14px 18px',
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  Funcionarios x Rateio
                </Link>
              </>
            ) : null}
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

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label='Licitacoes' value={executive.metrics.totalLicitacoes} hint='Total acompanhado pela Lumera' />
        <MetricCard label='Empresas' value={executive.metrics.empresasParticipantes} hint='Empresas com processos no quadro' />
        <MetricCard label='Com financeiro' value={executive.metrics.licitacoesComFinanceiro} hint='Licitacoes com bloco financeiro preenchido' />
        <MetricCard label='Estimado edital' value={formatMoney(executive.metrics.valorEstimadoEdital)} hint='Soma dos valores estimados informados' />
        <MetricCard label='Homologado' value={formatMoney(executive.metrics.valorHomologado)} hint='Soma dos valores homologados' />
        <MetricCard label='Receita Lumera' value={formatMoney(executive.metrics.receitaLumeraPrevista)} hint='Receita prevista ou apurada' />
        <MetricCard label='Pendencias financeiras' value={executive.metrics.pagamentosPendentes} hint='Licitacoes com financeiro ainda nao quitado' />
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <Panel title='Empresas com maior representatividade' subtitle='Volume e potencial financeiro por empresa participante.'>
          {executive.companyPerformance.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {executive.companyPerformance.map((company) => (
                <article key={company.clientCompanyId} style={{ background: '#fff', border: '2px solid var(--line)', borderRadius: 16, padding: 14, display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <strong>{company.name}</strong>
                    <span style={{ color: 'var(--muted)' }}>{company.totalLicitacoes} licitacao(oes)</span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>{company.segmento ?? 'Segmento nao informado'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
                    <span>Homologado: <strong>{formatMoney(company.valorHomologado)}</strong></span>
                    <span>Receita Lumera: <strong>{formatMoney(company.receitaLumeraPrevista)}</strong></span>
                    <span>Ticket medio: <strong>{formatMoney(company.ticketMedio)}</strong></span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhuma empresa com dados suficientes para o relatorio.</p>
          )}
        </Panel>

        <Panel title='Carteira por etapa' subtitle='Distribuicao atual das licitacoes na operacao.'>
          <div style={{ display: 'grid', gap: 12 }}>
            {executive.stageCounts.map((stage) => (
              <div key={stage.etapaId} style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{stage.name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{stage.count}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: 'rgba(160, 100, 40, 0.12)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${executive.metrics.totalLicitacoes && stage.count > 0 ? (stage.count / executive.metrics.totalLicitacoes) * 100 : 0}%`,
                      height: '100%',
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: isLumeraAdmin ? '1fr 1fr' : '1fr' }}>
        {isLumeraAdmin ? (
          <Panel title='Carga por responsavel' subtitle='Distribuicao atual das licitacoes entre os responsaveis.'>
            {executive.responsibleLoad.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {executive.responsibleLoad.map((responsavel) => (
                  <article key={responsavel.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <strong>{responsavel.name}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{responsavel.primaryAssignments} principal(is)</div>
                    </div>
                    <strong>{responsavel.totalLicitacoes}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhum responsavel vinculado no momento.</p>
            )}
          </Panel>
        ) : null}

        <Panel title='Status financeiro' subtitle='Distribuicao das licitacoes por situacao financeira.'>
          {executive.financialStatusCounts.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {executive.financialStatusCounts.map((item) => (
                <article key={item.status} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                  <strong>{item.status}</strong>
                  <span>{item.count}</span>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Ainda nao ha dados financeiros consolidados.</p>
          )}
        </Panel>
      </section>

      <Panel title='Recebimentos proximos' subtitle='Titulos com vencimento nos proximos 30 dias e ainda nao quitados.'>
        {executive.upcomingReceivables.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {executive.upcomingReceivables.map((item) => (
              <article key={item.id} style={{ background: '#fff', border: '2px solid var(--line)', borderRadius: 16, padding: 14, display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <Link href={`/licitacoes/${item.id}`} style={{ fontWeight: 700 }}>{item.titulo}</Link>
                  <strong>{formatMoney(item.valorReceitaLumera)}</strong>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>{item.company}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {item.numeroProcesso ? `${item.numeroProcesso} | ` : ''}Vencimento em {formatDate(item.vencimento)} | {item.statusFinanceiro}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhum recebimento previsto para os proximos 30 dias.</p>
        )}
      </Panel>
    </main>
  );
}

