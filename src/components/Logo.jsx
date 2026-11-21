/** Marca do MyRadio (mesma do app e da versão web) + selo "Admin". */
export default function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#1DB954" />
        <g fill="none" stroke="#08130c" strokeWidth="5" strokeLinecap="round">
          <path d="M20 44a17 17 0 0 1 0-24" />
          <path d="M44 20a17 17 0 0 1 0 24" />
          <path d="M27 38a8 8 0 0 1 0-12" />
          <path d="M37 26a8 8 0 0 1 0 12" />
        </g>
        <circle cx="32" cy="32" r="3.5" fill="#08130c" />
      </svg>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="font-[family-name:var(--font-heading)] text-xl font-extrabold tracking-tight">MyRadio</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">Admin</span>
        </span>
      )}
    </span>
  );
}
