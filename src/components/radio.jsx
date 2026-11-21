import { useState } from 'react';
import { Loader2, Pause, Play, Radio as RadioIcon } from 'lucide-react';
import { useIsPlaying, usePlayer } from '../lib/player.jsx';
import { HEALTH, useHealth } from '../lib/health.jsx';
import { Badge, cx } from './ui.jsx';

/** Logo da rádio com reserva caso a imagem não carregue. */
export function RadioArt({ radio, size = 40, className }) {
  const [failed, setFailed] = useState(null);
  const broken = !radio?.imageUrl || failed === radio.imageUrl;
  return (
    <span
      style={{ width: size, height: size }}
      className={cx('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/5', className)}
    >
      {broken ? (
        <RadioIcon size={size * 0.45} strokeWidth={1.7} />
      ) : (
        <img src={radio.imageUrl} alt="" loading="lazy" onError={() => setFailed(radio.imageUrl)} className="h-full w-full object-cover" />
      )}
    </span>
  );
}

export function Equalizer({ className = 'h-3.5' }) {
  return (
    <span className={cx('inline-flex items-end gap-0.5', className)} aria-hidden="true">
      <span className="eq-bar h-full w-[3px] rounded-sm bg-brand" />
      <span className="eq-bar h-full w-[3px] rounded-sm bg-brand" />
      <span className="eq-bar h-full w-[3px] rounded-sm bg-brand" />
    </span>
  );
}

/** Botão de ouvir/parar a rádio no player do painel. */
export function PlayButton({ radio, size = 'md', className }) {
  const { toggle } = usePlayer();
  const playing = useIsPlaying(radio.id);
  const dim = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const icon = size === 'lg' ? 20 : size === 'sm' ? 13 : 16;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(radio);
      }}
      aria-label={playing ? `Parar ${radio.name}` : `Ouvir ${radio.name}`}
      title={playing ? 'Parar' : 'Ouvir para testar'}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full transition active:scale-95',
        playing ? 'bg-brand text-brand-fg' : 'bg-gray-900 text-white hover:bg-brand hover:text-brand-fg dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-brand',
        dim,
        className,
      )}
    >
      {playing === 'loading' ? <Loader2 size={icon} className="animate-spin" /> : playing ? <Pause size={icon} fill="currentColor" /> : <Play size={icon} fill="currentColor" className="ml-0.5" />}
    </button>
  );
}

export function HealthBadge({ radioId }) {
  const result = useHealth().results[radioId];
  if (!result) return null;
  const item = HEALTH[result.status];
  if (!item) return null;
  const title = result.ms && result.status === 'online' ? `Respondeu em ${(result.ms / 1000).toFixed(1).replace('.', ',')} s` : undefined;
  return (
    <span title={title}>
      <Badge tone={item.tone}>{item.label}</Badge>
    </span>
  );
}
