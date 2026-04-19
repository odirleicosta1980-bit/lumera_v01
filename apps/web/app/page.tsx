import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { NotificationsPanel } from '../components/notifications/notifications-panel';
import { FilterableKanban } from '../components/licitacoes/filterable-kanban';
import { getNotifications } from '../lib/notifications';
import { getDashboardSummary, getKanbanData } from '../lib/kanban-api';
import { requireSessionUser } from '../lib/server-auth';

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function MetricCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <article
      style={{
        background: 'rgba(255, 250, 242, 0.82)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, margin: '10px 0 8px' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{hint}</div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 14,
        alignContent: 'start',
        background: 'rgba(255, 250, 242, 0.86)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {title || subtitle ? (
        <div>
          {title ? <h2 style={{ margin: '0 0 6px' }}>{title}</h2> : null}
          {subtitle ? <p style={{ color: 'var(--muted)', margin: 0 }}>{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function DashboardCalendarHeader({
  title,
  subtitle,
  month,
  year,
  filterName,
  filterValue,
  filterOptions,
  preservedParams,
}: {
  title: string;
  subtitle: string;
  month: number;
  year: number;
  filterName?: string;
  filterValue?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  preservedParams?: Record<string, string | undefined>;
}) {
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...(preservedParams ?? {}), ...overrides })) {
      if (value) {
        params.set(key, value);
      }
    }

    const query = params.toString();
    return `/${query ? `?${query}` : ''}`;
  };

  const current = new Date(Date.UTC(year, month - 1, 1));
  const previous = new Date(Date.UTC(year, month - 2, 1));
  const next = new Date(Date.UTC(year, month, 1));
  const previousYear = new Date(Date.UTC(year - 1, month - 1, 1));
  const nextYear = new Date(Date.UTC(year + 1, month - 1, 1));
  const currentLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(current);

  const baseLinkStyle = {
    border: '1px solid var(--line)',
    borderRadius: 999,
    padding: '8px 12px',
    textDecoration: 'none',
    color: 'var(--foreground)',
    fontWeight: 700,
    background: '#fff',
    fontSize: 13,
  } as const;

  const currentMonth = new Date();
  const todayHref = buildHref({
    month: String(currentMonth.getUTCMonth() + 1),
    year: String(currentMonth.getUTCFullYear()),
  });

  const hiddenEntries = Object.entries(preservedParams ?? {}).filter(([key]) => key !== filterName);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: '0 0 6px' }}>{title}</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
        {filterName && filterOptions?.length ? (
          <form method="get" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input type="hidden" name="month" value={String(month)} />
            <input type="hidden" name="year" value={String(year)} />
            {hiddenEntries.map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )}
            <select
              name={filterName}
              defaultValue={filterValue ?? ''}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 999,
                padding: '8px 12px',
                background: '#fff',
                color: 'var(--foreground)',
                fontWeight: 700,
                fontSize: 13,
                minWidth: 180,
              }}
            >
              <option value="">Todas as empresas</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit" style={baseLinkStyle}>
              Filtrar
            </button>
          </form>
        ) : null}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link
            href={buildHref({
              month: String(previousYear.getUTCMonth() + 1),
              year: String(previousYear.getUTCFullYear()),
            })}
            style={baseLinkStyle}
          >
          Ano anterior
          </Link>
          <Link
            href={buildHref({
              month: String(previous.getUTCMonth() + 1),
              year: String(previous.getUTCFullYear()),
            })}
            style={baseLinkStyle}
          >
          Mes anterior
          </Link>
          <span style={{ fontWeight: 700, minWidth: 120, textAlign: 'center' }}>{currentLabel}</span>
          <Link
            href={buildHref({
              month: String(next.getUTCMonth() + 1),
              year: String(next.getUTCFullYear()),
            })}
            style={baseLinkStyle}
          >
          Proximo mes
          </Link>
          <Link
            href={buildHref({
              month: String(nextYear.getUTCMonth() + 1),
              year: String(nextYear.getUTCFullYear()),
            })}
            style={baseLinkStyle}
          >
          Proximo ano
          </Link>
          <Link href={todayHref} style={baseLinkStyle}>
            Hoje
          </Link>
        </div>
      </div>
    </div>
  );
}

