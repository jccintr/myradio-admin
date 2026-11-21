import { useEffect, useMemo, useState } from 'react';
import { Activity, Check, ExternalLink, Info, Loader2, Lock, Radio as RadioIcon, Square } from 'lucide-react';
import { api, fieldError } from '../lib/api.js';
import { useCategories, useCities, useSave } from '../lib/data.js';
import { checkStream, HEALTH } from '../lib/health.jsx';
import { usePlayer } from '../lib/player.jsx';
import { cityLabel, isInsecureStream, STATES } from '../lib/format.js';
import { Equalizer, RadioArt } from './radio.jsx';
import { Alert, Badge, Button, Field, Input, Select, cx, useToast } from './ui.jsx';

const EMPTY = { name: '', shortName: '', streamUrl: '', imageUrl: '', hsl: false, cityId: 0, categories: [] };

/** Mesmas regras da API (NewRadioDTO / UpdateRadioDTO), conferidas antes de enviar. */
function validate(form) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Informe o nome (mínimo 3 caracteres).';
  if (form.shortName.trim().length < 3) errors.shortName = 'Informe o nome curto (mínimo 3 caracteres).';
  if (form.streamUrl.trim().length < 8) errors.streamUrl = 'Informe o endereço do stream.';
  else if (!/^https?:\/\//i.test(form.streamUrl.trim())) errors.streamUrl = 'O endereço deve começar com http:// ou https://';
  if (form.imageUrl.trim().length < 8) errors.imageUrl = 'Informe o endereço do logo.';
  if (!form.cityId) errors.cityId = 'Escolha a cidade.';
  if (!form.categories.length) errors.categories = 'Escolha pelo menos uma categoria.';
  return errors;
}

