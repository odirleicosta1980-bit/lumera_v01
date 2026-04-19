'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AssignableUser, ParticipatingCompany } from '../../lib/kanban-api';
import { UpdateUserForm } from './update-user-form';

export function UpdateUserModal({
  organizationId,
  user,
  companies,
}: {
  organizationId: string;
  user: AssignableUser;
  companies: ParticipatingCompany[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type='button' onClick={() => setOpen(true)} style={secondaryButtonStyle}>
        Editar perfil
      </button>

      {open ? (
        <div
          role='dialog'
          aria-modal='true'
          style={overlayStyle}
          onClick={() => setOpen(false)}
        >
          <div style={wrapperStyle} onClick={(event) => event.stopPropagation()}>
            <div style={topBarStyle}>
              <div>
                <div style={eyebrowStyle}>Editar usuario</div>
              </div>
              <button type='button' onClick={() => setOpen(false)} style={closeButtonStyle}>
                Fechar
              </button>
            </div>

            <div style={cardStyle}>
              <UpdateUserForm
                organizationId={organizationId}
                user={user}
                companies={companies}
                onSuccess={() => {
                  setOpen(false);
                  router.refresh();
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(49, 37, 23, 0.34)',
  backdropFilter: 'blur(3px)',
  zIndex: 70,
  overflowY: 'auto',
  padding: '32px 20px',
} as const;

const wrapperStyle = {
  width: 'min(980px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gap: 14,
} as const;

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'start',
  color: '#fffaf2',
} as const;

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: 2,
  fontSize: 12,
  color: '#f6d8be',
} as const;

const cardStyle = {
  background: 'rgba(255, 250, 242, 0.96)',
  border: '1px solid var(--line)',
  borderRadius: 28,
  padding: 14,
  boxShadow: 'var(--shadow)',
} as const;

const closeButtonStyle = {
  background: 'transparent',
  color: '#fffaf2',
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
} as const;

const secondaryButtonStyle = {
  background: '#fff',
  color: 'var(--accent)',
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