function getCurrentMonthCalendar(
  sessions: Array<{
    id: string;
    titulo: string;
    numeroProcesso?: string | null;
    dataSessao?: string | null;
    company: string;
    etapa: string;
  }>,
  period: {
    month: number;
    year: number;
  },
) {
  const today = new Date();
  const year = period.year;
  const month = period.month - 1;
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const startWeekday = monthStart.getUTCDay();
  const leadingEmptyDays = startWeekday === 0 ? 6 : startWeekday - 1;
  const totalDays = monthEnd.getUTCDate();

  const sessionsByDay = new Map<number, typeof sessions>();
  for (const session of sessions) {
    if (!session.dataSessao) continue;
    const date = new Date(session.dataSessao);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month) continue;
    const day = date.getUTCDate();
    const current = sessionsByDay.get(day) ?? [];
    current.push(session);
    sessionsByDay.set(day, current);
  }

  for (const [day, items] of sessionsByDay.entries()) {
    items.sort((left, right) => Number(new Date(left.dataSessao ?? 0)) - Number(new Date(right.dataSessao ?? 0)));
    sessionsByDay.set(day, items);
  }

  const cells: Array<{ day: number | null; sessions: typeof sessions; isToday: boolean }> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ day: null, sessions: [], isToday: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      day,
      sessions: sessionsByDay.get(day) ?? [],
      isToday:
        today.getUTCFullYear() === year &&
        today.getUTCMonth() === month &&
        today.getUTCDate() === day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, sessions: [], isToday: false });
  }

  return {
    monthLabel: new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(monthStart),
    weekDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    cells,
  };
}

function getCurrentMonthTaskCalendar(
  tasks: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    status: string;
    licitacaoId: string;
    licitacaoTitulo: string;
    company: string;
  }>,
  period: {
    month: number;
    year: number;
  },
) {
  const today = new Date();
  const year = period.year;
  const month = period.month - 1;
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const startWeekday = monthStart.getUTCDay();
  const leadingEmptyDays = startWeekday === 0 ? 6 : startWeekday - 1;
  const totalDays = monthEnd.getUTCDate();

  const tasksByDay = new Map<number, typeof tasks>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const date = new Date(task.dueDate);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month) continue;
    const day = date.getUTCDate();
    const current = tasksByDay.get(day) ?? [];
    current.push(task);
    tasksByDay.set(day, current);
  }

  for (const [day, items] of tasksByDay.entries()) {
    items.sort((left, right) => Number(new Date(left.dueDate ?? 0)) - Number(new Date(right.dueDate ?? 0)));
    tasksByDay.set(day, items);
  }

  const cells: Array<{ day: number | null; tasks: typeof tasks; isToday: boolean }> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ day: null, tasks: [], isToday: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      day,
      tasks: tasksByDay.get(day) ?? [],
      isToday:
        today.getUTCFullYear() === year &&
        today.getUTCMonth() === month &&
        today.getUTCDate() === day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, tasks: [], isToday: false });
  }

  return {
    monthLabel: new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(monthStart),
    weekDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    cells,
  };
}

