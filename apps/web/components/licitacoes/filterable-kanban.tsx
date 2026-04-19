'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '../kanban-board';
import type { KanbanStage } from '../../lib/kanban-api';

type DraggedCard = {
  cardId: string;
  stageId: string;
};

type DropTarget = {
  stageId: string;
  index: number;
};

function cloneStages(stages: KanbanStage[]) {
  return stages.map((stage) => ({
    ...stage,
    cards: [...stage.cards],
  }));
}

function moveCardBetweenStages(
  stages: KanbanStage[],
  source: { stageId: string; index: number },
  target: { stageId: string; index: number },
) {
  const nextStages = cloneStages(stages);
  const sourceStage = nextStages.find((stage) => stage.id === source.stageId);
  const targetStage = nextStages.find((stage) => stage.id === target.stageId);

  if (!sourceStage || !targetStage) {
    return stages;
  }

  const [movedCard] = sourceStage.cards.splice(source.index, 1);
  if (!movedCard) {
    return stages;
  }

  let insertionIndex = Math.max(0, Math.min(target.index, targetStage.cards.length));

  if (source.stageId === target.stageId && source.index < insertionIndex) {
    insertionIndex -= 1;
  }

  targetStage.cards.splice(insertionIndex, 0, movedCard);
  return nextStages;
}

function findCardLocation(stages: KanbanStage[], cardId: string) {
  for (const stage of stages) {
    const index = stage.cards.findIndex((card) => card.id === cardId);
    if (index >= 0) {
      return { stageId: stage.id, index };
    }
  }

  return null;
}

function removeCardFromStages(stages: KanbanStage[], cardId: string) {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.filter((card) => card.id !== cardId),
  }));
}

function resolveTargetIndex(
  stages: KanbanStage[],
  cardId: string,
  targetStageId: string,
  filteredTargetIndex: number,
  selectedCompany: string,
) {
  const stagesWithoutCard = removeCardFromStages(stages, cardId);
  const targetStage = stagesWithoutCard.find((stage) => stage.id === targetStageId);

  if (!targetStage) {
    return filteredTargetIndex;
  }

  if (selectedCompany === 'ALL') {
    return Math.max(0, Math.min(filteredTargetIndex, targetStage.cards.length));
  }

  const visibleCards = targetStage.cards.filter((card) => card.company === selectedCompany);

  if (!visibleCards.length) {
    return targetStage.cards.length;
  }

  if (filteredTargetIndex <= 0) {
    return targetStage.cards.findIndex((card) => card.id === visibleCards[0]?.id);
  }

  if (filteredTargetIndex >= visibleCards.length) {
    const lastVisibleCardId = visibleCards[visibleCards.length - 1]?.id;
    const lastVisibleCardIndex = targetStage.cards.findIndex((card) => card.id === lastVisibleCardId);
    return lastVisibleCardIndex >= 0 ? lastVisibleCardIndex + 1 : targetStage.cards.length;
  }

  const anchorCardId = visibleCards[filteredTargetIndex]?.id;
  const anchorCardIndex = targetStage.cards.findIndex((card) => card.id === anchorCardId);
  return anchorCardIndex >= 0 ? anchorCardIndex : targetStage.cards.length;
}

export function FilterableKanban({
  stages,
  showFilter,
  showOwners = true,
  canDrag = false,
}: {
  stages: KanbanStage[];
  showFilter: boolean;
  showOwners?: boolean;
  canDrag?: boolean;
}) {
  const router = useRouter();
  const [boardStages, setBoardStages] = useState(stages);
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setBoardStages(stages);
  }, [stages]);

  const companies = useMemo(() => {
    const values = new Set<string>();
    for (const stage of boardStages) {
      for (const card of stage.cards) {
        values.add(card.company);
      }
    }
    return Array.from(values).sort();
  }, [boardStages]);

  const filteredStages = useMemo(() => {
    if (selectedCompany === 'ALL') {
      return boardStages;
    }

    return boardStages.map((stage) => ({
      ...stage,
      cards: stage.cards.filter((card) => card.company === selectedCompany),
    }));
  }, [boardStages, selectedCompany]);

  const dragEnabled = Boolean(canDrag && !isPending);

  async function commitMove(targetStageId: string, filteredTargetIndex: number) {
    if (!draggedCard) {
      return;
    }

    const sourceLocation = findCardLocation(boardStages, draggedCard.cardId);
    if (!sourceLocation) {
      setDraggedCard(null);
      setDropTarget(null);
      return;
    }

    const targetIndex = resolveTargetIndex(
      boardStages,
      draggedCard.cardId,
      targetStageId,
      filteredTargetIndex,
      selectedCompany,
    );

    const previousStages = boardStages;
    const nextStages = moveCardBetweenStages(boardStages, sourceLocation, {
      stageId: targetStageId,
      index: targetIndex,
    });

    setBoardStages(nextStages);
    setError(null);

    try {
      const response = await fetch(`/api/licitacoes/${draggedCard.cardId}/etapa`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etapaId: targetStageId,
          sortOrder: targetIndex,
        }),
      });

      if (!response.ok) {
        throw new Error('Nao foi possivel mover a licitacao no quadro.');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (moveError) {
      setBoardStages(previousStages);
      setError(moveError instanceof Error ? moveError.message : 'Nao foi possivel mover a licitacao no quadro.');
    } finally {
      setDraggedCard(null);
      setDropTarget(null);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {showFilter && companies.length > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)' }}>Filtre o quadro por empresa cliente.</div>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            style={{
              minWidth: 220,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: '#fff',
            }}
          >
            <option value="ALL">Todas as empresas</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(184, 48, 34, 0.08)',
            color: '#8c2f21',
            border: '1px solid rgba(184, 48, 34, 0.2)',
          }}
        >
          {error}
        </div>
      ) : null}

      <KanbanBoard
        stages={filteredStages}
        showOwners={showOwners}
        canDrag={dragEnabled}
        draggedCardId={draggedCard?.cardId ?? null}
        dropTarget={dropTarget}
        onDragStart={(stageId, index, cardId) => {
          setDraggedCard({ stageId, cardId });
          setDropTarget({ stageId, index });
          setError(null);
        }}
        onDragEnd={() => {
          setDraggedCard(null);
          setDropTarget(null);
        }}
        onCardDragOver={(stageId, index) => {
          if (!dragEnabled) {
            return;
          }

          setDropTarget({ stageId, index });
        }}
        onCardDrop={(stageId, index) => {
          if (!dragEnabled) {
            return;
          }

          void commitMove(stageId, index);
        }}
        onStageDragOver={(stageId) => {
          if (!dragEnabled) {
            return;
          }

          const stage = filteredStages.find((candidate) => candidate.id === stageId);
          setDropTarget({ stageId, index: stage?.cards.length ?? 0 });
        }}
        onStageDrop={(stageId) => {
          if (!dragEnabled) {
            return;
          }

          const stage = filteredStages.find((candidate) => candidate.id === stageId);
          void commitMove(stageId, stage?.cards.length ?? 0);
        }}
      />
    </div>
  );
}
