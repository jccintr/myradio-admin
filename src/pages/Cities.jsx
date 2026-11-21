import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCities, useSave, useUsage } from '../lib/data.js';
import { matches, plural, STATES } from '../lib/format.js';
import NameForm from '../components/NameForm.jsx';
import { Alert, Button, Card, ConfirmDelete, Empty, Modal, PageHeader, SearchInput, Select, Spinner, cx, useToast } from '../components/ui.jsx';

export default function Cities() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: cities, isLoading, error } = useCities();
  const usage = useUsage();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(params.get('nova') === '1' ? {} : null);
  const [deleting, setDeleting] = useState(null);
  const uf = params.get('uf') ?? '';
  const onlyEmpty = params.get('vazias') === '1';

  const save = useSave((body) => (editing?.id ? api.put(`/cities/${editing.id}`, body) : api.post('/cities', body)), ['cities', 'radios']);
  const remove = useSave((city) => api.del(`/cities/${city.id}`), ['cities']);

  const groups = useMemo(() => {
    const map = new Map();
    for (const city of cities ?? []) {
      if (uf && city.state !== uf) continue;
      if (onlyEmpty && usage.byCity.get(city.id)) continue;
      if (!matches(q, city.name, city.state, STATES[city.state])) continue;
      map.set(city.state, [...(map.get(city.state) ?? []), city]);
    }
    return [...map].sort(([a], [b]) => (STATES[a] ?? a).localeCompare(STATES[b] ?? b));
  }, [cities, uf, onlyEmpty, q, usage]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  const states = [...new Set(cities.map((c) => c.state))].sort((a, b) => (STATES[a] ?? a).localeCompare(STATES[b] ?? b));
  const total = groups.reduce((n, [, list]) => n + list.length, 0);
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const close = () => {
    save.reset();
    setEditing(null);
    if (params.has('nova')) setParam('nova', '');
  };

  return (
    <div>
      <PageHeader
        title="Cidades"
        description={`${plural(cities.length, 'cidade', 'cidades')} em ${plural(states.length, 'estado', 'estados')}. O ouvinte encontra rádios da sua região por aqui.`}
        actions={<Button icon={Plus} onClick={() => setEditing({ state: uf })}>Nova cidade</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar cidade ou estado…" className="min-w-[14rem] flex-1 sm:max-w-sm" />
        <Select value={uf} onChange={(e) => setParam('uf', e.target.value)} className="w-auto min-w-[10rem]" aria-label="Estado">
          <option value="">Todos os estados</option>
          {states.map((s) => <option key={s} value={s}>{STATES[s] ?? s}</option>)}
        </Select>
        <label className="flex items-center gap-2 px-1 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={onlyEmpty} onChange={(e) => setParam('vazias', e.target.checked ? '1' : '')} className="h-4 w-4 accent-[#1db954]" />
          Só cidades sem rádio
        </label>
        <span className="num ml-auto text-xs text-gray-500">{plural(total, 'cidade', 'cidades')}</span>
      </div>

      {groups.length === 0 ? (
        <Card><Empty icon={Building2} title={onlyEmpty ? 'Todas as cidades têm rádios' : 'Nenhuma cidade encontrada'} /></Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([state, list]) => {
            const radiosInState = list.reduce((n, c) => n + (usage.byCity.get(c.id) ?? 0), 0);
            return (
              <Card key={state} flush>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-10 items-center justify-center rounded-md bg-gray-900 font-mono text-xs font-bold text-white dark:bg-gray-100 dark:text-gray-900">{state}</span>
                    <div>
                      <h2 className="font-sans text-[15px] font-semibold">{STATES[state] ?? state}</h2>
                      <p className="text-xs text-gray-500">{plural(list.length, 'cidade', 'cidades')} · {plural(radiosInState, 'rádio', 'rádios')}</p>
                    </div>
                  </div>
                  <Link to={`/radios?uf=${state}`} className="flex items-center gap-1 text-xs font-medium text-brand-ink hover:underline">Rádios do estado <ArrowRight size={13} /></Link>
                </div>
                <ul className="grid sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((city) => {
                    const count = usage.byCity.get(city.id) ?? 0;
                    return (
                      <li key={city.id} className="group flex items-center gap-3 border-b border-gray-100 px-5 py-2.5 dark:border-gray-800 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:[&:nth-last-child(-n+3)]:border-b-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{city.name}</p>
                          {count ? (
                            <Link to={`/radios?cidade=${city.id}`} className="text-xs text-gray-500 hover:text-brand-ink hover:underline">{plural(count, 'rádio', 'rádios')}</Link>
                          ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Nenhuma rádio</p>
                          )}
                        </div>
                        <div className={cx('flex transition', 'opacity-50 group-hover:opacity-100')}>
                          <Button variant="ghost" size="icon" aria-label={`Editar ${city.name}`} onClick={() => setEditing(city)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" aria-label={`Excluir ${city.name}`} onClick={() => setDeleting(city)}><Trash2 size={14} /></Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <NameForm
          title={editing.id ? 'Editar cidade' : 'Nova cidade'}
          item={editing}
          existing={cities}
          states={STATES}
          save={save}
          placeholder="Ex.: Brazópolis"
          onClose={close}
          onSaved={(_, name) => {
            toast(editing.id ? `Cidade “${name}” atualizada.` : `Cidade “${name}” cadastrada.`);
            close();
          }}
        />
      )}

      {deleting && ((usage.byCity.get(deleting.id) ?? 0) > 0 ? (
        <Modal title="Cidade em uso" size="sm" onClose={() => setDeleting(null)} footer={<Button variant="secondary" onClick={() => setDeleting(null)}>Entendi</Button>}>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">{deleting.name} - {deleting.state}</strong> tem {plural(usage.byCity.get(deleting.id), 'rádio', 'rádios')}. Mude a cidade dessas rádios (ou exclua-as) antes.
          </p>
          <Link to={`/radios?cidade=${deleting.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline">Ver as rádios <ArrowRight size={14} /></Link>
        </Modal>
      ) : (
        <ConfirmDelete
          title="Excluir cidade?"
          loading={remove.isPending}
          error={remove.error?.message}
          onCancel={() => (remove.reset(), setDeleting(null))}
          onConfirm={() => remove.mutate(deleting, { onSuccess: () => (toast(`Cidade “${deleting.name}” excluída.`), setDeleting(null)) })}
        >
          <p><strong className="text-gray-900 dark:text-gray-100">{deleting.name} - {deleting.state}</strong> não tem rádios e pode ser excluída.</p>
        </ConfirmDelete>
      ))}
    </div>
  );
}
