'use client';

import { useState } from 'react';
import { UpdateEmpenhoForm } from './update-empenho-form';

type UpdateEmpenhoModalProps = {
  licitacaoId: string;
  empenho: {
    id: string;
    codigoEmpenho: string;
    valor: string;
    dataEmpenho?: string | null;
    dataPagamentoEmpenho?: string | null;
    dataGeracaoBoleto?: string | null;
    dataPagamentoBoleto?: string | null;
    observacoes?: string | null;
  };
};

export function UpdateEmpenhoModal({ licitacaoId, empenho }: UpdateEmpenhoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type='button' onClick={() => setIsOpen(true)} style={triggerStyle}>
        Editar empenho
      </button>
      {isOpen ? (
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
          <button
            type='button'
            aria-label='Fechar modal de edicao de empenho'
            onClick={() => setIsOpen(false)}
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(1120px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              display: 'grid',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: '0 8px',
              }}
            >
              <div style={{ color: 'var(--accent)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                Editar empenho
              </div>
              <button type='button' onClick={() => setIsOpen(false)} style={closeStyle}>
                Fechar
              </button>
            </div>
            <UpdateEmpenhoForm licitacaoId={licitacaoId} empenho={empenho} onSuccess={() => setIsOpen(false)} onCancel={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

const triggerStyle = {
  justifySelf: 'start',
  background: 'rgba(255,255,255,0.86)',
  color: 'var(--accent)',
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;

const closeStyle = {
  background: 'transparent',
  color: 'var(--accent)',
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
