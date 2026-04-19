'use client';

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TaskTemplate } from '../../lib/kanban-api';

type CreateTaskFormProps = {
  licitacaoId: string;
  templates: TaskTemplate[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CreateTaskForm({ licitacaoId, templates, onSuccess, onCancel }: CreateTaskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  function handleTemplateChange(event: ChangeEvent<HTMLSelectElement>) {
    const templateId = event.target.value;
    setSelectedTemplateId(templateId);

    if (!templateId) {
      setTitle('');
      setDescription('');
      setDueDate('');
      return;
    }

    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setTitle(template.title);
    setDescription(template.description ?? '');
    setDueDate('');
    setSaveAsTemplate(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!dueDate) {
      setError('Informe a data da tarefa antes de salvar.');
      return;
    }

    const response = await fetch(`/api/licitacoes/${licitacaoId}/tarefas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: selectedTemplateId || undefined,
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        saveAsTemplate: selectedTemplateId ? false : saveAsTemplate,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Nao foi possivel criar a tarefa.' }));
      setError(data.message ?? 'Nao foi possivel criar a tarefa.');
      return;
    }

    setSelectedTemplateId('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setSaveAsTemplate(false);
    startTransition(() => {
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 16,
        background: 'rgba(255, 250, 242, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        padding: 20,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Nova tarefa</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Registre uma tarefa manualmente ou use um modelo pronto para acompanhar a operacao desta licitacao.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={labelStyle}>Modelo de tarefa</label>
        <select value={selectedTemplateId} onChange={handleTemplateChange} style={inputStyle}>
          <option value=''>Tarefa manual</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
        <div style={hintStyle}>
          Escolha um modelo pronto ou preencha manualmente e salve como modelo para reutilizar depois.
        </div>
      </div>

      <label style={fieldStyle}>
        <span>Titulo</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} name='title' placeholder='Nova tarefa' required style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span>Descricao</span>
        <input value={description} onChange={(event) => setDescription(event.target.value)} name='description' placeholder='Descricao da tarefa' style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span>Data da tarefa</span>
        <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} name='dueDate' type='datetime-local' required style={inputStyle} />
      </label>

      {selectedTemplate ? (
        <div style={hintStyle}>
          Modelo selecionado: <strong>{selectedTemplate.title}</strong>
          {selectedTemplate.defaultDueDays !== null && selectedTemplate.defaultDueDays !== undefined
            ? ` | prazo sugerido: ${selectedTemplate.defaultDueDays} dia(s)`
            : ''}
          {' | '}a data precisa ser informada manualmente.
        </div>
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14 }}>
          <input checked={saveAsTemplate} onChange={(event) => setSaveAsTemplate(event.target.checked)} type='checkbox' />
          Salvar esta tarefa como modelo para proximas licitacoes
        </label>
      )}

      {error ? <div style={{ color: '#a4301d', fontSize: 14 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type='submit' disabled={isPending} style={buttonStyle}>
          {isPending ? 'Salvando...' : 'Adicionar tarefa'}
        </button>
        {onCancel ? (
          <button type='button' onClick={onCancel} style={cancelButtonStyle}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

const fieldStyle = { display: 'grid', gap: 6 } as const;
const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: '#fff',
} as const;
const labelStyle = {
  color: 'var(--muted)',
  fontSize: 14,
  fontWeight: 700,
} as const;
const hintStyle = {
  color: 'var(--muted)',
  fontSize: 13,
} as const;
const buttonStyle = {
  justifySelf: 'start',
  background: 'var(--accent)',
  color: '#fffaf2',
  border: 'none',
  borderRadius: 999,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;
const cancelButtonStyle = {
  background: 'transparent',
  color: 'var(--accent)',
  border: 'none',
  padding: '10px 4px',
  fontWeight: 700,
  cursor: 'pointer',
} as const;