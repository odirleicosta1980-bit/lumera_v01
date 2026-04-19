'use client';

import Link from 'next/link';
import type { KanbanStage } from '../lib/kanban-api';

type KanbanBoardProps = {
  stages: KanbanStage[];
  showOwners?: boolean;
  canDrag?: boolean;
  draggedCardId?: string | null;
  dropTarget?: { stageId: string; index: number } | null;
  onDragStart?: (stageId: string, index: number, cardId: string) => void;
  onDragEnd?: () => void;
  onCardDragOver?: (stageId: string, index: number) => void;
  onCardDrop?: (stageId: string, index: number) => void;
  onStageDragOver?: (stageId: string) => void;
  onStageDrop?: (stageId: string) => void;
};

function formatTaskStatus(status: string) {
  switch (status) {
    case 'DONE':
      return 'Concluida';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return 'A fazer';
  }
}

function formatTaskDate(dueDate?: string | null) {
  if (!dueDate) {
    return undefined;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(dueDate));
}

function getTaskStatusStyles(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        color: '#8a4b12',
        background: 'rgba(214, 154, 52, 0.16)',
        border: '1px solid rgba(214, 154, 52, 0.32)',
      };
    case 'CANCELLED':
      return {
        color: '#8c2f21',
        background: 'rgba(201, 84, 61, 0.12)',
        border: '1px solid rgba(201, 84, 61, 0.26)',
      };
    default:
      return {
        color: '#6e4b1c',
        background: 'rgba(125, 63, 29, 0.08)',
        border: '1px solid rgba(125, 63, 29, 0.18)',
      };
  }
}

function getTaskCardStyles(isOverdue: boolean) {
  if (isOverdue) {
    return {
      border: '1px solid rgba(184, 48, 34, 0.35)',
      background: 'rgba(184, 48, 34, 0.08)',
      boxShadow: 'inset 0 0 0 1px rgba(184, 48, 34, 0.06)',
    };
  }

  return {
    border: '1px solid rgba(125, 63, 29, 0.12)',
    background: 'rgba(255,255,255,0.72)',
    boxShadow: 'none',
  };
}

export function KanbanBoard({
  stages,
  showOwners = true,
  canDrag = false,
  draggedCardId = null,
  dropTarget = null,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDrop,
  onStageDragOver,
  onStageDrop,
}: KanbanBoardProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: `repeat(${stages.length}, minmax(260px, 1fr))`,
        overflowX: 'auto',
      }}
    >
      {stages.map((stage) => (
        <section
          key={stage.id}
          onDragOver={canDrag ? (event) => {
            event.preventDefault();
            onStageDragOver?.(stage.id);
          } : undefined}
          onDrop={canDrag ? (event) => {
            event.preventDefault();
            onStageDrop?.(stage.id);
          } : undefined}
          style={{
            background: dropTarget?.stageId === stage.id ? 'rgba(255, 247, 238, 0.95)' : 'rgba(255, 250, 242, 0.82)',
            border: dropTarget?.stageId === stage.id ? '1px dashed rgba(125, 63, 29, 0.5)' : '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: 16,
            minHeight: 420,
            boxShadow: 'var(--shadow)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong>{stage.name}</strong>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{stage.cards.length}</span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {stage.cards.map((card, index) => {
              const isDragged = draggedCardId === card.id;
              const isDropTarget = dropTarget?.stageId === stage.id && dropTarget.index === index;

              return (
                <article
                  key={card.id}
                  draggable={canDrag}
                  onDragStart={canDrag ? () => onDragStart?.(stage.id, index, card.id) : undefined}
                  onDragEnd={canDrag ? () => onDragEnd?.() : undefined}
                  onDragOver={canDrag ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCardDragOver?.(stage.id, index);
                  } : undefined}
                  onDrop={canDrag ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCardDrop?.(stage.id, index);
                  } : undefined}
                  style={{
                    background: 'var(--panel-strong)',
                    border: isDropTarget ? '1px dashed rgba(125, 63, 29, 0.55)' : '1px solid rgba(125, 63, 29, 0.16)',
                    borderRadius: 14,
                    padding: 14,
                    cursor: canDrag ? 'grab' : 'default',
                    opacity: isDragged ? 0.55 : 1,
                    transform: isDragged ? 'scale(0.98)' : 'none',
                    transition: 'border-color 120ms ease, opacity 120ms ease, transform 120ms ease',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{card.company}</div>
                  <div style={{ fontWeight: 700, lineHeight: 1.35 }}>{card.title}</div>
                  {card.processLabel ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)' }}>{card.processLabel}</div>
                  ) : null}
                  {showOwners ? (
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
                      Responsaveis: {card.owners.length ? card.owners.join(', ') : 'Nao atribuidos'}
                    </div>
                  ) : null}
                  {card.dueLabel ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)' }}>{card.dueLabel}</div>
                  ) : null}
                  {showOwners && card.taskSummary?.length ? (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {card.taskSummary.map((item) => (
                        <span
                          key={item.status}
                          style={{
                            ...getTaskStatusStyles(item.status),
                            borderRadius: 999,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.count} {formatTaskStatus(item.status)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {showOwners && card.tasks?.length ? (
                    <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Tarefas</div>
                      {card.tasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            ...getTaskCardStyles(task.isOverdue),
                            borderRadius: 10,
                            padding: '8px 10px',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: task.isOverdue ? '#8c2f21' : 'inherit' }}>
                            {task.title}
                          </div>
                          {task.dueDate ? (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11,
                                color: task.isOverdue ? '#b83022' : 'var(--muted)',
                                fontWeight: task.isOverdue ? 700 : 500,
                              }}
                            >
                              {task.isOverdue ? `Atrasada em ${formatTaskDate(task.dueDate)}` : `Prazo em ${formatTaskDate(task.dueDate)}`}
                            </div>
                          ) : null}
                          <div
                            style={{
                              ...getTaskStatusStyles(task.status),
                              display: 'inline-flex',
                              marginTop: 6,
                              borderRadius: 999,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {formatTaskStatus(task.status)}
                          </div>
                        </div>
                      ))}
                      {card.tasksOverflowCount ? (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>+ {card.tasksOverflowCount} tarefa(s)</div>
                      ) : null}
                    </div>
                  ) : null}
                  <div style={{ marginTop: 12 }}>
                    <Link href={card.href} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                      Ver detalhe
                    </Link>
                  </div>
                </article>
              );
            })}
            {canDrag && dropTarget?.stageId === stage.id && dropTarget.index === stage.cards.length ? (
              <div
                style={{
                  border: '1px dashed rgba(125, 63, 29, 0.55)',
                  borderRadius: 14,
                  minHeight: 56,
                  background: 'rgba(255,255,255,0.4)',
                }}
              />
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}