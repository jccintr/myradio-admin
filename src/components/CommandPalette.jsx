import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CornerDownLeft, LayoutDashboard, ListMusic, Plus, Radio, Search, Tags, Users } from 'lucide-react';
import { useCategories, useCities, useRadios } from '../lib/data.js';
import { usePlayer } from '../lib/player.jsx';
import { cityLabel, matches } from '../lib/format.js';
import { RadioArt } from './radio.jsx';
import { cx } from './ui.jsx';

const PAGES = [
  ['/', 'Painel', LayoutDashboard],
  ['/radios', 'Rádios', Radio],
  ['/categorias', 'Categorias', Tags],
  ['/cidades', 'Cidades', Building2],
  ['/listas', 'Listas dos ouvintes', ListMusic],
  ['/usuarios', 'Usuários', Users],
];

/**
 * Busca global (Ctrl+K ou /): pula para qualquer tela, abre uma rádio para editar,
 * ouve uma rádio (Shift+Enter) ou começa um cadastro novo.
 */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const radios = useRadios().data ?? [];
  const cities = useCities().data ?? [];
  const categories = useCategories().data ?? [];
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const list = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo(() => {
    const out = [];
    const go = (to) => () => navigate(to);
    for (const [to, label, Icon] of PAGES) if (matches(query, label)) out.push({ key: `p${to}`, group: 'Ir para', label, icon: Icon, run: go(to) });
    if (matches(query, 'nova rádio adicionar cadastrar')) out.push({ key: 'new-radio', group: 'Ações', label: 'Nova rádio', icon: Plus, run: go('/radios?nova=1') });
    if (matches(query, 'nova cidade adicionar')) out.push({ key: 'new-city', group: 'Ações', label: 'Nova cidade', icon: Plus, run: go('/cidades?nova=1') });
    if (matches(query, 'nova categoria adicionar')) out.push({ key: 'new-cat', group: 'Ações', label: 'Nova categoria', icon: Plus, run: go('/categorias?nova=1') });
    if (query.trim()) {
      radios
        .filter((r) => matches(query, r.name, r.shortName, r.city?.name, r.city?.state))
        .slice(0, 8)
        .forEach((r) =>
          out.push({
            key: `r${r.id}`,
            group: 'Rádios',
            label: r.name,
            hint: cityLabel(r.city),
            radio: r,
            run: go(`/radios?editar=${r.id}`),
            alt: () => play(r),
          }),
        );
      cities
        .filter((c) => matches(query, c.name, c.state))
        .slice(0, 4)
        .forEach((c) => out.push({ key: `c${c.id}`, group: 'Cidades', label: cityLabel(c), icon: Building2, run: go(`/radios?cidade=${c.id}`) }));
      categories
        .filter((c) => matches(query, c.name))
        .slice(0, 4)
        .forEach((c) => out.push({ key: `k${c.id}`, group: 'Categorias', label: c.name, icon: Tags, run: go(`/radios?categoria=${c.id}`) }));
    }
    return out;
  }, [query, radios, cities, categories, navigate, play]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const run = (item, alt) => {
    onClose();
    (alt && item.alt ? item.alt : item.run)();
  };

  const onKey = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter' && items[active]) {
      event.preventDefault();
      run(items[active], event.shiftKey);
    } else if (event.key === 'Escape') onClose();
  };

  let lastGroup = null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/50 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label="Busca rápida"
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-rise w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <Search size={18} className="text-gray-400" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar rádio, cidade, categoria ou ação…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 px-1.5 text-[11px] text-gray-400 dark:border-gray-700">Esc</kbd>
        </div>
        <ul ref={list} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-gray-500">Nada encontrado para “{query}”.</li>}
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{header}</p>}
                <button
                  type="button"
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={(e) => run(item, e.shiftKey)}
                  className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', index === active && 'bg-gray-100 dark:bg-gray-800')}
                >
                  {item.radio ? <RadioArt radio={item.radio} size={28} /> : <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800"><Icon size={15} /></span>}
                  <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-gray-500">{item.hint}</span>}
                  {index === active && <CornerDownLeft size={14} className="text-gray-400" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-gray-200 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-800">
          <span><kbd className="font-sans">↑↓</kbd> navegar</span>
          <span><kbd className="font-sans">Enter</kbd> abrir</span>
          <span><kbd className="font-sans">Shift+Enter</kbd> ouvir a rádio</span>
        </div>
      </div>
    </div>
  );
}
