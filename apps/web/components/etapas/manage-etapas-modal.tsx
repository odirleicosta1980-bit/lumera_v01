'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type { EtapaConfig } from '../../lib/kanban-api';

type Props = {
  organizationId: string;
  etapas: EtapaConfig[];
  closeHref: string;
};

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => ({}));
}

export function ManageEtapasModal({ organizationId, etapas, closeHref }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(etapas.map((etapa) => [etapa.id, etapa.name])),
  );

  const activeEtapas = useMemo(() => etapas.filter((etapa) => etapa.isActive), [etapas]);
  const inactiveEtapas = useMemo(() => etapas.filter((etapa) => !etapa.isActive), [etapas]);

  function setDraft(id: string, value: string) {
    setDraftNames((current) => ({ ...current, [id]: value }));
  }

  function refreshBoard() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleCreate() {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setFeedback('Informe o nome da coluna.');
      return;
    }

    setFeedback(null);
    const response = await fetch('/api/etapas-licitacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        name: trimmedName,
      }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      setFeedback((data as { message?: string }).message ?? 'Nao foi possivel criar a coluna.');
      return;
    }

    setNewName('');
    setFeedback('Coluna criada com sucesso.');
    refreshBoard();
  }

  async function handleRename(id: string) {
    const trimmedName = (draftNames[id] ?? '').trim();

    if (!trimmedName) {
      setFeedback('Informe o nome da coluna.');
      return;
    }

    setFeedback(null);
    const response = await fetch(`/api/etapas-licitacao/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      setFeedback((data as { message?: string }).message ?? 'Nao foi possivel atualizar a coluna.');
      return;
    }

    setFeedback('Coluna atualizada com sucesso.');
    refreshBoard();
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    setFeedback(null);
    const response = await fetch(`/api/etapas-licitacao/${id}/order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      setFeedback((data as { message?: string }).message ?? 'Nao foi possivel reordenar a coluna.');
      return;
    }

    refreshBoard();
  }

  async function handleSetStatus(id: string, isActive: boolean) {
    setFeedback(null);
    const response = await fetch(`/api/etapas-licitacao/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      setFeedback((data as { message?: string }).message ?? 'Nao foi possivel alterar o status da coluna.');
      return;
    }

    setFeedback(isActive ? 'Coluna reativada com sucesso.' : 'Coluna inativada com sucesso.');
    refreshBoard();
  }

  async function handleDelete(id: string) {
    setFeedback(null);
    const response = await fetch(`/api/etapas-licitacao/${id}`, {
      method: 'DELETE',
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      setFeedback((data as { message?: string }).message ?? 'Nao foi possivel excluir a coluna.');
      return;
    }

    setFeedback('Coluna excluida com sucesso.');
    refreshBoard();
  }

  function renderRow(etapa: EtapaConfig, index: number, total: number) {
    return (
      <div
        key={etapa.id}
        style={{
          display: 'grid',
          gap: 12,
          padding: 16,
          borderRadius: 18,
          border: '1px solid var(--line)',
          background: '#fffdf9',
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 700, fontSize: 14 }}>Nome da coluna</label>
          <input
            value={draftNames[etapa.id] ?? etapa.name}
            onChange={(event) => setDraft(etapa.id, event.target.value)}
            disabled={isPending}
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: '#fff',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={() => handleRename(etapa.id)} disabled={isPending} style={buttonStyle.primary}>
            Salvar nome
          </button>
          <button type="button" onClick={() => handleReorder(etapa.id, 'up')} disabled={isPending || index === 0} style={buttonStyle.secondary}>
            Subir
          </button>
          <button
            type="button"
            onClick={() => handleReorder(etapa.id, 'down')}
            disabled={isPending || index === total - 1}
            style={buttonStyle.secondary}
          >
            Descer
          </button>
          <button
            type="button"
            onClick={() => handleSetStatus(etapa.id, !etapa.isActive)}
            disabled={isPending}
            style={buttonStyle.secondary}
          >
            {etapa.isActive ? 'Inativar' : 'Reativar'}
          </button>
          <button type="button" onClick={() => handleDelete(etapa.id)} disabled={isPending} style={buttonStyle.danger}>
            Excluir
          </button>
        </div>

        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          Codigo: {etapa.code} · Ordem: {etapa.sortOrder} · {etapa.isActive ? 'Ativa' : 'Inativa'}
        </div>
      </div>
    );
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
      <Link href={closeHref} aria-label="Fechar gestao de colunas" style={{ position: 'absolute', inset: 0 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(1180px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          display: 'grid',
          gap: 16,
          background: 'rgba(255, 250, 242, 0.92)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: 20,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '0 8px' }}>
          <div>
            <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Gestao de colunas</div>
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>
              Crie, renomeie, reordene, inative ou exclua colunas do fluxo do Kanban.
            </div>
          </div>
          <Link href={closeHref} style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Fechar
          </Link>
        </div>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0 }}>Nova coluna</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Adicione uma etapa nova ao fluxo operacional da Lumera.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: Conferencia documental"
              disabled={isPending}
              style={{
                flex: '1 1 320px',
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: '#fff',
              }}
            />
            <button type="button" onClick={handleCreate} disabled={isPending} style={buttonStyle.primary}>
              Criar coluna
            </button>
          </div>
          {feedback ? <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{feedback}</div> : null}
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0 }}>Colunas ativas</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {activeEtapas.map((etapa, index) => renderRow(etapa, index, activeEtapas.length))}
          </div>
        </section>

        {inactiveEtapas.length ? (
          <section style={sectionStyle}>
            <h2 style={{ margin: 0 }}>Colunas inativas</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {inactiveEtapas.map((etapa, index) => renderRow(etapa, index, inactiveEtapas.length))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 20,
  borderRadius: 24,
  border: '1px solid var(--line)',
  background: '#fff',
};

const buttonStyle = {
  primary: {
    padding: '10px 16px',
    borderRadius: 999,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  } satisfies CSSProperties,
  secondary: {
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid var(--line)',
    background: '#fff',
    color: 'var(--accent)',
    fontWeight: 700,
    cursor: 'pointer',
  } satisfies CSSProperties,
  danger: {
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid #e7c5ba',
    background: '#fff5f1',
    color: '#a64a2b',
    fontWeight: 700,
    cursor: 'pointer',
  } satisfies CSSProperties,
};
