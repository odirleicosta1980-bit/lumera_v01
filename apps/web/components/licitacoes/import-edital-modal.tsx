'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AssignableUser, EditalImportDraft, EditalImportDraftItem, ParticipatingCompany } from '../../lib/kanban-api';
import {
  formatCurrencyEditValue,
  getCurrencyFieldDisplay,
  normalizeCurrencyForSubmit,
  sanitizeCurrencyEditInput,
} from '../../lib/formatters';

type ImportEditalModalProps = {
  organizationId: string;
  companies: ParticipatingCompany[];
  etapas: Array<{ id: string; name: string }>;
  users: AssignableUser[];
  defaultResponsavelIds: string[];
  closeHref: string;
};

type ReviewDraftState = {
  edital: EditalImportDraft['edital'];
  extractedTextPreview: string;
  warnings: string[];
  clientCompanyId: string;
  etapaId: string;
  responsavelIds: string[];
  licitacaoDraft: {
    titulo: string;
    descricao?: string | null;
    numeroProcesso?: string | null;
    orgao?: string | null;
    modalidade?: string | null;
    valorEstimado?: string | null;
    dataSessao?: string | null;
  };
  itensDraft: EditalImportDraftItem[];
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function createEmptyItem(): EditalImportDraftItem {
  return {
    numeroItem: '',
    numeroLote: '',
    descricao: '',
    unidade: '',
    quantidade: '',
    valorReferencia: '',
    valorProposto: '',
    marcaModelo: '',
    observacoes: '',
    status: 'PENDENTE',
  };
}

export function ImportEditalModal({
  organizationId,
  companies,
  etapas,
  users,
  defaultResponsavelIds,
  closeHref,
}: ImportEditalModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewDraftState | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [focusedCurrencyField, setFocusedCurrencyField] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canAdvanceToConfirm = useMemo(() => {
    if (!review) {
      return false;
    }

    return Boolean(review.clientCompanyId && review.etapaId && review.licitacaoDraft.titulo.trim());
  }, [review]);

  async function handleUploadSubmit(formData: FormData) {
    setError(null);

    const response = await fetch('/api/licitacoes/importacao/proposta', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({ message: 'Nao foi possivel analisar o edital enviado.' }));
    if (!response.ok) {
      setError(data.message ?? 'Nao foi possivel analisar o edital enviado.');
      return;
    }

    const draft = data as EditalImportDraft;
    setReview({
      edital: draft.edital,
      extractedTextPreview: draft.extractedTextPreview,
      warnings: draft.warnings,
      clientCompanyId: companies[0]?.id ?? '',
      etapaId: etapas[0]?.id ?? '',
      responsavelIds: defaultResponsavelIds,
      licitacaoDraft: draft.licitacaoDraft,
      itensDraft: draft.itensDraft.length ? draft.itensDraft : [],
    });
    setStep(2);
  }

  function updateDraftField(field: keyof ReviewDraftState['licitacaoDraft'], value: string) {
    setReview((current) =>
      current
        ? {
            ...current,
            licitacaoDraft: {
              ...current.licitacaoDraft,
              [field]: value,
            },
          }
        : current,
    );
  }

  function getCurrencyDraftValue(fieldKey: string, value?: string | null) {
    return focusedCurrencyField === fieldKey ? value ?? '' : getCurrencyFieldDisplay(value);
  }

  function updateItem(index: number, field: keyof EditalImportDraftItem, value: string) {
    setReview((current) => {
      if (!current) {
        return current;
      }

      const nextItems = [...current.itensDraft];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      };

      return {
        ...current,
        itensDraft: nextItems,
      };
    });
  }

  function removeItem(index: number) {
    setReview((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        itensDraft: current.itensDraft.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function addManualItem() {
    setReview((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        itensDraft: [...current.itensDraft, createEmptyItem()],
      };
    });
  }

  async function handleConfirm() {
    if (!review) {
      return;
    }

    if (!review.clientCompanyId) {
      setError('Selecione a empresa participante antes de confirmar.');
      setStep(2);
      return;
    }

    if (!review.etapaId) {
      setError('Selecione a etapa inicial antes de confirmar.');
      setStep(2);
      return;
    }

    const payload = {
      organizationId,
      clientCompanyId: review.clientCompanyId,
      etapaId: review.etapaId,
      titulo: review.licitacaoDraft.titulo.trim(),
      descricao: review.licitacaoDraft.descricao?.trim() || undefined,
      numeroProcesso: review.licitacaoDraft.numeroProcesso?.trim() || undefined,
      orgao: review.licitacaoDraft.orgao?.trim() || undefined,
      modalidade: review.licitacaoDraft.modalidade?.trim() || undefined,
      valorEstimado: normalizeCurrencyForSubmit(review.licitacaoDraft.valorEstimado) || undefined,
      dataSessao: review.licitacaoDraft.dataSessao ? new Date(review.licitacaoDraft.dataSessao).toISOString() : undefined,
      responsavelIds: review.responsavelIds,
      edital: review.edital,
      itens: review.itensDraft
        .filter((item) => item.descricao.trim())
        .map((item) => ({
          numeroItem: item.numeroItem?.trim() || undefined,
          numeroLote: item.numeroLote?.trim() || undefined,
          descricao: item.descricao.trim(),
          unidade: item.unidade?.trim() || undefined,
          quantidade: item.quantidade?.trim() || undefined,
          valorReferencia: normalizeCurrencyForSubmit(item.valorReferencia) || undefined,
          valorProposto: normalizeCurrencyForSubmit(item.valorProposto) || undefined,
          marcaModelo: item.marcaModelo?.trim() || undefined,
          observacoes: item.observacoes?.trim() || undefined,
          status: item.status || 'PENDENTE',
        })),
    };

    const response = await fetch('/api/licitacoes/importacao/confirmar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({ message: 'Nao foi possivel confirmar a importacao.' }));
    if (!response.ok) {
      setError(data.message ?? 'Nao foi possivel confirmar a importacao.');
      return;
    }

    startTransition(() => {
      router.push(`/licitacoes/${data.id}`);
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 18, 10, 0.38)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        zIndex: 1000,
      }}
    >
      <Link href={closeHref} aria-label='Fechar importacao de edital' style={{ position: 'absolute', inset: 0 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(1180px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '0 8px' }}>
          <div>
            <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Importar edital</div>
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>Envie um PDF textual ou TXT, revise as sugestoes e confirme a criacao da licitacao.</div>
          </div>
          <Link href={closeHref} style={{ color: 'var(--accent)', fontWeight: 700 }}>Fechar</Link>
        </div>

        <div style={{ background: 'rgba(255, 250, 242, 0.92)', border: '1px solid var(--line)', borderRadius: 24, padding: 20, boxShadow: 'var(--shadow)', display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { number: 1, label: 'Arquivo' },
              { number: 2, label: 'Dados gerais' },
              { number: 3, label: 'Itens e confirmacao' },
            ].map((item) => (
              <div
                key={item.number}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  background: step === item.number ? '#fff' : 'transparent',
                  color: step === item.number ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 700,
                }}
              >
                {item.number}. {item.label}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <form
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                formData.set('organizationId', organizationId);
                await handleUploadSubmit(formData);
              }}
              style={{ display: 'grid', gap: 16 }}
            >
              <div>
                <label htmlFor='file' style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Arquivo do edital</label>
                <input
                  id='file'
                  name='file'
                  type='file'
                  accept='.txt,.pdf,text/plain,application/pdf'
                  required
                  onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
                  style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px solid var(--line)', background: '#fff' }}
                />
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                  Suporta PDF textual e TXT. Esta fase ainda nao inclui OCR para PDF escaneado.
                </div>
              </div>

              {selectedFileName ? <div style={{ color: 'var(--muted)' }}>Arquivo selecionado: {selectedFileName}</div> : null}

              {error ? <div style={{ color: '#a4301d' }}>{error}</div> : null}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type='submit' disabled={isPending} style={primaryButtonStyle}>
                  {isPending ? 'Analisando...' : 'Analisar edital'}
                </button>
                <Link href={closeHref} style={secondaryLinkStyle}>Cancelar</Link>
              </div>
            </form>
          ) : null}

          {step === 2 && review ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {review.warnings.length ? (
                <section style={{ border: '1px solid #e4c58d', background: '#fff6e8', borderRadius: 18, padding: 14, display: 'grid', gap: 8 }}>
                  <strong>Avisos da importacao</strong>
                  {review.warnings.map((warning) => (
                    <div key={warning} style={{ color: '#7d4b00' }}>{warning}</div>
                  ))}
                </section>
              ) : null}

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <label style={labelStyle}>Empresa participante</label>
                  <select value={review.clientCompanyId} onChange={(event) => setReview({ ...review, clientCompanyId: event.target.value })} style={inputStyle}>
                    <option value=''>Selecione a empresa participante</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.tradeName ?? company.legalName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Etapa inicial</label>
                  <select value={review.etapaId} onChange={(event) => setReview({ ...review, etapaId: event.target.value })} style={inputStyle}>
                    <option value=''>Selecione a etapa inicial</option>
                    {etapas.map((etapa) => (
                      <option key={etapa.id} value={etapa.id}>{etapa.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data da sessao</label>
                  <input type='datetime-local' value={toDateTimeLocalValue(review.licitacaoDraft.dataSessao)} onChange={(event) => updateDraftField('dataSessao', event.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <label style={labelStyle}>Titulo</label>
                  <input value={review.licitacaoDraft.titulo} onChange={(event) => updateDraftField('titulo', event.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Numero do processo</label>
                  <input value={review.licitacaoDraft.numeroProcesso ?? ''} onChange={(event) => updateDraftField('numeroProcesso', event.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Orgao</label>
                  <input value={review.licitacaoDraft.orgao ?? ''} onChange={(event) => updateDraftField('orgao', event.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Modalidade</label>
                  <input value={review.licitacaoDraft.modalidade ?? ''} onChange={(event) => updateDraftField('modalidade', event.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Valor estimado</label>
                  <input
                    value={getCurrencyDraftValue('licitacao.valorEstimado', review.licitacaoDraft.valorEstimado)}
                    onFocus={() => {
                      setFocusedCurrencyField('licitacao.valorEstimado');
                      updateDraftField('valorEstimado', formatCurrencyEditValue(review.licitacaoDraft.valorEstimado));
                    }}
                    onBlur={() => {
                      setFocusedCurrencyField((current) => (current === 'licitacao.valorEstimado' ? null : current));
                      updateDraftField('valorEstimado', formatCurrencyEditValue(review.licitacaoDraft.valorEstimado));
                    }}
                    onChange={(event) => updateDraftField('valorEstimado', sanitizeCurrencyEditInput(event.target.value))}
                    placeholder='R$ 0,00'
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Descricao / objeto</label>
                <textarea value={review.licitacaoDraft.descricao ?? ''} onChange={(event) => updateDraftField('descricao', event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={labelStyle}>Responsaveis iniciais</label>
                <select
                  multiple
                  value={review.responsavelIds}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      responsavelIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                    })
                  }
                  style={{ ...inputStyle, minHeight: 120 }}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Ver texto extraido do edital</summary>
                <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 14, fontSize: 13, lineHeight: 1.5 }}>{review.extractedTextPreview}</pre>
              </details>

              {error ? <div style={{ color: '#a4301d' }}>{error}</div> : null}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type='button' disabled={!canAdvanceToConfirm} onClick={() => setStep(3)} style={primaryButtonStyle}>Revisar itens</button>
                <button type='button' onClick={() => setStep(1)} style={ghostButtonStyle}>Voltar</button>
                <Link href={closeHref} style={secondaryLinkStyle}>Cancelar</Link>
              </div>
            </div>
          ) : null}

          {step === 3 && review ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>Itens sugeridos do edital</strong>
                  <div style={{ color: 'var(--muted)', marginTop: 4 }}>Revise, ajuste ou inclua itens manualmente antes de confirmar.</div>
                </div>
                <button type='button' onClick={addManualItem} style={ghostButtonStyle}>Adicionar item manual</button>
              </div>

              {review.itensDraft.length ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {review.itensDraft.map((item, index) => (
                    <div key={`${index}-${item.numeroItem ?? 'manual'}`} style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 16, display: 'grid', gap: 12, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>Item {index + 1}</strong>
                        <button type='button' onClick={() => removeItem(index)} style={dangerButtonStyle}>Remover</button>
                      </div>

                      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <div>
                          <label style={labelStyle}>Numero do item</label>
                          <input value={item.numeroItem ?? ''} onChange={(event) => updateItem(index, 'numeroItem', event.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Numero do lote</label>
                          <input value={item.numeroLote ?? ''} onChange={(event) => updateItem(index, 'numeroLote', event.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Unidade</label>
                          <input value={item.unidade ?? ''} onChange={(event) => updateItem(index, 'unidade', event.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Quantidade</label>
                          <input value={item.quantidade ?? ''} onChange={(event) => updateItem(index, 'quantidade', event.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Valor de referencia</label>
                          <input
                            value={getCurrencyDraftValue(`item.${index}.valorReferencia`, item.valorReferencia)}
                            onFocus={() => {
                              setFocusedCurrencyField(`item.${index}.valorReferencia`);
                              updateItem(index, 'valorReferencia', formatCurrencyEditValue(item.valorReferencia));
                            }}
                            onBlur={() => {
                              setFocusedCurrencyField((current) => (current === `item.${index}.valorReferencia` ? null : current));
                              updateItem(index, 'valorReferencia', formatCurrencyEditValue(item.valorReferencia));
                            }}
                            onChange={(event) => updateItem(index, 'valorReferencia', sanitizeCurrencyEditInput(event.target.value))}
                            placeholder='R$ 0,00'
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Valor proposto</label>
                          <input
                            value={getCurrencyDraftValue(`item.${index}.valorProposto`, item.valorProposto)}
                            onFocus={() => {
                              setFocusedCurrencyField(`item.${index}.valorProposto`);
                              updateItem(index, 'valorProposto', formatCurrencyEditValue(item.valorProposto));
                            }}
                            onBlur={() => {
                              setFocusedCurrencyField((current) => (current === `item.${index}.valorProposto` ? null : current));
                              updateItem(index, 'valorProposto', formatCurrencyEditValue(item.valorProposto));
                            }}
                            onChange={(event) => updateItem(index, 'valorProposto', sanitizeCurrencyEditInput(event.target.value))}
                            placeholder='R$ 0,00'
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Status</label>
                          <select value={item.status} onChange={(event) => updateItem(index, 'status', event.target.value)} style={inputStyle}>
                            <option value='PENDENTE'>Pendente</option>
                            <option value='EM_PRECIFICACAO'>Em precificacao</option>
                            <option value='PRECIFICADO'>Precificado</option>
                            <option value='DESCARTADO'>Descartado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Descricao</label>
                        <textarea value={item.descricao} onChange={(event) => updateItem(index, 'descricao', event.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--muted)' }}>Nenhum item foi sugerido. Voce ainda pode confirmar a licitacao ou adicionar itens manualmente.</div>
              )}

              {error ? <div style={{ color: '#a4301d' }}>{error}</div> : null}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button type='button' disabled={isPending} onClick={handleConfirm} style={primaryButtonStyle}>
                  {isPending ? 'Confirmando...' : 'Criar licitacao importada'}
                </button>
                <button type='button' onClick={() => setStep(2)} style={ghostButtonStyle}>Voltar</button>
                <Link href={closeHref} style={secondaryLinkStyle}>Cancelar</Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;

const labelStyle = {
  display: 'block',
  fontWeight: 700,
  marginBottom: 8,
} as const;

const primaryButtonStyle = {
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const ghostButtonStyle = {
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--accent)',
  borderRadius: 999,
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const dangerButtonStyle = {
  border: '1px solid #d7b1aa',
  background: '#fff4f1',
  color: '#9b2e1f',
  borderRadius: 999,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const secondaryLinkStyle = {
  color: 'var(--accent)',
  fontWeight: 700,
  padding: '12px 4px',
} as const;


