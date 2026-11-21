import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'myradio-admin:theme';
const ThemeContext = createContext(null);

const read = () => {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
};

/** Tema claro, escuro ou do sistema (em "sistema" acompanha o aparelho em tempo real). */
export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(read);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const dark = mode === 'dark' || (mode === 'system' && systemDark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const value = useMemo(
    () => ({
      mode,
      dark,
      setMode: (next) => {
        setModeState(next);
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* ignora */
        }
      },
    }),
    [mode, dark],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
