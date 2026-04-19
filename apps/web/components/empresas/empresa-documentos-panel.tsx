'use client';

import { useMemo, useState } from 'react';
import type { CompanyDocument, ParticipatingCompany } from '../../lib/kanban-api';
import { UpdateEmpresaDocumentoForm } from './update-empresa-documento-form';

const GROUP_LABELS: Record<string, string> = {
  HABILITACAO_JURIDICA: 'Habilitacao juridica',
  REGULARIDADE_FISCAL_TRABALHISTA: 'Regularidade fiscal e trabalhista',
  QUALIFICACAO_ECONOMICO_FINANCEIRA: 'Qualificacao economico-financeira',
  CADASTRO_SISTEMA_ELETRONICO: 'Cadastro em sistema eletronico de licitacoes',
  OUTROS_DOCUMENTOS: 'Outros documentos',
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  ENVIADO: 'Enviado',
  VALIDO: 'Valido',
  VENCE_EM_BREVE: 'Vence em breve',
  VENCIDO: 'Vencido',
  NAO_APLICAVEL: 'Nao aplicavel',
};

const STATUS_COLORS: Record<string, { background: string; color: string; border: string }> = {
  PENDENTE: { background: '#fff7ed', color: '#9a3412', border: '#fdba74' },
  ENVIADO: { background: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  VALIDO: { background: '#ecfdf3', color: '#166534', border: '#86efac' },
  VENCE_EM_BREVE: { background: '#fff1d6', color: '#b45309', border: '#f59e0b' },
  VENCIDO: { background: '#fef2f2', color: '#b91c1c', border: '#ef4444' },
  NAO_APLICAVEL: { background: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
};

const QUICK_FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'VENCE_EM_BREVE', label: 'Vencendo' },
  { key: 'VENCIDO', label: 'Vencidos' },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]['key'];

const summaryCardStyle = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 12,
  display: 'grid',
  gap: 4,
  background: '#fff',
} satisfies React.CSSProperties;

const documentRowStyle = {
  border: '1px solid var(--border)',
  borderRadius: 16,
  overflow: 'hidden',
  background: '#fff',
} satisfies React.CSSProperties;

function countDocumentStatuses(documents: CompanyDocument[]) {
  return documents.reduce(
    (accumulator, document) => {
      accumulator.total += 1;
      if (document.status === 'VALIDO') accumulator.validos += 1;
      if (document.status === 'PENDENTE') accumulator.pendentes += 1;
      if (document.status === 'VENCE_EM_BREVE') accumulator.venceEmBreve += 1;
      if (document.status === 'VENCIDO') accumulator.vencidos += 1;
      if (document.status === 'NAO_APLICAVEL') accumulator.naoAplicaveis += 1;
      return accumulator;
    },
    { total: 0, validos: 0, pendentes: 0, venceEmBreve: 0, vencidos: 0, naoAplicaveis: 0 },
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const palette = STATUS_COLORS[status] ?? STATUS_COLORS.PENDENTE;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.color,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function matchesQuickFilter(document: CompanyDocument, filter: QuickFilter) {
  if (filter === 'TODOS') return true;
  return document.status === filter;
}

function getDocumentHighlight(status: string): React.CSSProperties {
  if (status === 'VENCIDO') {
    return {
      borderColor: '#ef4444',
      background: 'linear-gradient(180deg, rgba(254, 242, 242, 0.98), rgba(255, 255, 255, 1))',
      boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.08)',
    };
  }

  if (status === 'VENCE_EM_BREVE') {
    return {
      borderColor: '#f59e0b',
      background: 'linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(255, 255, 255, 1))',
      boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.08)',
    };
  }

  return {};
}

