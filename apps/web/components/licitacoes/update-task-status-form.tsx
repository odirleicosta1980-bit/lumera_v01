'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type UpdateTaskStatusFormProps = {
  licitacaoId: string;
  tarefaId: string;
  currentStatus: string;
};

const statusLabels: Record<string, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluida',
  CANCELED: 'Cancelada',
};

export function UpdateTaskStatusForm({ licitacaoId, tarefaId, currentStatus }: UpdateTaskStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function updateStatus(nextStatus: string) {
    const response = await fetch(`/api/licitacoes/${licitacaoId}/tarefas/${tarefaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      return;
    }

    startTransition(() => router.refresh());
  }

  const actions =
    currentStatus === 'DONE'
      ? [{ label: 'Reabrir', status: 'TODO' }]
      : currentStatus === 'TODO'
        ? [{ label: 'Iniciar', status: 'IN_PROGRESS' }, { label: 'Concluir', status: 'DONE' }]
        : currentStatus === 'IN_PROGRESS'
          ? [{ label: 'Concluir', status: 'DONE' }, { label: 'Cancelar', status: 'CANCELED' }]
          : [{ label: 'Reabrir', status: 'TODO' }];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12, alignSelf: 'center' }}>
        Status atual: {statusLabels[currentStatus] ?? currentStatus}
      </span>
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={isPending}
          onClick={() => updateStatus(action.status)}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '8px 12px',
            background: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Salvando...' : action.label}
        </button>
      ))}
    </div>
  );
}
