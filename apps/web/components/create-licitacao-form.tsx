'use client';

import Link from 'next/link';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AssignableUser, ParticipatingCompany } from '../lib/kanban-api';

type CreateLicitacaoFormProps = {
  organizationId: string;
  defaultClientCompanyId: string | null;
  companies: ParticipatingCompany[];
  etapas: Array<{
    id: string;
    name: string;
  }>;
  users: AssignableUser[];
  defaultResponsavelIds: string[];
  redirectToOnSuccess?: string;
  cancelHref?: string;
};

export function CreateLicitacaoForm({
  organizationId,
  defaultClientCompanyId,
  companies,
  etapas,
  users,
  defaultResponsavelIds,
  redirectToOnSuccess,
  cancelHref,
}: CreateLicitacaoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawDataSessao = String(formData.get('dataSessao') ?? '');
    const selectedClientCompanyId = String(formData.get('clientCompanyId') ?? '').trim();
    const responsavelIds = formData.getAll('responsavelIds').map((value) => String(value)).filter(Boolean);

    if (!selectedClientCompanyId) {
      setError('Selecione a empresa participante da licitacao.');
      return;
    }

    if (!responsavelIds.length) {
      setError('Selecione pelo menos um responsavel para a licitacao.');
      return;
    }

    const payload = {
      organizationId,
      clientCompanyId: selectedClientCompanyId,
      etapaId: String(formData.get('etapaId') ?? ''),
      titulo: String(formData.get('titulo') ?? ''),
      descricao: String(formData.get('descricao') ?? ''),
      numeroProcesso: String(formData.get('numeroProcesso') ?? ''),
      dataSessao: rawDataSessao ? new Date(rawDataSessao).toISOString() : undefined,
      responsavelIds,
    };

    const response = await fetch('/api/licitacoes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel criar a licitacao.' }));
      setError(data.message ?? 'Nao foi possivel criar a licitacao.');
      return;
    }

    form.reset();
    startTransition(() => {
      if (redirectToOnSuccess) {
        router.push(redirectToOnSuccess);
        return;
      }

      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 14,
        background: 'rgba(255, 250, 242, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Nova licitacao</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Cadastro inicial pela interface para acelerar o uso operacional do quadro.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div>
          <label htmlFor="titulo" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Titulo
          </label>
          <input id="titulo" name="titulo" required style={inputStyle} />
        </div>

        <div>
          <label htmlFor="numeroProcesso" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Numero do processo
          </label>
          <input id="numeroProcesso" name="numeroProcesso" required style={inputStyle} />
        </div>

        <div>
          <label htmlFor="clientCompanyId" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Empresa participante
          </label>
          <select id="clientCompanyId" name="clientCompanyId" defaultValue={defaultClientCompanyId ?? companies[0]?.id ?? ''} required style={inputStyle}>
            <option value="" disabled>
              Selecione a empresa participante
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.tradeName ?? company.legalName}
                {company.segmento ? ` - ${company.segmento}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="etapaId" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Etapa inicial
          </label>
          <select id="etapaId" name="etapaId" defaultValue={etapas[0]?.id ?? ''} required style={inputStyle}>
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dataSessao" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Data da sessao
          </label>
          <input id="dataSessao" name="dataSessao" type="datetime-local" style={inputStyle} />
        </div>
      </div>

      <div>
        <label htmlFor="responsavelIds" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          Responsaveis pela licitacao
        </label>
        <select id="responsavelIds" name="responsavelIds" multiple defaultValue={defaultResponsavelIds} style={{ ...inputStyle, minHeight: 120 }}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Use Ctrl para selecionar mais de um responsavel. O primeiro selecionado sera considerado o principal.
        </div>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 14 }}>
        A empresa participante identifica qual cliente da Lumera esta concorrendo nesta licitacao.
      </div>

      <div>
        <label htmlFor="descricao" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          Descricao
        </label>
        <textarea id="descricao" name="descricao" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            background: 'var(--accent)',
            color: '#fffaf2',
            border: 'none',
            borderRadius: 999,
            padding: '12px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isPending ? 'Criando...' : 'Criar licitacao'}
        </button>

        {cancelHref ? (
          <Link
            href={cancelHref}
            style={{
              color: 'var(--accent)',
              fontWeight: 700,
              padding: '12px 4px',
            }}
          >
            Cancelar
          </Link>
        ) : null}
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;