export function EmpresaDocumentosPanel({
  company,
  organizationId,
}: {
  company: ParticipatingCompany;
  organizationId: string;
}) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('TODOS');
  const documents = company.documents ?? [];
  const summary = useMemo(() => countDocumentStatuses(documents), [documents]);
  const filteredDocuments = useMemo(
    () => documents.filter((document) => matchesQuickFilter(document, quickFilter)),
    [documents, quickFilter],
  );
  const groupedDocuments = useMemo(
    () =>
      filteredDocuments.reduce<Record<string, CompanyDocument[]>>((accumulator, document) => {
        const group = document.documentType.group;
        accumulator[group] ??= [];
        accumulator[group].push(document);
        return accumulator;
      }, {}),
    [filteredDocuments],
  );

  const quickFilterCounts: Record<QuickFilter, number> = {
    TODOS: documents.length,
    PENDENTE: documents.filter((document) => document.status === 'PENDENTE').length,
    VENCE_EM_BREVE: documents.filter((document) => document.status === 'VENCE_EM_BREVE').length,
    VENCIDO: documents.filter((document) => document.status === 'VENCIDO').length,
  };

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Controle documental da empresa</h3>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            {summary.validos} validos | {summary.pendentes} pendentes | {summary.venceEmBreve} vencendo | {summary.vencidos} vencidos
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div style={summaryCardStyle}>
            <strong>{summary.total}</strong>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Documentos no checklist</span>
          </div>
          <div style={summaryCardStyle}>
            <strong>{summary.validos}</strong>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Documentos validos</span>
          </div>
          <div style={summaryCardStyle}>
            <strong>{summary.pendentes}</strong>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Pendencias</span>
          </div>
          <div style={summaryCardStyle}>
            <strong>{summary.vencidos}</strong>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Vencidos</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_FILTERS.map((filterOption) => {
            const active = quickFilter === filterOption.key;
            return (
              <button
                key={filterOption.key}
                type='button'
                onClick={() => setQuickFilter(filterOption.key)}
                style={{
                  borderRadius: 999,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'rgba(145, 78, 25, 0.12)' : '#fff',
                  color: active ? 'var(--accent)' : 'var(--foreground)',
                  padding: '8px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {filterOption.label} ({quickFilterCounts[filterOption.key]})
              </button>
            );
          })}
        </div>
      </div>

      {!filteredDocuments.length ? (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 16,
            padding: 18,
            color: 'var(--muted)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          Nenhum documento encontrado para o filtro selecionado.
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {Object.entries(groupedDocuments).map(([groupCode, groupDocuments]) => (
          <div key={groupCode} style={{ display: 'grid', gap: 10 }}>
            <div>
              <strong>{GROUP_LABELS[groupCode] ?? groupCode}</strong>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {groupDocuments.map((document) => (
                <details
                  key={document.documentType.id}
                  style={{
                    ...documentRowStyle,
                    ...getDocumentHighlight(document.status),
                  }}
                >
                  <summary
                    style={{
                      listStyle: 'none',
                      cursor: 'pointer',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 4 }}>
                      <strong>{document.documentType.name}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {document.documentType.requiresExpiration
                          ? `Validade: ${formatDate(document.expirationDate)}`
                          : document.originalFileName
                            ? `Arquivo atual: ${document.originalFileName}`
                            : 'Sem arquivo enviado ainda'}
                      </span>
                      {document.status === 'VENCIDO' ? (
                        <span style={{ color: '#b91c1c', fontSize: 12, fontWeight: 700 }}>
                          Documento vencido. Recomenda-se atualizacao imediata.
                        </span>
                      ) : null}
                      {document.status === 'VENCE_EM_BREVE' ? (
                        <span style={{ color: '#b45309', fontSize: 12, fontWeight: 700 }}>
                          Documento proximo do vencimento. Vale revisar a renovacao.
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'end' }}>
                      {document.documentType.isRequired ? (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Obrigatorio</span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Opcional</span>
                      )}
                      <StatusBadge status={document.status} />
                    </div>
                  </summary>
                  <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'grid', gap: 12 }}>
                    {document.documentType.description ? (
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{document.documentType.description}</p>
                    ) : null}
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 2 }}>Emissao</div>
                        <strong>{formatDate(document.issueDate)}</strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 2 }}>Vencimento</div>
                        <strong>{formatDate(document.expirationDate)}</strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 2 }}>Ultima atualizacao</div>
                        <strong>{formatDate(document.updatedAt)}</strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 2 }}>Arquivo atual</div>
                        <strong>{document.originalFileName ?? '-'}</strong>
                      </div>
                    </div>
                    <UpdateEmpresaDocumentoForm organizationId={organizationId} companyId={company.id} document={document} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

