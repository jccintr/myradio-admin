import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

/** Lê o conteúdo do JWT (sem validar: quem valida é a API). Traz "authorities" e "exp". */
export function decodeToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(part)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const isAdminToken = (claims) => Array.isArray(claims?.authorities) && claims.authorities.includes('ROLE_ADMIN');
const isExpired = (claims) => !claims?.exp || claims.exp * 1000 <= Date.now();

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Ao abrir: se há token válido de administrador, recupera o usuário.
  useEffect(() => {
    const token = getToken();
    const claims = token && decodeToken(token);
    if (!claims || isExpired(claims) || !isAdminToken(claims)) {
      setToken(null);
      setReady(true);
      return;
    }
    api
      .get('/auth/me')
      .then((me) => setUser({ ...me, expiresAt: claims.exp * 1000 }))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  // Encerra a sessão sozinho quando o token vence (o JWT da API dura 24 h).
  useEffect(() => {
    if (!user?.expiresAt) return undefined;
    const timer = setTimeout(logout, Math.max(0, user.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [user?.expiresAt, logout]);

  const login = useCallback(async (email, password) => {
    let data;
    try {
      data = await api.login(email, password);
    } catch (error) {
      if (error.status === 400 || error.status === 401 || error.status === 422) {
        throw new ApiError(error.status, 'E-mail ou senha incorretos.');
      }
      throw error;
    }
    const claims = decodeToken(data.accessToken);
    if (!isAdminToken(claims)) {
      throw new ApiError(403, 'Esta conta não é de administrador. O painel é só para administradores do MyRadio.');
    }
    setToken(data.accessToken);
    const me = await api.get('/auth/me');
    setUser({ ...me, expiresAt: claims.exp * 1000 });
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
