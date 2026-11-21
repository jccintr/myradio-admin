/** Estados (mesmo enum State da API: a sigla vai no JSON). */
export const STATES = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

/** Texto para busca: minúsculas e sem acento ("São Paulo" acha "sao paulo"). */
export const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Todas as palavras digitadas precisam aparecer em algum dos campos. */
export function matches(query, ...fields) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(fields.join(' '));
  return words.every((word) => haystack.includes(word));
}

export const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });

export const cityLabel = (city) => (city ? `${city.name} - ${city.state}` : '—');

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const dateOnly = (value) => (value ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;

export const ROLE_LABEL = { ROLE_ADMIN: 'Administrador', ROLE_COMMON: 'Ouvinte' };

/** Streams http:// não tocam numa página https (conteúdo misto): o app Android toca, o navegador não. */
export const isInsecureStream = (url) => /^http:\/\//i.test(url ?? '');
