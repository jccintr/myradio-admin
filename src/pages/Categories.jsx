import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCategories, useRadios, useSave, useUsage } from '../lib/data.js';
import { matches, plural } from '../lib/format.js';
import { RadioArt } from '../components/radio.jsx';
import NameForm from '../components/NameForm.jsx';
import { Alert, Button, Card, ConfirmDelete, Empty, Modal, PageHeader, SearchInput, Segmented, Spinner, useToast } from '../components/ui.jsx';

export default function Categories() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: categories, isLoading, error } = useCategories();
  const radios = useRadios().data ?? [];
  const usage = useUsage();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(params.get('nova') === '1' ? {} : null);
  const [deleting, setDeleting] = useState(null);
  const show = params.get('vazias') === '1' ? 'vazias' : params.get('ordem') ?? 'nome';

  const save = useSave((body) => (editing?.id ? api.put(`/categories/${editing.id}`, body) : api.post('/categories', body)), ['categories', 'radios']);
  const remove = useSave((category) => api.del(`/categories/${category.id}`), ['categories']);

  const logosByCategory = useMemo(() => {
    const map = new Map();
    for (const radio of radios) for (const c of radio.categories) map.set(c.id, [...(map.get(c.id) ?? []), radio]);
    return map;
  }, [radios]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  let list = categories.filter((c) => matches(q, c.name));
  if (show === 'vazias') list = list.filter((c) => !usage.byCategory.get(c.id));
  if (show === 'radios') list = [...list].sort((a, b) => (usage.byCategory.get(b.id) ?? 0) - (usage.byCategory.get(a.id) ?? 0));

  const close = () => {
    save.reset();
    setEditing(null);
    if (params.has('nova')) setParams({}, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Gêneros e estilos que o ouvinte usa para filtrar rádios no app."
        actions={<Button icon={Plus} onClick={() => setEditing({})}>Nova categoria</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar categoria…" className="min-w-[14rem] flex-1 sm:max-w-sm" />
        <Segmented
          label="Exibir"
          value={show}
          onChange={(v) => setParams(v === 'vazias' ? { vazias: '1' } : v === 'radios' ? { ordem: 'radios' } : {}, { replace: true })}
          options={[
            ['nome', 'A–Z'],
            ['radios', 'Mais rádios'],
            ['vazias', 'Sem rádios'],
          ]}
        />
        <span className="num ml-auto text-xs text-gray-500">{plural(list.length, 'categoria', 'categorias')}</span>
      </div>

      {list.length === 0 ? (
        <Card><Empty icon={Tags} title={show === 'vazias' ? 'Todas as categorias têm rádios' : 'Nenhuma categoria encontrada'} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((category) => {
            const count = usage.byCategory.get(category.id) ?? 0;
            const sample = logosByCategory.get(category.id) ?? [];
            return (
              <div key={category.id} className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-sans text-[15px] font-semibold">{category.name}</h3>
                    <p className="text-xs text-gray-500">{count ? plural(count, 'rádio', 'rádios') : 'Nenhuma rádio'}</p>
                  </div>
                  <div className="flex opacity-60 transition group-hover:opacity-100">
                    <Button variant="ghost" size="icon" aria-label={`Editar ${category.name}`} onClick={() => setEditing(category)}><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${category.name}`} onClick={() => setDeleting(category)}><Trash2 size={15} /></Button>
                  </div>
                </div>
                <Link to={`/radios?categoria=${category.id}`} className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                  <div className="flex -space-x-2">
                    {sample.slice(0, 6).map((radio) => <RadioArt key={radio.id} radio={radio} size={26} className="ring-2 ring-gray-50 dark:ring-gray-900" />)}
                    {!sample.length && <span className="text-xs text-gray-400">Sem rádios para mostrar</span>}
                  </div>
                  {count > 0 && <span className="flex items-center gap-1 text-xs font-medium text-brand-ink">Ver <ArrowRight size={13} /></span>}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <NameForm
          title={editing.id ? 'Editar categoria' : 'Nova categoria'}
          item={editing}
          existing={categories}
          save={save}
          placeholder="Ex.: Sertanejo"
          onClose={close}
          onSaved={(_, name) => {
            toast(editing.id ? `Categoria “${name}” atualizada.` : `Categoria “${name}” criada.`);
            close();
          }}
        />
      )}

      {deleting && (() => {
        const count = usage.byCategory.get(deleting.id) ?? 0;
        return count > 0 ? (
          <Modal title="Categoria em uso" size="sm" onClose={() => setDeleting(null)} footer={<Button variant="secondary" onClick={() => setDeleting(null)}>Entendi</Button>}>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">{deleting.name}</strong> está em {plural(count, 'rádio', 'rádios')}. Tire a categoria dessas rádios antes de excluir.
            </p>
            <Link to={`/radios?categoria=${deleting.id}`} className="mt-2 inline-flex items-center gap-1 font-medium text-brand-ink hover:underline">Ver as rádios <ArrowRight size={14} /></Link>
          </Modal>
        ) : (
          <ConfirmDelete
            title="Excluir categoria?"
            loading={remove.isPending}
            error={remove.error?.message}
            onCancel={() => (remove.reset(), setDeleting(null))}
            onConfirm={() => remove.mutate(deleting, { onSuccess: () => (toast(`Categoria “${deleting.name}” excluída.`), setDeleting(null)) })}
          >
            <p><strong className="text-gray-900 dark:text-gray-100">{deleting.name}</strong> não tem rádios e pode ser excluída.</p>
          </ConfirmDelete>
        );
      })()}
    </div>
  );
}
