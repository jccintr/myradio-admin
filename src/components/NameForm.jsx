import { useState } from 'react';
import { fieldError } from '../lib/api.js';
import { fold } from '../lib/format.js';
import { Alert, Button, Field, Input, Modal, Select } from './ui.jsx';

/**
 * Modal de cadastro/edição para categoria e cidade (nome + UF opcional).
 * Avisa antes de enviar se já existe um item com o mesmo nome (e mesma UF).
 */
export default function NameForm({ title, item, existing, states, onClose, save, onSaved, placeholder }) {
  const [name, setName] = useState(item?.name ?? '');
  const [state, setState] = useState(item?.state ?? '');
  const [touched, setTouched] = useState(false);

  const clean = name.trim().replace(/\s+/g, ' ');
  const duplicate = existing.find((other) => other.id !== item?.id && fold(other.name) === fold(clean) && (!states || other.state === state));
  const nameError = (touched && clean.length < 3 ? 'Informe o nome (mínimo 3 caracteres).' : null) ?? (duplicate ? 'Já existe um cadastro com esse nome.' : null) ?? fieldError(save.error, 'name');
  const stateError = (touched && states && !state ? 'Escolha o estado.' : null) ?? fieldError(save.error, 'state');

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (clean.length < 3 || duplicate || (states && !state)) return;
    save.mutate(states ? { name: clean, state } : { name: clean }, { onSuccess: (saved) => onSaved(saved, clean) });
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="name-form" loading={save.isPending}>{item?.id ? 'Salvar' : 'Cadastrar'}</Button>
        </>
      }
    >
      <form id="name-form" onSubmit={submit} className="space-y-4 pb-2" noValidate>
        <Field label="Nome" error={nameError}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus invalid={Boolean(nameError)} placeholder={placeholder} />
        </Field>
        {states && (
          <Field label="Estado" error={stateError}>
            <Select value={state} onChange={(e) => setState(e.target.value)} className={stateError ? 'border-red-400' : ''}>
              <option value="">Escolha…</option>
              {Object.entries(states)
                .sort(([, a], [, b]) => a.localeCompare(b))
                .map(([uf, label]) => <option key={uf} value={uf}>{label} ({uf})</option>)}
            </Select>
          </Field>
        )}
        {save.error && !save.error.fields?.length && <Alert>{save.error.message}</Alert>}
      </form>
    </Modal>
  );
}
