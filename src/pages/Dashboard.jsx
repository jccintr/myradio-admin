import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Building2, CheckCircle2, Copy, Heart, ListMusic, Lock, Radio, Tags, Users } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useCategories, useCities, useLists, useRadios, useUsage, useUsers } from '../lib/data.js';
import { useHealth } from '../lib/health.jsx';
import { dateOnly, isInsecureStream, plural, STATES } from '../lib/format.js';
import { PlayButton, RadioArt } from '../components/radio.jsx';
import { Alert, Button, Card, Spinner, cx } from '../components/ui.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function Stat({ icon: Icon, label, value, hint, to }) {
  const body = (
    <div className="group h-full rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,16,0.05)] transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-brand group-hover:text-brand-fg dark:bg-gray-800 dark:text-gray-300">
          <Icon size={16} strokeWidth={1.9} />
        </span>
      </div>
      <p className="num mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight">{value ?? '—'}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

/** Barras horizontais simples (sem biblioteca de gráficos). */
function Bars({ rows, to }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key}>
          <Link to={to(row)} className="group block">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate group-hover:underline">{row.label}</span>
              <span className="num shrink-0 font-semibold">{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HealthCard({ radios }) {
  const { results, running, checkMany, cancel } = useHealth();
  const summary = useMemo(() => {
    const count = { online: 0, offline: 0, timeout: 0, blocked: 0, untested: 0 };
    for (const radio of radios) {
      const status = results[radio.id]?.status;
      if (status && status in count) count[status] += 1;
      else count.untested += 1;
    }
    return count;
  }, [radios, results]);
  const tested = radios.length - summary.untested;
  const segments = [
    ['online', 'bg-brand', 'No ar'],
    ['timeout', 'bg-amber-400', 'Sem resposta'],
    ['offline', 'bg-red-500', 'Fora do ar'],
    ['blocked', 'bg-gray-400', 'Só no app (http)'],
  ];

  return (
    <Card
      title="Saúde dos streams"
      description="Testa a conexão de cada rádio, sem som, aqui no seu navegador."
      actions={
        running ? (
          <Button size="sm" variant="secondary" onClick={cancel}>Parar</Button>
        ) : (
          <Button size="sm" icon={Activity} onClick={() => checkMany(radios)}>{tested ? 'Verificar de novo' : 'Verificar todas'}</Button>
        )
      }
    >
      {running && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500"><span>Testando…</span><span className="num">{running.done} de {running.total}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(running.done / Math.max(1, running.total)) * 100}%` }} />
          </div>
        </div>
      )}
      {tested === 0 && !running ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhuma rádio testada ainda nesta sessão. A verificação leva cerca de {Math.max(1, Math.round((radios.length / 4) * 3 / 60))} min e mostra quais streams caíram.
        </p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {segments.map(([key, color]) => (summary[key] ? <div key={key} className={color} style={{ width: `${(summary[key] / radios.length) * 100}%` }} /> : null))}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {segments.map(([key, color, label]) => (
              <Link key={key} to={`/radios?saude=${key}`} className="rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <dt className="flex items-center gap-1.5 text-xs text-gray-500"><span className={cx('h-2 w-2 rounded-full', color)} />{label}</dt>
                <dd className="num mt-0.5 text-xl font-semibold">{summary[key]}</dd>
              </Link>
            ))}
          </dl>
          {summary.untested > 0 && <p className="mt-2 text-xs text-gray-500">{plural(summary.untested, 'rádio ainda não testada', 'rádios ainda não testadas')}.</p>}
        </>
      )}
    </Card>
  );
}