function isTaskOverdue(task: { dueDate?: string | null; status: string }) {
  if (!task.dueDate || task.status === 'DONE') {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string; sessionsCompanyId?: string; tasksCompanyId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireSessionUser();
  const isLumeraOperator = user.memberships.some(
    (membership) => membership.roleCode === 'LUMERA_ADMIN' || membership.roleCode === 'LUMERA_OPERACIONAL',
  );

  if (!isLumeraOperator) {
    const stages = await getKanbanData();

    return (
      <main style={{ padding: '32px 28px 48px' }}>
        <section
          style={{
            background: 'rgba(255, 250, 242, 0.72)',
            border: '1px solid var(--line)',
            borderRadius: 28,
            padding: 28,
            boxShadow: 'var(--shadow)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: 'var(--accent)' }}>
                Portal do Cliente
              </div>
              <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1 }}>
                Acompanhamento claro das licitacoes da sua empresa.
              </h1>
              <p style={{ maxWidth: 780, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6 }}>
                Consulte etapas, comentarios compartilhados, anexos e a evolucao das licitacoes disponibilizadas pela equipe Lumera.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/licitacoes"
                style={{
                  background: 'var(--accent)',
                  color: '#fffaf2',
                  padding: '14px 18px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                Ver licitacoes
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <h2 style={{ marginBottom: 6 }}>Quadro compartilhado com sua empresa</h2>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            Visualizacao simplificada das licitacoes que estao sob acompanhamento da Lumera para sua empresa.
          </p>
        </section>

        <FilterableKanban stages={stages} showFilter={false} showOwners={false} />
      </main>
    );
  }

  const selectedMonth = resolvedSearchParams?.month ? Number(resolvedSearchParams.month) : undefined;
  const selectedYear = resolvedSearchParams?.year ? Number(resolvedSearchParams.year) : undefined;
  const selectedSessionsCompanyId = resolvedSearchParams?.sessionsCompanyId ?? '';
  const selectedTasksCompanyId = resolvedSearchParams?.tasksCompanyId ?? '';

  const [dashboard, notifications] = await Promise.all([
    getDashboardSummary({
      month: Number.isInteger(selectedMonth) ? selectedMonth : undefined,
      year: Number.isInteger(selectedYear) ? selectedYear : undefined,
    }),
    getNotifications(),
  ]);
  const sessionCompanyOptions = Array.from(
    new Map(dashboard.upcomingSessions.map((session) => [session.clientCompanyId, session.company])).entries(),
  )
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  const taskCompanyOptions = Array.from(
    new Map(dashboard.monthTasks.map((task) => [task.clientCompanyId, task.company])).entries(),
  )
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));

  const filteredSessions = selectedSessionsCompanyId
    ? dashboard.upcomingSessions.filter((session) => session.clientCompanyId === selectedSessionsCompanyId)
    : dashboard.upcomingSessions;
  const filteredTasks = selectedTasksCompanyId
    ? dashboard.monthTasks.filter((task) => task.clientCompanyId === selectedTasksCompanyId)
    : dashboard.monthTasks;

  const sessionCalendar = getCurrentMonthCalendar(filteredSessions, dashboard.period);
  const monthTaskCalendar = getCurrentMonthTaskCalendar(filteredTasks, dashboard.period);

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
              Dashboard operacional
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 5vw, 3.6rem)', lineHeight: 1.02 }}>
              Visao gerencial da operacao de licitacoes.
            </h1>
            <p style={{ maxWidth: 820, color: 'var(--muted)', fontSize: 18, lineHeight: 1.6 }}>
              Acompanhe volume por etapa, empresas participantes com maior carga, sessoes do mes e tarefas programadas da equipe Lumera.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/licitacoes"
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
            <Link
              href="/empresas"
              style={{
                border: '1px solid var(--line)',
                padding: '14px 18px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Ver empresas
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="Licitacoes" value={dashboard.metrics.totalLicitacoes} hint="Total acompanhado pela Lumera" />
        <MetricCard label="Empresas" value={dashboard.metrics.empresasParticipantes} hint="Empresas participantes no quadro" />
        <MetricCard label="Sessoes no mes" value={dashboard.metrics.sessoesProximas} hint="Agenda do mes atual" />
        <MetricCard label="Tarefas no mes" value={dashboard.metrics.tarefasNoMes} hint="Agenda operacional do periodo" />
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <Panel style={{ alignSelf: 'start' }}>
          <DashboardCalendarHeader
            title="Sessoes do mes"
            subtitle={`Calendario de ${sessionCalendar.monthLabel} com as licitacoes previstas.`}
            month={dashboard.period.month}
            year={dashboard.period.year}
            filterName="sessionsCompanyId"
            filterValue={selectedSessionsCompanyId}
            filterOptions={sessionCompanyOptions}
            preservedParams={{
              month: String(dashboard.period.month),
              year: String(dashboard.period.year),
              sessionsCompanyId: selectedSessionsCompanyId || undefined,
              tasksCompanyId: selectedTasksCompanyId || undefined,
            }}
          />
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {sessionCalendar.weekDays.map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '0 4px',
                    color: 'var(--muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {sessionCalendar.cells.map((cell, index) => (
                <div
                  key={`${cell.day ?? 'empty'}-${index}`}
                  style={{
                    minHeight: 128,
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    background: cell.day ? '#fff' : 'rgba(255,255,255,0.35)',
                    padding: 10,
                    display: 'grid',
                    alignContent: 'start',
                    gap: 8,
                    boxShadow: cell.day && cell.sessions.length ? 'var(--shadow)' : 'none',
                  }}
                >
                  {cell.day ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <strong
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: cell.isToday ? 'var(--accent)' : 'rgba(160, 100, 40, 0.08)',
                            color: cell.isToday ? '#fffaf2' : 'var(--foreground)',
                            fontSize: 13,
                          }}
                        >
                          {cell.day}
                        </strong>
                        {cell.sessions.length ? (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                            {cell.sessions.length} item(ns)
                          </span>
                        ) : null}
                      </div>

                      {cell.sessions.length ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {cell.sessions.map((session) => (
                            <Link
                              key={session.id}
                              href={`/licitacoes/${session.id}`}
                              style={{
                                display: 'grid',
                                gap: 2,
                                textDecoration: 'none',
                                color: 'inherit',
                                borderRadius: 12,
                                border: '1px solid rgba(160, 100, 40, 0.18)',
                                background: 'rgba(255, 248, 236, 0.92)',
                                padding: 8,
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>
                                {formatTime(session.dataSessao)}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{session.titulo}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.3 }}>{session.company}</div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Sem sessoes</div>
                      )}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel style={{ alignSelf: 'start' }}>
          <DashboardCalendarHeader
            title="Tarefas do mes"
            subtitle={`Calendario de ${monthTaskCalendar.monthLabel} com todas as tarefas das licitacoes.`}
            month={dashboard.period.month}
            year={dashboard.period.year}
            filterName="tasksCompanyId"
            filterValue={selectedTasksCompanyId}
            filterOptions={taskCompanyOptions}
            preservedParams={{
              month: String(dashboard.period.month),
              year: String(dashboard.period.year),
              sessionsCompanyId: selectedSessionsCompanyId || undefined,
              tasksCompanyId: selectedTasksCompanyId || undefined,
            }}
          />
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {monthTaskCalendar.weekDays.map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '0 4px',
                    color: 'var(--muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
              {monthTaskCalendar.cells.map((cell, index) => (
                <div
                  key={`${cell.day ?? 'empty'}-${index}`}
                  style={{
                    minHeight: 128,
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    background: cell.day ? '#fff' : 'rgba(255,255,255,0.35)',
                    padding: 10,
                    display: 'grid',
                    alignContent: 'start',
                    gap: 8,
                    boxShadow: cell.day && cell.tasks.length ? 'var(--shadow)' : 'none',
                  }}
                >
                  {cell.day ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <strong
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: cell.isToday ? 'var(--accent)' : 'rgba(160, 100, 40, 0.08)',
                            color: cell.isToday ? '#fffaf2' : 'var(--foreground)',
                            fontSize: 13,
                          }}
                        >
                          {cell.day}
                        </strong>
                        {cell.tasks.length ? (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                            {cell.tasks.length} item(ns)
                          </span>
                        ) : null}
                      </div>

                      {cell.tasks.length ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {cell.tasks.map((task) => {
                            const overdue = isTaskOverdue(task);

                            return (
                              <Link
                                key={task.id}
                                href={`/licitacoes/${task.licitacaoId}`}
                                style={{
                                  display: 'grid',
                                  gap: 2,
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  borderRadius: 12,
                                  border: overdue ? '1px solid rgba(220, 38, 38, 0.18)' : '1px solid rgba(160, 100, 40, 0.18)',
                                  background: overdue ? 'rgba(254, 242, 242, 0.98)' : 'rgba(255, 248, 236, 0.92)',
                                  padding: 8,
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 800, color: overdue ? '#b91c1c' : 'var(--accent)' }}>
                                  {formatTime(task.dueDate)}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{task.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.3 }}>{task.company}</div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Sem tarefas</div>
                      )}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 0.9fr' }}>
        <Panel title="Distribuicao por etapa" subtitle="Volume atual de licitacoes em cada coluna do fluxo.">
          <div style={{ display: 'grid', gap: 12 }}>
            {dashboard.stageCounts.map((stage) => (
              <div key={stage.etapaId} style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{stage.name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{stage.count}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: 'rgba(160, 100, 40, 0.12)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${dashboard.metrics.totalLicitacoes && stage.count > 0 ? (stage.count / dashboard.metrics.totalLicitacoes) * 100 : 0}%`,
                      height: '100%',
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Empresas com maior volume" subtitle="Participantes com mais licitacoes ativas no quadro.">
          {dashboard.companyCounts.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {dashboard.companyCounts.map((company) => (
                <article
                  key={company.clientCompanyId}
                  style={{
                    display: 'grid',
                    gap: 8,
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    background: '#fff',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{company.name}</span>
                    <strong>{company.count}</strong>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Documentos da empresa
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        padding: '6px 12px',
                        border: '1px solid #fdba74',
                        background: '#fff7ed',
                        color: '#9a3412',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Pendentes ({company.documentosPendentes})
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        padding: '6px 12px',
                        border: '1px solid #f59e0b',
                        background: '#fff1d6',
                        color: '#b45309',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Vencendo ({company.documentosVencendo})
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        padding: '6px 12px',
                        border: '1px solid #ef4444',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Vencidos ({company.documentosVencidos})
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Nenhuma empresa participante com licitacoes no momento.</p>
          )}
        </Panel>
      </section>

      <NotificationsPanel notifications={notifications} />
    </main>
  );
}
