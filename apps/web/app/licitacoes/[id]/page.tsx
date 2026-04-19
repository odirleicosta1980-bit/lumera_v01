import Link from 'next/link';
import { AssignResponsaveisForm } from '../../../components/licitacoes/assign-responsaveis-form';
import { CreateCommentForm } from '../../../components/licitacoes/create-comment-form';
import { CreateEmpenhoModal } from '../../../components/licitacoes/create-empenho-modal';
import { CreateItemModal } from '../../../components/licitacoes/create-item-modal';
import { DeleteItemButton } from '../../../components/licitacoes/delete-item-button';
import { UpdateEmpenhoModal } from '../../../components/licitacoes/update-empenho-modal';
import { UpdateLicitacaoBasicsModal } from '../../../components/licitacoes/update-licitacao-basics-modal';
import { UpdateItemForm } from '../../../components/licitacoes/update-item-form';
import { CreateTaskModal } from '../../../components/licitacoes/create-task-modal';
import { MoveLicitacaoEtapaForm } from '../../../components/licitacoes/move-licitacao-etapa-form';
import { UpdateTaskStatusForm } from '../../../components/licitacoes/update-task-status-form';
import { UpdateFinanceiroForm } from '../../../components/licitacoes/update-financeiro-form';
import { UploadAnexoForm } from '../../../components/licitacoes/upload-anexo-form';
import { UploadEmpenhoAnexoForm } from '../../../components/licitacoes/upload-empenho-anexo-form';
import { getAssignableUsers, getEtapas, getLicitacao, getTaskTemplates } from '../../../lib/kanban-api';
import { requireSessionUser } from '../../../lib/server-auth';

const DISPLAY_TIME_ZONE = 'America/Sao_Paulo';

