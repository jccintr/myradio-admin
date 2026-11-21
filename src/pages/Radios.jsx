import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, ArrowDownAZ, Heart, LayoutGrid, List, Lock, MoreHorizontal, Pencil, Plus, Radio as RadioIcon, SearchX, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCategories, useCities, useRadios, useSave, useUsage } from '../lib/data.js';
import { useHealth } from '../lib/health.jsx';
import { cityLabel, isInsecureStream, matches, plural, STATES } from '../lib/format.js';
import { HealthBadge, PlayButton, RadioArt } from '../components/radio.jsx';
import RadioEditor from '../components/RadioEditor.jsx';
import { Alert, Badge, Button, Card, Chip, ConfirmDelete, Empty, PageHeader, SearchInput, Segmented, Select, Spinner, cx, useToast } from '../components/ui.jsx';

const PAGE = 60;

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" aria-label="Mais ações" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal size={16} />
      </Button>
      {open && (
        <div className="animate-rise absolute right-0 top-9 z-20 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <button type="button" onClick={() => (setOpen(false), onEdit())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
            <Pencil size={14} /> Editar
          </button>
          <button type="button" onClick={() => (setOpen(false), onDelete())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function RadioCard({ radio, saves, onEdit, onDelete }) {
  return (
    <article
      onClick={onEdit}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <RadioArt radio={radio} size={64} className="rounded-xl" />
          <PlayButton radio={radio} size="sm" className="absolute -bottom-1.5 -right-1.5 ring-2 ring-white dark:ring-gray-900" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-[15px] font-semibold" title={radio.name}>{radio.name}</h3>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{cityLabel(radio.city)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <HealthBadge radioId={radio.id} />
            {radio.hsl && <Chip>HLS</Chip>}
            {isInsecureStream(radio.streamUrl) && <span title="Stream http://: só toca no app"><Lock size={13} className="text-amber-500" /></span>}
          </div>
        </div>
        <div className="-mr-2 -mt-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="flex min-w-0 flex-wrap gap-1">
          {radio.categories.slice(0, 3).map((c) => <Chip key={c.id}>{c.name}</Chip>)}
          {radio.categories.length > 3 && <Chip>+{radio.categories.length - 3}</Chip>}
        </div>
        {saves > 0 && (
          <span className="num flex shrink-0 items-center gap-1 text-xs text-gray-500" title={`Em ${plural(saves, 'lista', 'listas')} de ouvintes`}>
            <Heart size={12} className="fill-brand text-brand" />
            {saves}
          </span>
        )}
      </div>
    </article>
  );
}

export default function Radios() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data: radios, isLoading, error } = useRadios();
  const cities = useCities().data ?? [];
  const categories = useCategories().data ?? [];
  const usage = useUsage();
  const health = useHealth();
  const searchRef = useRef(null);
  const [limit, setLimit] = useState(PAGE);
  const [deleting, setDeleting] = useState(null);

  // Filtros ficam no endereço: dá para salvar/compartilhar uma busca e voltar com o botão do navegador.
  const q = params.get('q') ?? '';
  const uf = params.get('uf') ?? '';
  const cityId = params.get('cidade') ?? '';
  const categoryId = params.get('categoria') ?? '';
  const kind = params.get('tipo') ?? '';
  const healthFilter = params.get('saude') ?? '';
  const problem = params.get('problema') ?? '';
  const sort = params.get('ordem') ?? 'nome';
  const view = params.get('ver') ?? 'grade';
  const editId = params.get('editar');
  const creating = params.get('nova') === '1';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'uf') next.delete('cidade');
    setParams(next, { replace: key === 'q' });
  };

  useEffect(() => setLimit(PAGE), [q, uf, cityId, categoryId, kind, healthFilter, problem, sort]);

  // "/" foca a busca
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const duplicateIds = useMemo(() => {
    const groups = new Map();
    for (const r of radios ?? []) {
      const key = (r.streamUrl ?? '').trim().toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), r.id]);
    }
    return new Set([...groups.values()].filter((ids) => ids.length > 1).flat());
  }, [radios]);

  const filtered = useMemo(() => {
    const list = (radios ?? []).filter((r) => {
      if (!matches(q, r.name, r.shortName, r.city?.name, r.city?.state, ...r.categories.map((c) => c.name))) return false;
      if (uf && r.city?.state !== uf) return false;
      if (cityId && String(r.city?.id) !== cityId) return false;
      if (categoryId && !r.categories.some((c) => String(c.id) === categoryId)) return false;
      if (kind === 'hls' && !r.hsl) return false;
      if (kind === 'stream' && r.hsl) return false;
      if (healthFilter) {
        const status = health.results[r.id]?.status;
        if (healthFilter === 'nao-testada' ? status : status !== healthFilter) return false;
      }
      if (problem === 'http' && !isInsecureStream(r.streamUrl)) return false;
      if (problem === 'duplicado' && !duplicateIds.has(r.id)) return false;
      return true;
    });
    const collator = (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    if (sort === 'salvas') list.sort((a, b) => (usage.inLists.get(b.id) ?? 0) - (usage.inLists.get(a.id) ?? 0) || collator(a, b));
    else if (sort === 'cidade') list.sort((a, b) => cityLabel(a.city).localeCompare(cityLabel(b.city), 'pt-BR') || collator(a, b));
    else list.sort(collator);
    return list;
  }, [radios, q, uf, cityId, categoryId, kind, healthFilter, problem, sort, health.results, duplicateIds, usage]);

  const remove = useSave((radio) => api.del(`/radios/${radio.id}`), ['radios', 'lists']);

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  const states = [...new Set(radios.map((r) => r.city?.state))].filter(Boolean).sort();
  const citiesForState = cities.filter((c) => !uf || c.state === uf);
  const editing = editId ? radios.find((r) => String(r.id) === editId) : null;
  const activeFilters = [uf, cityId, categoryId, kind, healthFilter, problem].filter(Boolean).length;
  const clearAll = () => setParams(new URLSearchParams(view !== 'grade' ? { ver: view } : {}));
  const openEditor = (radio) => setParam('editar', String(radio.id));
  const closeEditor = () => {
    const next = new URLSearchParams(params);
    next.delete('editar');
    next.delete('nova');
    setParams(next);
  };

  return (
    <div>
      <PageHeader
        title="Rádios"
        description={`${plural(radios.length, 'rádio cadastrada', 'rádios cadastradas')}. Clique numa rádio para editar, ou no play para ouvir.`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={Activity}
              loading={Boolean(health.running)}
              onClick={() => health.checkMany(filtered)}
              title="Testa a conexão das rádios listadas abaixo"
            >
              {health.running ? `Testando ${health.running.done}/${health.running.total}` : `Verificar ${filtered.length === radios.length ? 'todas' : plural(filtered.length, 'rádio', 'rádios')}`}
            </Button>
            <Button icon={Plus} onClick={() => setParam('nova', '1')}>Nova rádio</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput ref={searchRef} value={q} onChange={(v) => setParam('q', v)} placeholder="Buscar por nome, cidade, categoria…" shortcut="/" className="min-w-0 flex-1 basis-64" />
          <Segmented
            label="Ordem"
            value={sort}
            onChange={(v) => setParam('ordem', v === 'nome' ? '' : v)}
            options={[
              ['nome', 'A–Z', ArrowDownAZ],
              ['salvas', 'Mais salvas', Heart],
              ['cidade', 'Cidade'],
            ]}
          />
          <Segmented
            label="Visualização"
            value={view}
            onChange={(v) => setParam('ver', v === 'grade' ? '' : v)}
            options={[
              ['grade', '', LayoutGrid],
              ['lista', '', List],
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={uf} onChange={(e) => setParam('uf', e.target.value)} className="w-auto min-w-[9rem]" aria-label="Estado">
            <option value="">Todos os estados</option>
            {states.map((s) => <option key={s} value={s}>{STATES[s] ?? s}</option>)}
          </Select>
          <Select value={cityId} onChange={(e) => setParam('cidade', e.target.value)} className="w-auto min-w-[10rem]" aria-label="Cidade">
            <option value="">Todas as cidades</option>
            {citiesForState.map((c) => <option key={c.id} value={c.id}>{uf ? c.name : cityLabel(c)}</option>)}
          </Select>
          <Select value={categoryId} onChange={(e) => setParam('categoria', e.target.value)} className="w-auto min-w-[10rem]" aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={kind} onChange={(e) => setParam('tipo', e.target.value)} className="w-auto" aria-label="Transmissão">
            <option value="">HLS e stream</option>
            <option value="hls">Só HLS</option>
            <option value="stream">Só stream comum</option>
          </Select>
          <Select value={healthFilter} onChange={(e) => setParam('saude', e.target.value)} className="w-auto" aria-label="Situação do stream">
            <option value="">Qualquer situação</option>
            <option value="online">No ar</option>
            <option value="offline">Fora do ar</option>
            <option value="timeout">Sem resposta</option>
            <option value="blocked">Só no app (http)</option>
            <option value="nao-testada">Não testada</option>
          </Select>
          {problem && (
            <Badge tone="amber">
              {problem === 'http' ? 'Streams http://' : 'Streams duplicados'}
            </Badge>
          )}
          {(activeFilters > 0 || q) && (
            <Button variant="ghost" size="sm" onClick={clearAll}>Limpar filtros</Button>
          )}
          <span className="num ml-auto text-xs text-gray-500">{filtered.length === radios.length ? plural(radios.length, 'rádio', 'rádios') : `${filtered.length} de ${radios.length}`}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <Empty icon={q || activeFilters ? SearchX : RadioIcon} title={q || activeFilters ? 'Nenhuma rádio com esses filtros' : 'Nenhuma rádio cadastrada'} action={q || activeFilters ? <Button variant="secondary" onClick={clearAll}>Limpar filtros</Button> : <Button icon={Plus} onClick={() => setParam('nova', '1')}>Cadastrar a primeira</Button>}>
            {q ? `Nada encontrado para “${q}”.` : null}
          </Empty>
        </Card>
      ) : view === 'grade' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.slice(0, limit).map((radio) => (
            <RadioCard key={radio.id} radio={radio} saves={usage.inLists.get(radio.id) ?? 0} onEdit={() => openEditor(radio)} onDelete={() => setDeleting(radio)} />
          ))}
        </div>
      ) : (
        <Card flush>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-950/40">
                <tr>
                  <th className="w-12 px-4 py-2.5" />
                  <th className="px-2 py-2.5 font-medium">Rádio</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Cidade</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Categorias</th>
                  <th className="px-4 py-2.5 font-medium">Situação</th>
                  <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Em listas</th>
                  <th className="w-24 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.slice(0, limit).map((radio) => (
                  <tr key={radio.id} onClick={() => openEditor(radio)} className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-2.5"><RadioArt radio={radio} size={36} /></td>
                    <td className="max-w-[16rem] px-2 py-2.5">
                      <p className="truncate font-medium">{radio.name}</p>
                      <p className="truncate font-mono text-[11px] text-gray-400">{radio.streamUrl}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-2.5 md:table-cell">{cityLabel(radio.city)}</td>
                    <td className="hidden px-4 py-2.5 lg:table-cell">
                      <div className="flex flex-wrap gap-1">{radio.categories.map((c) => <Chip key={c.id}>{c.name}</Chip>)}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <HealthBadge radioId={radio.id} />
                        {radio.hsl && <Chip>HLS</Chip>}
                        {isInsecureStream(radio.streamUrl) && <Lock size={13} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="num hidden px-4 py-2.5 text-right sm:table-cell">{usage.inLists.get(radio.id) ?? 0}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <PlayButton radio={radio} size="sm" />
                        <RowMenu onEdit={() => openEditor(radio)} onDelete={() => setDeleting(radio)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length > limit && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>Mostrar mais ({filtered.length - limit})</Button>
        </div>
      )}

      {(creating || editing) && <RadioEditor key={editing?.id ?? 'new'} radio={editing} onClose={closeEditor} />}

      {deleting && (
        <ConfirmDelete
          title="Excluir rádio?"
          loading={remove.isPending}
          error={remove.error?.message}
          typeToConfirm={(usage.inLists.get(deleting.id) ?? 0) > 0 ? deleting.shortName || deleting.name : undefined}
          onCancel={() => {
            remove.reset();
            setDeleting(null);
          }}
          onConfirm={() =>
            remove.mutate(deleting, {
              onSuccess: () => {
                toast(`“${deleting.name}” excluída.`);
                setDeleting(null);
              },
            })
          }
        >
          <p>
            <strong className="text-gray-900 dark:text-gray-100">{deleting.name}</strong> sai do app e da versão web. Não dá para desfazer.
          </p>
          {(usage.inLists.get(deleting.id) ?? 0) > 0 && (
            <p className="mt-2 text-amber-700 dark:text-amber-300">
              Ela está salva em {plural(usage.inLists.get(deleting.id), 'lista', 'listas')} de ouvintes e vai sumir delas.
            </p>
          )}
        </ConfirmDelete>
      )}
    </div>
  );
}
