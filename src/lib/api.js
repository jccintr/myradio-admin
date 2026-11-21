const API_URL = (import.meta.env.VITE_RADIOS_API_URL || 'https://radios-api-production.up.railway.app').replace(/\/$/, '');
export { API_URL };

const TOKEN_KEY = 'myradio-admin:token';
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sem armazenamento: a sessão vale até recarregar */
  }
};

export class ApiError extends Error {
  constructor(status, message, fields = []) {
    super(message);
    this.status = status;
    this.fields = fields; // [{ fieldName, message }] quando a API recusa campos (422)
  }
}

/** Traduz as respostas de erro da API Spring (StandardError / ValidationError) para português. */
function messageFor(status, data) {
  if (status === 0) return 'Não foi possível falar com a API. Ela está no ar? (Ou o CORS não libera este endereço.)';
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Você não tem permissão para fazer isso.';
  if (status === 404) return 'Registro não encontrado. Ele pode ter sido excluído.';
  if (status === 409) {
    if (/integrity|constraint|foreign/i.test(data?.message ?? '')) {
      return 'Não é possível excluir: este registro está em uso por outros cadastros.';
    }
    return data?.message || 'Conflito com um registro existente.';
  }
  if (status === 422) return 'Confira os campos destacados.';
  if (status >= 500) return 'A API teve um erro interno. Tente de novo em instantes.';
  return data?.message || data?.error || 'Algo deu errado.';
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(API_URL + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, messageFor(0));
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(response.status, messageFor(response.status, data), data?.errors ?? []);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
};

/**
 * Busca TODAS as páginas de um recurso paginado (a API devolve 10 por página).
 * Primeiro pega a página 0 para saber o total; o resto vem em paralelo.
 */
export async function fetchAllPages(path) {
  const first = await api.get(`${path}?page=0`);
  const pages = first?.totalPages ?? 1;
  if (pages <= 1) return first?.content ?? [];
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => api.get(`${path}?page=${i + 1}`)));
  return [first, ...rest].flatMap((page) => page?.content ?? []);
}

/** Mensagem do campo (vinda do 422 da API) para mostrar embaixo do input. */
export const fieldError = (error, field) => error?.fields?.find((f) => f.fieldName === field)?.message;
