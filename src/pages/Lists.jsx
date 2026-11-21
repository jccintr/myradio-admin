import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ListMusic, Mail, Play, User } from 'lucide-react';
import { useLists } from '../lib/data.js';
import { usePlayer } from '../lib/player.jsx';
import { cityLabel, dateOnly, dateTime, matches, plural } from '../lib/format.js';
import { HealthBadge, PlayButton, RadioArt } from '../components/radio.jsx';
import { Alert, Button, Card, Empty, PageHeader, SearchInput, Segmented, Spinner, cx } from '../components/ui.jsx';

/** Capa da lista: mosaico com os logos das quatro primeiras rádios. */
function Cover({ list, size = 44 }) {
  const items = list.radios.slice(0, 4);
  if (items.length < 4) {
    return items[0] ? (
      <RadioArt radio={items[0].radio} size={size} />
    ) : (
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800" style={{ width: size, height: size }}>
        <ListMusic size={size / 2.4} />
      </span>
    );
  }
  return (
    <span className="grid shrink-0 grid-cols-2 overflow-hidden rounded-lg" style={{ width: size, height: size }}>
      {items.map((item) => <RadioArt key={item.id} radio={item.radio} size={size / 2} className="rounded-none ring-0" />)}
    </span>
  );
}

export default function Lists() {
  const { data: lists, isLoading, error } = useLists();
  const player = usePlayer();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recentes');
  const ownerId = params.get('dono');

  const filtered = useMemo(() => {
    const out = (lists ?? []).filter((l) => (!ownerId || String(l.owner?.id) === ownerId) && matches(q, l.name, l.owner?.name, l.owner?.email, ...l.radios.map((i) => i.radio?.name)));
    if (sort === 'recentes') out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'maiores') out.sort((a, b) => b.radios.length - a.radios.length);
    else out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return out;
  }, [lists, q, sort, ownerId]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  const selectedId = params.get('lista');
  const selected = filtered.find((l) => String(l.id) === selectedId) ?? filtered[0];
  const select = (list) => {
    const next = new URLSearchParams(params);
    next.set('lista', String(list.id));
    setParams(next, { replace: true });
  };
  const owner = ownerId ? lists.find((l) => String(l.owner?.id) === ownerId)?.owner : null;

  return (
    <div>
      <PageHeader
        title="Listas dos ouvintes"
        description="As listas de rádios que os ouvintes montam no app. Somente leitura: quem edita é o dono."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar lista, dono ou rádio…" className="min-w-[14rem] flex-1 sm:max-w-sm" />
        <Segmented label="Ordem" value={sort} onChange={setSort} options={[['recentes', 'Recentes'], ['maiores', 'Maiores'], ['nome', 'A–Z']]} />
        {owner && (
          <Button variant="secondary" size="sm" onClick={() => setParams({}, { replace: true })}>
            De {owner.name} ✕
          </Button>
        )}
        <span className="num ml-auto text-xs text-gray-500">{plural(filtered.length, 'lista', 'listas')}</span>
      </div>

      {filtered.length === 0 ? (
        <Card><Empty icon={ListMusic} title="Nenhuma lista encontrada">{q ? `Nada para “${q}”.` : 'Os ouvintes ainda não criaram listas.'}</Empty></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <Card flush className="lg:sticky lg:top-20 lg:self-start">
            <ul className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
              {filtered.map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => select(list)}
                    className={cx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                      selected?.id === list.id ? 'bg-brand/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    )}
                  >
                    <Cover list={list} />
                    <div className="min-w-0 flex-1">
                      <p className={cx('truncate text-sm font-medium', selected?.id === list.id && 'text-brand-ink')}>{list.name}</p>
                      <p className="truncate text-xs text-gray-500">{list.owner?.name} · {plural(list.radios.length, 'rádio', 'rádios')}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {selected && (
            <Card flush key={selected.id} className="animate-rise">
              <div className="flex flex-wrap items-end gap-5 border-b border-gray-100 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-t-xl">
                <Cover list={selected} size={104} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Lista</p>
                  <h2 className="truncate text-2xl font-bold">{selected.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                    <span className="flex items-center gap-1.5"><User size={14} />{selected.owner?.name}</span>
                    {selected.owner?.email && <span className="flex items-center gap-1.5"><Mail size={14} />{selected.owner.email}</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {plural(selected.radios.length, 'rádio', 'rádios')} · criada em {dateOnly(selected.createdAt)}
                    {selected.updatedAt && selected.updatedAt !== selected.createdAt ? ` · alterada em ${dateTime(selected.updatedAt)}` : ''}
                  </p>
                </div>
                {selected.radios.length > 0 && (
                  <Button icon={Play} onClick={() => player.play(selected.radios[0].radio)}>Ouvir a primeira</Button>
                )}
              </div>
              {selected.radios.length === 0 ? (
                <Empty icon={ListMusic} title="Lista vazia">O ouvinte ainda não adicionou rádios.</Empty>
              ) : (
                <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selected.radios.map((item, index) => (
                    <li key={item.id} className="group flex items-center gap-4 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <span className="num w-5 text-right text-sm text-gray-400">{index + 1}</span>
                      <RadioArt radio={item.radio} size={40} />
                      <div className="min-w-0 flex-1">
                        <Link to={`/radios?editar=${item.radio.id}`} className="block truncate text-sm font-medium hover:underline">{item.radio.name}</Link>
                        <p className="truncate text-xs text-gray-500">{cityLabel(item.radio.city)}</p>
                      </div>
                      <HealthBadge radioId={item.radio.id} />
                      <PlayButton radio={item.radio} size="sm" />
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