export default async function LicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, licitacao, etapas] = await Promise.all([requireSessionUser(), getLicitacao(id), getEtapas()]);
  const canManage = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );
  const canManageAllocations = user.memberships.some(
    (membership) => membership.organizationId === licitacao.organization.id && membership.roleCode === 'LUMERA_ADMIN',
  );
  const canComment = canManage || user.memberships.some((membership) => membership.roleCode.startsWith('CLIENTE_'));
  const canUpload = canComment;
  const [users, taskTemplates] = canManage
    ? await Promise.all([
        getAssignableUsers(licitacao.organization.id),
        getTaskTemplates(licitacao.organization.id),
      ])
    : [[], []];
  const empenhos = licitacao.empenhos ?? [];

  return (
    <main style={{ padding: 32, display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
            Detalhe da licitacao
          </div>
          <h1 style={{ margin: '8px 0' }}>{licitacao.titulo}</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Empresa participante: {licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName} | {licitacao.etapa.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href='/licitacoes#quadro' style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Voltar ao quadro
          </Link>
        </div>
      </div>

      <section
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: canManage ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Resumo</h2>
              {canManage ? (
                <UpdateLicitacaoBasicsModal
                  licitacao={{
                    id: licitacao.id,
                    titulo: licitacao.titulo,
                    numeroProcesso: licitacao.numeroProcesso,
                    descricao: licitacao.descricao,
                    dataSessao: licitacao.dataSessao,
                  }}
                />
              ) : null}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><strong>Numero do processo:</strong> {licitacao.numeroProcesso ?? 'Nao informado'}</div>
              <div><strong>Empresa participante:</strong> {licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName}</div>
              {licitacao.clientCompany.segmento ? <div><strong>Segmento:</strong> {licitacao.clientCompany.segmento}</div> : null}
              <div><strong>Etapa atual:</strong> {licitacao.etapa.name}</div>
              <div>
                <strong>Data da sessao:</strong>{' '}
                {licitacao.dataSessao
                  ? new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      timeZone: DISPLAY_TIME_ZONE,
                    }).format(new Date(licitacao.dataSessao))
                  : 'Nao informada'}
              </div>
              {canManage ? (
                <div>
                  <strong>Responsaveis:</strong>{' '}
                  {licitacao.responsaveis.length
                    ? licitacao.responsaveis.map((item) => item.user.name).join(', ')
                    : 'Nao atribuidos'}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 8 }}>Descricao</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{licitacao.descricao ?? 'Sem descricao cadastrada.'}</p>
            </div>
          </div>

          {canManage ? (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Movimentacao</h2>
              <MoveLicitacaoEtapaForm
                licitacaoId={licitacao.id}
                currentEtapaId={licitacao.etapaId}
                etapas={etapas.map((etapa) => ({ id: etapa.id, name: etapa.name }))}
              />
            </section>
          ) : null}
        </div>

        {canManage ? (
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Financeiro</h2>
            <UpdateFinanceiroForm
              licitacaoId={licitacao.id}
              financialRule={licitacao.clientCompany.financialRule}
              financeiro={licitacao.financeiro}
              canManageAllocations={canManageAllocations}
              users={users.map((item) => ({
                id: item.id,
                name: item.name,
                roleCodes: item.memberships.map((membership) => membership.roleCode),
              }))}
            />
          </section>
        ) : null}
      </section>

      {canManage ? (
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Pagamentos da empresa</h2>
            <CreateEmpenhoModal licitacaoId={licitacao.id} />
          </div>
          {empenhos.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {empenhos.map((empenho) => (
                <div key={empenho.id} style={itemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <strong>Empenho {empenho.codigoEmpenho}</strong>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={moneyValueStyle}>{formatMoney(empenho.valor) ?? empenho.valor}</span>
                      <UpdateEmpenhoModal licitacaoId={licitacao.id} empenho={empenho} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12, marginTop: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div>
                      <div style={metaLabelStyle}>Data empenho</div>
                      <div style={metaValueStyle}>{formatDateOnly(empenho.dataEmpenho)}</div>
                    </div>
                    <div>
                      <div style={metaLabelStyle}>Pagamento do empenho</div>
                      <div style={metaValueStyle}>{formatDateOnly(empenho.dataPagamentoEmpenho)}</div>
                    </div>
                    <div>
                      <div style={metaLabelStyle}>Geracao do boleto</div>
                      <div style={metaValueStyle}>{formatDateOnly(empenho.dataGeracaoBoleto)}</div>
                    </div>
                    <div>
                      <div style={metaLabelStyle}>Pagamento do boleto</div>
                      <div style={metaValueStyle}>{formatDateOnly(empenho.dataPagamentoBoleto)}</div>
                    </div>
                  </div>

                  {empenho.observacoes ? (
                    <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 14 }}>
                      <strong>Observacoes:</strong> {empenho.observacoes}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Arquivos do empenho</div>
                    <UploadEmpenhoAnexoForm licitacaoId={licitacao.id} empenhoId={empenho.id} />
                    {empenho.anexos?.length ? (
                      <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                        {empenho.anexos.map((anexo) => (
                          <a
                            key={anexo.id}
                            href={anexo.storageKey}
                            target='_blank'
                            rel='noreferrer'
                            style={{ ...itemStyle, textDecoration: 'none', color: 'inherit', padding: 12 }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <strong>{anexo.originalFileName}</strong>
                              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{formatEmpenhoAttachmentCategory(anexo.category)}</span>
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                              Enviado em {new Intl.DateTimeFormat('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                                timeZone: 'UTC',
                              }).format(new Date(anexo.createdAt))}
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--muted)', margin: '10px 0 0' }}>Nenhum arquivo anexado a este empenho.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum empenho vinculado ainda.</p>
          )}
        </section>
      ) : null}

      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Itens da licitacao</h2>
          {canManage ? <CreateItemModal licitacaoId={licitacao.id} /> : null}
        </div>
        {licitacao.itens.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {licitacao.itens.map((item) => (
              <div key={item.id} style={itemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <strong>{formatItemIdentity(item)}</strong>
                  <span style={getItemStatusBadgeStyle(item.status)}>{formatItemStatusLabel(item.status)}</span>
                </div>

                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18 }}>{item.descricao}</div>

                <div style={{ display: 'grid', gap: 12, marginTop: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  {item.quantidade ? (
                    <div>
                      <div style={metaLabelStyle}>Quantidade</div>
                      <div style={metaValueStyle}>{item.quantidade}</div>
                    </div>
                  ) : null}
                  {item.unidade ? (
                    <div>
                      <div style={metaLabelStyle}>Unidade</div>
                      <div style={metaValueStyle}>{item.unidade}</div>
                    </div>
                  ) : null}
                  {item.valorReferencia ? (
                    <div>
                      <div style={metaLabelStyle}>Valor de referencia</div>
                      <div style={moneyValueStyle}>{formatMoney(item.valorReferencia)}</div>
                    </div>
                  ) : null}
                  {item.valorProposto ? (
                    <div>
                      <div style={metaLabelStyle}>Valor proposto</div>
                      <div style={moneyValueStyle}>{formatMoney(item.valorProposto)}</div>
                    </div>
                  ) : null}
                </div>

                {(item.marcaModelo || item.observacoes) ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 12, color: 'var(--muted)', fontSize: 14 }}>
                    {item.marcaModelo ? <div><strong>Marca / modelo:</strong> {item.marcaModelo}</div> : null}
                    {item.observacoes ? <div><strong>Observacoes:</strong> {item.observacoes}</div> : null}
                  </div>
                ) : null}

                {canManage ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                    <UpdateItemForm licitacaoId={licitacao.id} item={item} />
                    <DeleteItemButton licitacaoId={licitacao.id} itemId={item.id} itemDescricao={item.descricao} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum item vinculado ainda.</p>
        )}
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {canManage ? (
          <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Tarefas</h2>
            <CreateTaskModal licitacaoId={licitacao.id} templates={taskTemplates} />
          </div>
            {licitacao.tarefas.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {licitacao.tarefas.map((tarefa) => (
                  <div key={tarefa.id} style={itemStyle}>
                    <strong>{tarefa.title}</strong>
                    <div
                      style={{
                        color:
                          tarefa.status === 'DONE'
                            ? '#2f6b2f'
                            : tarefa.status === 'IN_PROGRESS'
                              ? '#8a5200'
                              : tarefa.status === 'CANCELED'
                                ? '#8a1c1c'
                                : 'var(--muted)',
                        fontSize: 13,
                      }}
                    >
                      {tarefa.status === 'TODO'
                        ? 'A fazer'
                        : tarefa.status === 'IN_PROGRESS'
                          ? 'Em andamento'
                          : tarefa.status === 'DONE'
                            ? 'Concluida'
                            : 'Cancelada'}
                    </div>
                    {tarefa.description ? <div style={{ marginTop: 6 }}>{tarefa.description}</div> : null}
                    {tarefa.dueDate ? (
                      <div style={{ color: 'var(--warning)', fontSize: 13, marginTop: 6 }}>
                        Prazo em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(new Date(tarefa.dueDate))}
                      </div>
                    ) : null}
                    <UpdateTaskStatusForm licitacaoId={licitacao.id} tarefaId={tarefa.id} currentStatus={tarefa.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhuma tarefa vinculada ainda.</p>
            )}
          </section>
        ) : null}

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Comentarios</h2>
          {canComment ? <CreateCommentForm licitacaoId={licitacao.id} allowInternal={canManage} /> : null}
          {licitacao.comentarios.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {licitacao.comentarios.map((comentario) => (
                <div
                  key={comentario.id}
                  style={{
                    ...itemStyle,
                    borderColor: comentario.isInternal ? '#d49a3a' : 'var(--line)',
                    background: comentario.isInternal ? '#fff7e8' : '#fff',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{comentario.user.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: comentario.isInternal ? '#f3d39a' : '#ebe6dd',
                        color: '#4b3a22',
                        fontWeight: 700,
                      }}
                    >
                      {comentario.isInternal ? 'Interno' : 'Compartilhado'}
                    </span>
                    <span>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(comentario.createdAt))}
                    </span>
                  </div>
                  <div>{comentario.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum comentario visivel ainda.</p>
          )}
        </section>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Anexos</h2>
        {canUpload ? <UploadAnexoForm licitacaoId={licitacao.id} /> : null}
        {licitacao.anexos.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {licitacao.anexos.map((anexo) => (
              <a key={anexo.id} href={anexo.storageKey} target='_blank' rel='noreferrer' style={{ ...itemStyle, textDecoration: 'none', color: 'inherit' }}>
                <strong>{anexo.originalFileName}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Enviado em{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: 'UTC',
                  }).format(new Date(anexo.createdAt))}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum anexo vinculado ainda.</p>
        )}
      </section>

      {canManage ? (
        <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Responsaveis</h2>
            <AssignResponsaveisForm
              licitacaoId={licitacao.id}
              users={users.map((item) => ({ id: item.id, name: item.name, email: item.email }))}
              selectedUserIds={licitacao.responsaveis.map((item) => item.userId)}
            />
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Historico</h2>
            {licitacao.activities.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {licitacao.activities.map((activity) => (
                  <div key={activity.id} style={itemStyle}>
                    <div style={{ fontWeight: 700 }}>{activity.description ?? activity.action}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(activity.createdAt))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum evento visivel para este perfil.</p>
            )}
          </section>
        </section>
      ) : (
        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Historico</h2>
          {licitacao.activities.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {licitacao.activities.map((activity) => (
                <div key={activity.id} style={itemStyle}>
                  <div style={{ fontWeight: 700 }}>{activity.description ?? activity.action}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(activity.createdAt))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Nenhum evento visivel para este perfil.</p>
          )}
        </section>
      )}
    </main>
  );
}

const panelStyle = {
  background: 'rgba(255, 250, 242, 0.88)',
  border: '1px solid var(--line)',
  borderRadius: 24,
  padding: 20,
  boxShadow: 'var(--shadow)',
} as const;

const itemStyle = {
  border: '1px solid var(--line)',
  borderRadius: 16,
  padding: 14,
  background: '#fff',
} as const;

const metaLabelStyle = {
  color: 'var(--muted)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 4,
} as const;

const metaValueStyle = {
  fontWeight: 700,
} as const;

const moneyValueStyle = {
  fontWeight: 800,
  color: '#2e2418',
} as const;

function formatDateOnly(value?: string | null) {
  if (!value) return 'Nao informada';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
}

function formatMoney(value?: string | null) {
  if (!value) return null;
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
}

function formatItemIdentity(item: { numeroItem?: string | null; numeroLote?: string | null }) {
  const parts = [
    item.numeroItem ? `Item ${item.numeroItem}` : null,
    item.numeroLote ? `Lote ${item.numeroLote}` : null,
  ].filter(Boolean);
  return parts.join(' | ') || 'Item sem identificacao';
}

function formatItemStatusLabel(status: string) {
  switch (status) {
    case 'EM_PRECIFICACAO':
      return 'Em precificacao';
    case 'PRECIFICADO':
      return 'Precificado';
    case 'DESCARTADO':
      return 'Descartado';
    default:
      return 'Pendente';
  }
}

function getItemStatusBadgeStyle(status: string) {
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    background:
      status === 'PRECIFICADO'
        ? '#d8f0d8'
        : status === 'EM_PRECIFICACAO'
          ? '#f7e4c2'
          : status === 'DESCARTADO'
            ? '#f4d4d0'
            : '#ebe6dd',
    color: '#4b3a22',
    fontWeight: 700,
    fontSize: 13,
  } as const;
}
function formatEmpenhoAttachmentCategory(category?: string | null) {
  switch (category) {
    case 'DOCUMENTO_EMPENHO':
      return 'Documento do empenho';
    case 'BOLETO':
      return 'Boleto';
    case 'COMPROVANTE_PAGAMENTO':
      return 'Comprovante de pagamento';
    case 'OUTRO':
      return 'Outro';
    default:
      return 'Arquivo';
  }
}
