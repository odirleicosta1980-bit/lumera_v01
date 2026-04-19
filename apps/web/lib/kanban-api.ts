import { redirect } from 'next/navigation';
import { requireAccessToken } from './server-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const DEFAULT_ORGANIZATION_ID = '9f7703db-ebf4-4aec-a5fc-c5fdbfa05575';

type ApiLicitacao = {
  id: string;
  titulo: string;
  descricao?: string | null;
  numeroProcesso?: string | null;
  dataSessao?: string | null;
  etapaId: string;
  etapa: {
    id: string;
    name: string;
  };
  clientCompany: {
    tradeName?: string | null;
    legalName: string;
    segmento?: string | null;
    taxId?: string | null;
    financialRule?: FinancialRule | null;
  };
  responsaveis: Array<{
    userId: string;
    user: {
      name: string;
    };
  }>;
  tarefas?: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: string | null;
  }>;
};

export type EtapaConfig = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
};

export type TaskTemplate = {
  id: string;
  title: string;
  description?: string | null;
  defaultDueDays?: number | null;
};

export type EditalImportDraftItem = {
  numeroItem?: string | null;
  numeroLote?: string | null;
  descricao: string;
  unidade?: string | null;
  quantidade?: string | null;
  valorReferencia?: string | null;
  valorProposto?: string | null;
  marcaModelo?: string | null;
  observacoes?: string | null;
  status: string;
};

export type EditalImportDraft = {
  edital: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    checksumSha256?: string;
    category: 'EDITAL_BASE';
  };
  extractedTextPreview: string;
  warnings: string[];
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

export type FinancialRule = {
  chargingModel: string;
  percentualLumera?: string | null;
  valorFixoLumera?: string | null;
  formaPagamento?: string | null;
  observacoes?: string | null;
};

export type CompanyDocumentType = {
  id: string;
  code: string;
  name: string;
  group: string;
  description?: string | null;
  requiresExpiration: boolean;
  warningDays: number;
  isRequired: boolean;
  isSystem: boolean;
  sortOrder: number;
};

export type CompanyDocument = {
  id?: string | null;
  status: string;
  storedStatus?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  deliveredAt?: string | null;
  lastValidatedAt?: string | null;
  checkedByUserId?: string | null;
  observations?: string | null;
  fileName?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: string | null;
  storageKey?: string | null;
  checksumSha256?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  documentType: CompanyDocumentType;
};

export type ParticipatingCompany = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  segmento?: string | null;
  taxId?: string | null;
  isActive: boolean;
  financialRule?: FinancialRule | null;
  documents?: CompanyDocument[];
};

export type OrganizationContext = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  clientCompanies: ParticipatingCompany[];
};

export type AssignableUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  memberships: Array<{
    id: string;
    organizationId: string;
    clientCompanyId: string | null;
    clientCompanyName: string | null;
    roleCode: string;
    roleName: string;
  }>;
};

export type KanbanTask = {
  id: string;
  title: string;
  status: string;
  dueDate?: string | null;
  isOverdue: boolean;
};

export type KanbanTaskSummary = {
  status: string;
  count: number;
};

export type KanbanStage = {
  id: string;
  name: string;
  cards: Array<{
    id: string;
    title: string;
    company: string;
    owners: string[];
    dueLabel?: string;
    processLabel?: string;
    href: string;
    currentEtapaId: string;
    tasks?: KanbanTask[];
    tasksOverflowCount?: number;
    taskSummary?: KanbanTaskSummary[];
  }>;
};

