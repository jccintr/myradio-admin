import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Player de conferência: ouvir uma rádio direto do painel, para testar o stream antes de publicar.
 * status: idle | loading | playing | error. Rádio ao vivo = play/stop (parar solta o stream).
 * HLS: nativo no Safari; nos demais, hls.js carregado só quando precisa.
 */
const PlayerContext = createContext(null);
const HLS_MIME = 'application/vnd.apple.mpegurl';

export function explainAudioError(url, mediaError) {
  if (window.location.protocol === 'https:' && /^http:\/\//i.test(url)) {
    return 'Stream http:// bloqueado nesta página https (conteúdo misto). O app Android toca; o navegador, não.';
  }
  if (mediaError?.code === 4) return 'Formato não suportado pelo navegador, ou o endereço não responde com áudio.';
  if (mediaError?.code === 2) return 'Falha de rede ao conectar no stream.';
  return 'Não foi possível tocar este stream.';
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const loadId = useRef(0);
  const [radio, setRadio] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(0.8);

  const teardown = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, []);

  const stop = useCallback(() => {
    loadId.current += 1;
    teardown();
    setStatus('idle');
    setError('');
  }, [teardown]);

  const play = useCallback(
    async (next) => {
      const id = ++loadId.current;
      teardown();
      setRadio(next);
      setError('');
      setStatus('loading');
      const audio = audioRef.current;
      const fail = (message) => {
        if (id !== loadId.current) return;
        teardown();
        setStatus('error');
        setError(message);
      };
      try {
        if (next.hsl && !audio.canPlayType(HLS_MIME)) {
          const { default: Hls } = await import('hls.js');
          if (id !== loadId.current) return;
          if (!Hls.isSupported()) return fail('Este navegador não toca streams HLS.');
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hlsRef.current = hls;
          hls.on(Hls.Events.ERROR, (_e, data) => data.fatal && fail('O stream HLS não respondeu (pode ser CORS do servidor da rádio).'));
          hls.loadSource(next.streamUrl);
          hls.attachMedia(audio);
        } else {
          audio.src = next.streamUrl;
        }
        audio.volume = volume;
        await audio.play();
      } catch (e) {
        if (e?.name === 'AbortError') return;
        fail(explainAudioError(next.streamUrl, audio.error));
      }
    },
    [teardown, volume],
  );

  useEffect(() => {
    const audio = audioRef.current;
    const onPlaying = () => setStatus('playing');
    const onWaiting = () => setStatus((s) => (s === 'playing' ? 'loading' : s));
    const onError = () => {
      if (!audio.getAttribute('src') && !hlsRef.current) return;
      setStatus('error');
      setError(explainAudioError(audio.currentSrc, audio.error));
    };
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = useCallback((next) => (radio?.id === next.id && status !== 'idle' && status !== 'error' ? stop() : play(next)), [radio, status, play, stop]);

  const value = useMemo(
    () => ({ radio, status, error, volume, setVolume, play, stop, toggle, close: () => (stop(), setRadio(null)) }),
    [radio, status, error, volume, play, stop, toggle],
  );
  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" />
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);

/** Esta rádio está tocando (ou conectando) no player do painel? */
export function useIsPlaying(radioId) {
  const { radio, status } = usePlayer();
  return radio?.id === radioId && (status === 'playing' || status === 'loading') ? status : null;
}