/** Sugestão de nome curto: tira "Rádio", "FM", frequência… ("Rádio Clube FM 102,5" → "Clube"). */
function suggestShort(name) {
  const short = name
    .replace(/\b(r[aá]dio|web ?r[aá]dio|fm|am|hd)\b/gi, '')
    .replace(/\d+([.,]\d+)?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return short.length >= 3 ? short : name.trim();
}

/** Como a rádio aparece para o ouvinte (cartão do app/web). */
function Preview({ form, city }) {
  return (
    <div className="rounded-2xl bg-gray-950 p-4 text-white">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Como o ouvinte vê</p>
      <div className="flex items-center gap-3">
        <RadioArt radio={{ imageUrl: form.imageUrl.trim() }} size={64} className="rounded-xl bg-gray-800 ring-white/10" />
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-lg font-bold">{form.name || 'Nome da rádio'}</p>
          <p className="truncate text-sm text-gray-400">{city ? cityLabel(city) : 'Cidade - UF'}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {form.categories.slice(0, 3).map((c) => (
              <span key={c.id} className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Painel lateral de cadastro/edição de rádio. */
export default function RadioEditor({ radio, onClose }) {
  const toast = useToast();
  const cities = useCities().data ?? [];
  const categories = useCategories().data ?? [];
  const player = usePlayer();
  const editing = Boolean(radio?.id);
  const [form, setForm] = useState(() =>
    radio?.id
      ? {
          name: radio.name,
          shortName: radio.shortName,
          streamUrl: radio.streamUrl,
          imageUrl: radio.imageUrl,
          hsl: Boolean(radio.hsl),
          cityId: radio.city?.id ?? 0,
          categories: radio.categories ?? [],
        }
      : EMPTY,
  );
  const [touched, setTouched] = useState(false);
  const [shortEdited, setShortEdited] = useState(editing);
  const [test, setTest] = useState(null); // resultado do teste de conexão
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const errors = validate(form);
  const city = cities.find((c) => c.id === Number(form.cityId));
  const citiesByState = useMemo(() => {
    const groups = new Map();
    for (const c of cities) groups.set(c.state, [...(groups.get(c.state) ?? []), c]);
    return [...groups].sort(([a], [b]) => (STATES[a] ?? a).localeCompare(STATES[b] ?? b));
  }, [cities]);

  const save = useSave(
    (body) => (editing ? api.put(`/radios/${radio.id}`, body) : api.post('/radios', body)),
    ['radios', 'lists'],
  );
  const serverError = (field) => fieldError(save.error, field);
  const show = (field) => (touched ? errors[field] : null) ?? serverError(field);

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    save.mutate(
      {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        streamUrl: form.streamUrl.trim(),
        imageUrl: form.imageUrl.trim(),
        hsl: form.hsl,
        cityId: Number(form.cityId),
        categories: form.categories.map(({ id, name }) => ({ id, name })),
      },
      {
        onSuccess: () => {
          toast(editing ? `“${form.name.trim()}” atualizada.` : `“${form.name.trim()}” cadastrada. Já aparece no app.`);
          onClose();
        },
      },
    );
  };

  const toggleCategory = (category) =>
    set({ categories: form.categories.some((c) => c.id === category.id) ? form.categories.filter((c) => c.id !== category.id) : [...form.categories, category] });

  const draft = { id: radio?.id ?? 'draft', name: form.name || 'Teste de stream', streamUrl: form.streamUrl.trim(), imageUrl: form.imageUrl.trim(), hsl: form.hsl, city };
  const listening = player.radio?.id === draft.id && (player.status === 'playing' || player.status === 'loading');

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    setTest(await checkStream(draft));
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-950/40 backdrop-blur-[1px]" onMouseDown={onClose}>
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        style={{ animation: 'rise .2s ease-out' }}
        noValidate
      >
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold">{editing ? 'Editar rádio' : 'Nova rádio'}</h2>
            <p className="text-xs text-gray-500">Campos obrigatórios. As mudanças valem para o app e a versão web.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Preview form={form} city={city} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" error={show('name')} className="sm:col-span-2">
              <Input
                value={form.name}
                autoFocus={!editing}
                invalid={Boolean(show('name'))}
                onChange={(e) => set({ name: e.target.value, ...(shortEdited ? {} : { shortName: suggestShort(e.target.value) }) })}
                placeholder="Ex.: Rádio Clube FM 102,5"
              />
            </Field>
            <Field label="Nome curto" hint="Usado onde o espaço é pequeno (notificação, tela de bloqueio)." error={show('shortName')}>
              <Input
                value={form.shortName}
                invalid={Boolean(show('shortName'))}
                onChange={(e) => {
                  setShortEdited(true);
                  set({ shortName: e.target.value });
                }}
              />
            </Field>
            <Field label="Cidade" error={show('cityId')}>
              <Select value={form.cityId} onChange={(e) => set({ cityId: Number(e.target.value) })} className={show('cityId') ? 'border-red-400' : ''}>
                <option value={0}>Escolha…</option>
                {citiesByState.map(([uf, list]) => (
                  <optgroup key={uf} label={STATES[uf] ?? uf}>
                    {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </Select>
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <Field label="Endereço do stream" error={show('streamUrl')}>
              <Input
                value={form.streamUrl}
                invalid={Boolean(show('streamUrl'))}
                onChange={(e) => {
                  setTest(null);
                  const url = e.target.value;
                  set({ streamUrl: url, ...(/\.m3u8(\?|$)/i.test(url.trim()) ? { hsl: true } : {}) });
                }}
                placeholder="https://…"
                className="font-mono text-[13px]"
                spellCheck={false}
              />
            </Field>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={form.hsl} onChange={(e) => set({ hsl: e.target.checked })} className="h-4 w-4 accent-[#1db954]" />
              Transmissão HLS (.m3u8)
              <span title="Marcado automaticamente quando o endereço termina em .m3u8."><Info size={14} className="text-gray-400" /></span>
            </label>
            {isInsecureStream(form.streamUrl) && (
              <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                <Lock size={14} className="mt-0.5 shrink-0" />
                Stream http:// toca no app Android, mas não na versão web (páginas https bloqueiam áudio http). Prefira o endereço https, se a rádio tiver.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={listening ? 'primary' : 'secondary'}
                icon={listening ? Square : RadioIcon}
                disabled={form.streamUrl.trim().length < 8}
                onClick={() => (listening ? player.stop() : player.play(draft))}
              >
                {listening ? 'Parar' : 'Ouvir'}
              </Button>
              <Button size="sm" variant="secondary" icon={Activity} loading={testing} disabled={form.streamUrl.trim().length < 8} onClick={runTest}>
                Testar conexão
              </Button>
              {listening && player.status === 'playing' && <span className="flex items-center gap-2 text-xs text-gray-500"><Equalizer /> tocando</span>}
              {testing && <span className="flex items-center gap-1.5 text-xs text-gray-500"><Loader2 size={13} className="animate-spin" /> conectando…</span>}
              {test && (
                <Badge tone={HEALTH[test.status].tone}>
                  {HEALTH[test.status].label}
                  {test.status === 'online' && test.ms ? ` · ${(test.ms / 1000).toFixed(1).replace('.', ',')} s` : ''}
                </Badge>
              )}
            </div>
            {player.radio?.id === draft.id && player.error && <p className="text-xs text-red-600 dark:text-red-400">{player.error}</p>}
          </div>

          <Field label="Endereço do logo" error={show('imageUrl')} hint="Imagem quadrada (PNG ou JPG). A prévia acima mostra como fica.">
            <div className="flex gap-2">
              <Input value={form.imageUrl} invalid={Boolean(show('imageUrl'))} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://…/logo.png" className="font-mono text-[13px]" spellCheck={false} />
              {form.imageUrl.trim().length > 8 && (
                <a href={form.imageUrl.trim()} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-gray-900 dark:border-gray-700" title="Abrir imagem">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </Field>

          <div>
            <p className="mb-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Categorias <span className="font-normal text-gray-400">({form.categories.length} escolhida{form.categories.length === 1 ? '' : 's'})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const on = form.categories.some((c) => c.id === category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCategory(category)}
                    className={cx(
                      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition',
                      on ? 'border-brand bg-brand text-brand-fg' : 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300',
                    )}
                  >
                    {on && <Check size={13} strokeWidth={3} />}
                    {category.name}
                  </button>
                );
              })}
            </div>
            {show('categories') && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{show('categories')}</p>}
          </div>

          {save.error && !save.error.fields?.length && <Alert>{save.error.message}</Alert>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="text-xs text-gray-500">{touched && Object.keys(errors).length ? `Faltam ${Object.keys(errors).length} campo(s).` : 'Esc fecha sem salvar.'}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={save.isPending}>{editing ? 'Salvar alterações' : 'Cadastrar rádio'}</Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