export type DashboardSummary = {
  generatedAt: string;
  period: {
    month: number;
    year: number;
  };
  metrics: {
    totalLicitacoes: number;
    empresasParticipantes: number;
    sessoesProximas: number;
    tarefasNoMes: number;
    tarefasEmAberto: number;
  };
  stageCounts: Array<{
    etapaId: string;
    name: string;
    count: number;
  }>;
  companyCounts: Array<{
    clientCompanyId: string;
    name: string;
    count: number;
    documentosPendentes: number;
    documentosVencendo: number;
    documentosVencidos: number;
  }>;
  upcomingSessions: Array<{
    id: string;
    clientCompanyId: string;
    titulo: string;
    numeroProcesso?: string | null;
    dataSessao?: string | null;
    company: string;
    etapa: string;
  }>;
  monthTasks: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    status: string;
    licitacaoId: string;
    clientCompanyId: string;
    licitacaoTitulo: string;
    company: string;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    description?: string | null;
    createdAt: string;
    licitacaoId?: string | null;
    licitacaoTitulo?: string | null;
  }>;
};
export type ExecutiveSummary = {
  generatedAt: string;
  metrics: {
    totalLicitacoes: number;
    empresasParticipantes: number;
    licitacoesComFinanceiro: number;
    valorEstimadoEdital: number;
    valorHomologado: number;
    receitaLumeraPrevista: number;
    pagamentosPendentes: number;
  };
  stageCounts: Array<{
    etapaId: string;
    name: string;
    count: number;
  }>;
  companyPerformance: Array<{
    clientCompanyId: string;
    name: string;
    segmento?: string | null;
    totalLicitacoes: number;
    valorHomologado: number;
    receitaLumeraPrevista: number;
    ticketMedio: number;
  }>;
  responsibleLoad: Array<{
    userId: string;
    name: string;
    totalLicitacoes: number;
    primaryAssignments: number;
  }>;
  financialStatusCounts: Array<{
    status: string;
    count: number;
  }>;
  upcomingReceivables: Array<{
    id: string;
    titulo: string;
    numeroProcesso?: string | null;
    company: string;
    vencimento?: string | null;
    statusFinanceiro: string;
    valorReceitaLumera: number;
  }>;
};

export type LicitacaoItem = {
  id: string;
  numeroItem?: string | null;
  numeroLote?: string | null;
  descricao: string;
  unidade?: string | null;
  quantidade?: string | null;
  valorReferencia?: string | null;
  valorProposto?: string | null;
  marcaModelo?: string | null;
  observacoes?: string | null;
  status: string;
};

export type LicitacaoEmpenho = {
  id: string;
  codigoEmpenho: string;
  valor: string;
  dataEmpenho?: string | null;
  dataPagamentoEmpenho?: string | null;
  dataGeracaoBoleto?: string | null;
  dataPagamentoBoleto?: string | null;
  observacoes?: string | null;
};
export type FinanceiroAllocation = {
  id: string;
  userId?: string | null;
  label: string;
  percentual?: string | null;
  valor?: string | null;
  sortOrder: number;
  user?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
};

export type LicitacaoFinanceiro = {
  id: string;
  valorEstimadoEdital?: string | null;
  valorPropostaEmpresa?: string | null;
  valorHomologado?: string | null;
  chargingModel: string;
  percentualLumera?: string | null;
  valorFixoLumera?: string | null;
  valorReceitaLumera?: string | null;
  formaPagamento?: string | null;
  statusFinanceiro: string;
  vencimento?: string | null;
  observacoes?: string | null;
  allocations: FinanceiroAllocation[];
};

