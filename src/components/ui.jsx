import { createContext, forwardRef, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, Search, X, XCircle } from 'lucide-react';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, flush }) {
  return (
    <section className={cx('rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,16,0.05)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

const variants = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
  secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800',
  ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  'danger-ghost': 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
};

export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      {...props}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'icon' ? 'h-8 w-8' : 'h-9 px-4 text-sm',
        variants[variant],
        className,
      )}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={size === 'md' ? 16 : 15} strokeWidth={2} /> : null}
      {children}
    </button>
  );
});

const tones = {
  gray: ['bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', 'bg-gray-400'],
  green: ['bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300', 'bg-emerald-500'],
  amber: ['bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300', 'bg-amber-500'],
  red: ['bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', 'bg-red-500'],
  blue: ['bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', 'bg-blue-500'],
};

/** Estado = ponto colorido + texto (a cor nunca é o único sinal). */
export function Badge({ tone = 'gray', children, dot = true, className }) {
  const [box, dotColor] = tones[tone] ?? tones.gray;
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', box, className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', dotColor, tone === 'blue' && 'animate-pulse')} />}
      {children}
    </span>
  );
}

export const Chip = ({ children, className }) => (
  <span className={cx('inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11.5px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300', className)}>
    {children}
  </span>
);

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition ' +
  'focus:border-brand focus:ring-2 focus:ring-brand/20 ' +
  'dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500';

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block text-sm', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} {...props} className={cx(inputClass, 'h-9', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/20', className)} />;
});

// Largura: ocupa a linha toda, a menos que a classe passada defina outra (w-auto, w-40…).
export const Select = ({ className, ...props }) => (
  <select {...props} className={cx(inputClass.replace('w-full ', ''), /(^|\s)w-/.test(className ?? '') ? '' : 'w-full', 'h-9 pr-8', className)} />
);

/** Busca com ícone e botão de limpar. */
export const SearchInput = forwardRef(function SearchInput({ value, onChange, placeholder = 'Buscar…', className, shortcut }, ref) {
  return (
    <div className={cx('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputClass, 'h-9 pl-9 pr-16')}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      />
      {value ? (
        <button type="button" aria-label="Limpar busca" onClick={() => onChange('')} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <X size={14} />
        </button>
      ) : shortcut ? (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-200 px-1.5 text-[11px] text-gray-400 dark:border-gray-700">{shortcut}</kbd>
      ) : null}
    </div>
  );
});

/** Botões lado a lado para escolher uma opção (ex.: grade/lista). */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-800 dark:bg-gray-900">
      {options.map(([key, text, Icon]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          title={typeof text === 'string' ? text : undefined}
          onClick={() => onChange(key)}
          className={cx(
            'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition',
            value === key ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
          )}
        >
          {Icon && <Icon size={14} />}
          {text}
        </button>
      ))}
    </div>
  );
}

export function Alert({ tone = 'red', children }) {
  if (!children) return null;
  const [box] = tones[tone] ?? tones.red;
  return <div role="alert" className={cx('rounded-lg px-3.5 py-2.5 text-sm', box)}>{children}</div>;
}

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Icon size={22} strokeWidth={1.7} />
      </span>
      {title && <p className="font-semibold">{title}</p>}
      {children && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Modal({ title, description, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={cx(
          'animate-rise flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl dark:border-gray-800 dark:bg-gray-900',
          size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose} className="-mr-2">
            <X size={16} />
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-3.5 dark:border-gray-800">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmação de exclusão. O botão só libera depois de digitar o nome, quando `typeToConfirm` é passado. */
export function ConfirmDelete({ title, children, onCancel, onConfirm, loading, error, typeToConfirm }) {
  const [typed, setTyped] = useState('');
  const locked = typeToConfirm && typed.trim().toLowerCase() !== typeToConfirm.trim().toLowerCase();
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" loading={loading} disabled={locked} onClick={onConfirm}>Excluir</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>{children}</div>
        </div>
        {typeToConfirm && (
          <Field label={<>Para confirmar, digite <strong className="text-gray-900 dark:text-gray-100">{typeToConfirm}</strong></>}>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </Field>
        )}
        <Alert>{error}</Alert>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- avisos (toasts)

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (message, tone = 'green') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-3), { id, message, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-rise pointer-events-auto flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-gray-100 dark:text-gray-900">
            {t.tone === 'red' ? <XCircle size={18} className="shrink-0 text-red-400 dark:text-red-600" /> : <CheckCircle2 size={18} className="shrink-0 text-brand" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