/** Pendências de cadastro encontradas cruzando os dados. */
function Checklist({ radios, cities, categories, usage }) {
  const issues = useMemo(() => {
    const out = [];
    const insecure = radios.filter((r) => isInsecureStream(r.streamUrl));
    if (insecure.length) out.push({ icon: Lock, tone: 'amber', text: `${plural(insecure.length, 'rádio transmite', 'rádios transmitem')} por http:// e não toca${insecure.length > 1 ? 'm' : ''} na versão web (só no app).`, to: '/radios?problema=http' });
    const seen = new Map();
    for (const r of radios) {
      const key = (r.streamUrl ?? '').trim().toLowerCase();
      seen.set(key, [...(seen.get(key) ?? []), r]);
    }
    const dupes = [...seen.values()].filter((group) => group.length > 1);
    if (dupes.length) out.push({ icon: Copy, tone: 'amber', text: `${plural(dupes.length, 'stream aparece', 'streams aparecem')} em mais de uma rádio (cadastro duplicado?).`, to: '/radios?problema=duplicado' });
    const emptyCities = cities.filter((c) => !usage.byCity.get(c.id));
    if (emptyCities.length) out.push({ icon: Building2, tone: 'gray', text: `${plural(emptyCities.length, 'cidade sem', 'cidades sem')} nenhuma rádio.`, to: '/cidades?vazias=1' });
    const emptyCats = categories.filter((c) => !usage.byCategory.get(c.id));
    if (emptyCats.length) out.push({ icon: Tags, tone: 'gray', text: `${plural(emptyCats.length, 'categoria sem', 'categorias sem')} nenhuma rádio.`, to: '/categorias?vazias=1' });
    return out;
  }, [radios, cities, categories, usage]);

  return (
    <Card title="Pendências de cadastro" description="O que vale revisar, encontrado cruzando os dados.">
      {issues.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={16} /> Tudo em ordem.</p>
      ) : (
        <ul className="-mx-2 space-y-1">
          {issues.map((issue) => (
            <li key={issue.text}>
              <Link to={issue.to} className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <issue.icon size={16} className={cx('mt-0.5 shrink-0', issue.tone === 'amber' ? 'text-amber-500' : 'text-gray-400')} />
                <span className="flex-1 text-sm">{issue.text}</span>
                <ArrowRight size={15} className="mt-0.5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const radiosQ = useRadios();
  const radios = radiosQ.data;
  const cities = useCities().data;
  const categories = useCategories().data;
  const users = useUsers().data;
  const lists = useLists().data;
  const usage = useUsage();

  const byState = useMemo(() => {
    const map = new Map();
    for (const r of radios ?? []) map.set(r.city?.state, (map.get(r.city?.state) ?? 0) + 1);
    return [...map].map(([uf, value]) => ({ key: uf, label: `${STATES[uf] ?? uf} (${uf})`, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [radios]);

  const byCategory = useMemo(
    () => (categories ?? []).map((c) => ({ key: c.id, label: c.name, value: usage.byCategory.get(c.id) ?? 0 })).filter((r) => r.value).sort((a, b) => b.value - a.value).slice(0, 8),
    [categories, usage],
  );

  const favorites = useMemo(
    () =>
      (radios ?? [])
        .map((r) => ({ radio: r, count: usage.inLists.get(r.id) ?? 0 }))
        .filter((x) => x.count)
        .sort((a, b) => b.count - a.count || a.radio.name.localeCompare(b.radio.name))
        .slice(0, 6),
    [radios, usage],
  );

  if (radiosQ.isLoading) return <Spinner />;
  if (radiosQ.error) return <Alert>{radiosQ.error.message}</Alert>;

  const statesCount = new Set(radios.map((r) => r.city?.state)).size;
  const hls = radios.filter((r) => r.hsl).length;
  const admins = users?.filter((u) => u.roles?.some((r) => r.authority === 'ROLE_ADMIN')).length;
  const saved = lists?.reduce((sum, l) => sum + (l.radios?.length ?? 0), 0);
  const recentLists = [...(lists ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{greeting()}, {user?.name?.split(' ')[0]}.</p>
        <h1 className="text-[26px] font-bold tracking-tight">O MyRadio hoje</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={Radio} label="Rádios" value={radios.length} hint={`${hls} em HLS`} to="/radios" />
        <Stat icon={Building2} label="Cidades" value={cities?.length} hint={`em ${plural(statesCount, 'estado', 'estados')}`} to="/cidades" />
        <Stat icon={Tags} label="Categorias" value={categories?.length} to="/categorias" />
        <Stat icon={Users} label="Usuários" value={users?.length} hint={admins != null ? plural(admins, 'administrador', 'administradores') : undefined} to="/usuarios" />
        <Stat icon={ListMusic} label="Listas dos ouvintes" value={lists?.length} hint={saved != null ? `${plural(saved, 'rádio salva', 'rádios salvas')}` : undefined} to="/listas" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <HealthCard radios={radios} />
        <Checklist radios={radios} cities={cities ?? []} categories={categories ?? []} usage={usage} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Favoritas dos ouvintes" description="Rádios que mais aparecem nas listas." actions={<Heart size={16} className="text-brand" />}>
          {favorites.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma rádio salva em listas ainda.</p>
          ) : (
            <ol className="space-y-3">
              {favorites.map(({ radio, count }, index) => (
                <li key={radio.id} className="flex items-center gap-3">
                  <span className="num w-4 text-right text-sm font-semibold text-gray-400">{index + 1}</span>
                  <RadioArt radio={radio} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{radio.name}</p>
                    <p className="text-xs text-gray-500">{plural(count, 'lista', 'listas')}</p>
                  </div>
                  <PlayButton radio={radio} size="sm" />
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Rádios por estado">
          <Bars rows={byState} to={(row) => `/radios?uf=${row.key}`} />
        </Card>
        <Card title="Rádios por categoria">
          <Bars rows={byCategory} to={(row) => `/radios?categoria=${row.key}`} />
        </Card>
      </div>

      <Card title="Listas criadas recentemente" flush actions={<Link to="/listas" className="text-sm font-medium text-brand-ink hover:underline">Ver todas</Link>}>
        {recentLists.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">Nenhuma lista ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLists.map((list) => (
              <li key={list.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex -space-x-2">
                  {list.radios.slice(0, 4).map((item) => <RadioArt key={item.id} radio={item.radio} size={30} className="ring-2 ring-white dark:ring-gray-900" />)}
                  {list.radios.length === 0 && <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"><ListMusic size={14} /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{list.name}</p>
                  <p className="truncate text-xs text-gray-500">de {list.owner?.name} · {plural(list.radios.length, 'rádio', 'rádios')}</p>
                </div>
                <span className="text-xs text-gray-500">{dateOnly(list.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