export type LicitacaoDetail = ApiLicitacao & {
  organization: { id: string; tradeName?: string | null; legalName: string };
  comentarios: Array<{ id: string; body: string; isInternal: boolean; createdAt: string; user: { name: string } }>;
  itens: LicitacaoItem[];
  empenhos: LicitacaoEmpenho[];
  tarefas: Array<{ id: string; title: string; description?: string | null; status: string; dueDate?: string | null }>;
  anexos: Array<{ id: string; originalFileName: string; createdAt: string; storageKey: string; category?: string }>;
  activities: Array<{ id: string; action: string; description?: string | null; createdAt: string; metadata?: Record<string, unknown> | null }>;
  financeiro?: LicitacaoFinanceiro | null;
};

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await requireAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    redirect('/login');
  }

  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${path}.`);
  }

  return (await response.json()) as T;
}

function formatSessionDate(dataSessao?: string | null) {
  if (!dataSessao) {
    return undefined;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(dataSessao));
}

function isTaskOverdue(dueDate?: string | null) {
  if (!dueDate) {
    return false;
  }

  return new Date(dueDate).getTime() < Date.now();
}

export async function getEtapas(organizationId = DEFAULT_ORGANIZATION_ID) {
  return fetchApi<EtapaConfig[]>(`/api/etapas-licitacao?organizationId=${organizationId}`);
}

export async function getEtapasForManagement(organizationId: string) {
  return fetchApi<EtapaConfig[]>(`/api/etapas-licitacao?organizationId=${organizationId}&includeInactive=true`);
}

export async function getOrganizations() {
  return fetchApi<OrganizationContext[]>('/api/organizations');
}

export async function getAssignableUsers(organizationId: string, includeInactive = false) {
  const params = new URLSearchParams({ organizationId });
  if (includeInactive) {
    params.set('includeInactive', 'true');
  }

  return fetchApi<AssignableUser[]>(`/api/users?${params.toString()}`);
}

export async function getTaskTemplates(organizationId: string) {
  return fetchApi<TaskTemplate[]>(`/api/task-templates?organizationId=${organizationId}`);
}

export async function getDashboardSummary(period?: { month?: number; year?: number }) {
  const params = new URLSearchParams();
  if (period?.month) {
    params.set('month', String(period.month));
  }
  if (period?.year) {
    params.set('year', String(period.year));
  }

  const query = params.toString();
  return fetchApi<DashboardSummary>(`/api/dashboard/summary${query ? `?${query}` : ''}`);
}

export async function getExecutiveSummary() {
  return fetchApi<ExecutiveSummary>('/api/dashboard/executive');
}

export async function getKanbanData(organizationId = DEFAULT_ORGANIZATION_ID): Promise<KanbanStage[]> {
  const [etapas, licitacoes] = await Promise.all([getEtapas(organizationId), fetchApi<ApiLicitacao[]>('/api/licitacoes')]);

  return etapas.map((etapa) => ({
    id: etapa.id,
    name: etapa.name,
    cards: licitacoes
      .filter((licitacao) => licitacao.etapaId === etapa.id)
      .map((licitacao) => {
        const visibleTasks = (licitacao.tarefas ?? []).filter((tarefa) => tarefa.status !== 'DONE');
        const taskSummary = [
          { status: 'TODO', count: visibleTasks.filter((tarefa) => tarefa.status === 'TODO').length },
          { status: 'IN_PROGRESS', count: visibleTasks.filter((tarefa) => tarefa.status === 'IN_PROGRESS').length },
          { status: 'CANCELLED', count: visibleTasks.filter((tarefa) => tarefa.status === 'CANCELLED').length },
        ].filter((item) => item.count > 0);

        return {
          id: licitacao.id,
          title: licitacao.titulo,
          company: licitacao.clientCompany.tradeName ?? licitacao.clientCompany.legalName,
          owners: licitacao.responsaveis.map((responsavel) => responsavel.user.name),
          dueLabel: licitacao.dataSessao ? `Sessao em ${formatSessionDate(licitacao.dataSessao)}` : undefined,
          processLabel: licitacao.numeroProcesso ? `Processo ${licitacao.numeroProcesso}` : undefined,
          href: `/licitacoes/${licitacao.id}`,
          currentEtapaId: licitacao.etapaId,
          tasks: visibleTasks.slice(0, 3).map((tarefa) => ({
            id: tarefa.id,
            title: tarefa.title,
            status: tarefa.status,
            dueDate: tarefa.dueDate,
            isOverdue: isTaskOverdue(tarefa.dueDate),
          })),
          tasksOverflowCount: Math.max(0, visibleTasks.length - 3),
          taskSummary,
        };
      }),
  }));
}

export async function getLicitacao(id: string) {
  return fetchApi<LicitacaoDetail>(`/api/licitacoes/${id}`);
}
