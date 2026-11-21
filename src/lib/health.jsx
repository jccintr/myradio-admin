import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * Verificador de streams: tenta conectar em cada rádio (sem som) e marca se está no ar.
 *   online   o stream respondeu com áudio (ms = tempo até responder)
 *   offline  o servidor recusou / não é áudio
 *   timeout  não respondeu em TIMEOUT_MS
 *   blocked  http:// numa página https: o navegador não deixa testar (o app Android toca normalmente)
 * O resultado fica guardado na sessão do navegador (sessionStorage) para não testar tudo de novo.
 */
const TIMEOUT_MS = 12_000;
const PARALLEL = 4;
const KEY = 'myradio-admin:health';
const HLS_MIME = 'application/vnd.apple.mpegurl';

const HealthContext = createContext(null);

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
};

export async function checkStream(radio, timeout = TIMEOUT_MS) {
  const url = radio.streamUrl ?? '';
  if (window.location.protocol === 'https:' && /^http:\/\//i.test(url)) return { status: 'blocked', at: Date.now() };
  const started = performance.now();
  const audio = new Audio();
  audio.muted = true;
  audio.preload = 'auto';
  let hls = null;

  const result = await new Promise((resolve) => {
    let done = false;
    const finish = (status) => {
      if (done) return;
      done = true;
      resolve({ status, ms: Math.round(performance.now() - started), at: Date.now() });
    };
    const timer = setTimeout(() => finish('timeout'), timeout);
    const ok = () => {
      clearTimeout(timer);
      finish('online');
    };
    const bad = () => {
      clearTimeout(timer);
      finish('offline');
    };
    audio.addEventListener('loadedmetadata', ok);
    audio.addEventListener('canplay', ok);
    audio.addEventListener('error', bad);

    (async () => {
      try {
        if (radio.hsl && !audio.canPlayType(HLS_MIME)) {
          const { default: Hls } = await import('hls.js');
          if (!Hls.isSupported()) return bad();
          hls = new Hls({ enableWorker: false });
          hls.on(Hls.Events.MANIFEST_PARSED, ok);
          hls.on(Hls.Events.ERROR, (_e, data) => data.fatal && bad());
          hls.loadSource(url);
          hls.attachMedia(audio);
        } else {
          audio.src = url;
          audio.load();
        }
      } catch {
        bad();
      }
    })();
  });

  hls?.destroy();
  audio.removeAttribute('src');
  audio.load();
  return result;
}

export function HealthProvider({ children }) {
  const [results, setResults] = useState(load);
  const [running, setRunning] = useState(null); // { done, total }
  const cancelRef = useRef(false);

  const save = useCallback((id, value) => {
    setResults((current) => {
      const next = { ...current, [id]: value };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  }, []);

  const checkOne = useCallback(
    async (radio) => {
      save(radio.id, { status: 'checking' });
      const result = await checkStream(radio);
      save(radio.id, result);
      return result;
    },
    [save],
  );

  /** Testa várias rádios, PARALLEL por vez, com progresso. */
  const checkMany = useCallback(
    async (radios) => {
      cancelRef.current = false;
      const queue = [...radios];
      let done = 0;
      setRunning({ done, total: queue.length });
      const worker = async () => {
        while (queue.length && !cancelRef.current) {
          const radio = queue.shift();
          await checkOne(radio);
          done += 1;
          setRunning({ done, total: radios.length });
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
      setRunning(null);
    },
    [checkOne],
  );

  const value = useMemo(
    () => ({ results, running, checkOne, checkMany, cancel: () => (cancelRef.current = true) }),
    [results, running, checkOne, checkMany],
  );
  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export const useHealth = () => useContext(HealthContext);

export const HEALTH = {
  online: { label: 'No ar', tone: 'green' },
  offline: { label: 'Fora do ar', tone: 'red' },
  timeout: { label: 'Sem resposta', tone: 'amber' },
  blocked: { label: 'Só no app (http)', tone: 'gray' },
  checking: { label: 'Testando…', tone: 'blue' },
};
