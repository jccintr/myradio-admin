import { Square, Volume1, Volume2, VolumeX, X } from 'lucide-react';
import { usePlayer } from '../lib/player.jsx';
import { Equalizer, PlayButton, RadioArt } from './radio.jsx';
import { cityLabel } from '../lib/format.js';

/** Player flutuante: aparece quando você ouve uma rádio para testar. */
export default function MiniPlayer() {
  const { radio, status, error, volume, setVolume, stop, close } = usePlayer();
  if (!radio) return null;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="animate-rise fixed bottom-4 right-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 text-white shadow-2xl">
      <div className="flex items-center gap-3 p-3">
        <RadioArt radio={radio} size={48} className="ring-white/10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{radio.name}</p>
          <p className="flex items-center gap-2 truncate text-xs text-gray-400">
            {status === 'playing' && <Equalizer className="h-3" />}
            {status === 'playing' ? 'Ao vivo' : status === 'loading' ? 'Conectando…' : status === 'error' ? 'Não tocou' : 'Parado'}
            <span className="truncate">· {cityLabel(radio.city)}</span>
          </p>
        </div>
        {status === 'playing' || status === 'loading' ? (
          <button type="button" onClick={stop} aria-label="Parar" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-fg">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <PlayButton radio={radio} className="bg-white text-gray-900" />
        )}
        <button type="button" onClick={close} aria-label="Fechar player" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      </div>
      {error && <p className="border-t border-white/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
        <button type="button" aria-label={volume ? 'Sem som' : 'Com som'} onClick={() => setVolume(volume ? 0 : 0.8)} className="text-gray-400 hover:text-white">
          <VolumeIcon size={16} />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          aria-label="Volume"
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer accent-[#1db954]"
        />
        <span className="truncate text-[11px] text-gray-500" title={radio.streamUrl}>{radio.hsl ? 'HLS' : 'Stream'}</span>
      </div>
    </div>
  );
}
