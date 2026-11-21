import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Building2, LayoutDashboard, ListMusic, LogOut, Menu, Monitor, Moon, Radio, Search, Sun, Tags, Users, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useCategories, useCities, useLists, useRadios, useUsers } from '../lib/data.js';
import { dateTime } from '../lib/format.js';
import Logo from './Logo.jsx';
import MiniPlayer from './MiniPlayer.jsx';
import CommandPalette from './CommandPalette.jsx';
import { cx } from './ui.jsx';

function useCounts() {
  return {
    radios: useRadios().data?.length,
    categories: useCategories().data?.length,
    cities: useCities().data?.length,
    lists: useLists().data?.length,
    users: useUsers().data?.length,
  };
}

const NAV = [
  ['/', 'Painel', LayoutDashboard],
  ['/radios', 'Rádios', Radio, 'radios'],
  ['/categorias', 'Categorias', Tags, 'categories'],
  ['/cidades', 'Cidades', Building2, 'cities'],
  ['/listas', 'Listas', ListMusic, 'lists'],
  ['/usuarios', 'Usuários', Users, 'users'],
];

function ThemeMenu() {
  const { mode, setMode } = useTheme();
  return (
    <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-800" role="radiogroup" aria-label="Tema">
      {[
        ['light', Sun, 'Claro'],
        ['dark', Moon, 'Escuro'],
        ['system', Monitor, 'Sistema'],
      ].map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => setMode(value)}
          className={cx(
            'flex h-7 w-7 items-center justify-center rounded-md transition',
            mode === value ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100',
          )}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
        {(user?.name ?? '?').slice(0, 1).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="animate-rise absolute right-0 top-11 z-50 w-64 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            <p className="mt-1.5 text-[11px] text-gray-400">Sessão válida até {dateTime(user?.expiresAt)}</p>
          </div>
          <button type="button" role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const counts = useCounts();
  return (
    <>
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="Principal">
        {NAV.map(([to, label, Icon, countKey]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'relative flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-2.5 h-5 w-[3px] rounded-r bg-brand" aria-hidden />}
                <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-brand' : ''} />
                {label}
                {countKey && counts[countKey] != null && <span className="num ml-auto text-xs text-gray-500">{counts[countKey]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 py-4 text-[11px] leading-relaxed text-gray-500">
        Alterações aqui aparecem no app Android e na versão web do MyRadio.
      </p>
    </>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMobileOpen(false), [pathname]);

  // Ctrl+K / Cmd+K abre a busca rápida.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="dark sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-900 text-gray-100 lg:flex">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="dark absolute inset-y-0 left-0 flex w-64 flex-col bg-gray-900 text-gray-100 shadow-xl">
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="absolute right-2 top-4 rounded-lg p-2 text-gray-300 hover:bg-white/5">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/85 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/85 md:px-8">
          <button type="button" className="-ml-1 rounded-lg p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 min-w-0 flex-1 max-w-sm items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
          >
            <Search size={16} />
            <span className="flex-1 truncate text-left">Buscar rádio, cidade, categoria…</span>
            <kbd className="hidden rounded border border-gray-200 px-1.5 text-[11px] sm:inline dark:border-gray-700">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeMenu />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 p-4 pb-28 md:p-8 md:pb-28">
          <Outlet />
        </main>
      </div>

      <MiniPlayer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
