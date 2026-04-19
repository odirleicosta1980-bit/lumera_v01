'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function DeleteItemButton({ licitacaoId, itemId, itemDescricao }: { licitacaoId: string; itemId: string; itemDescricao: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = window.confirm(`Deseja remover o item "${itemDescricao}"?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/licitacoes/${licitacaoId}/itens/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel remover o item.');
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type='button'
      onClick={() => {
        void handleDelete();
      }}
      disabled={isPending}
      style={{
        borderRadius: 999,
        border: '1px solid #d8b2aa',
        padding: '8px 14px',
        background: '#fff3f0',
        color: '#8a1c1c',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {isPending ? 'Excluindo...' : 'Excluir'}
    </button>
  );
}