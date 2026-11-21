import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fetchAllPages } from './api.js';
import { byName } from './format.js';

/**
 * Rádios, cidades e categorias vêm completos (/all): a busca, os filtros e a ordenação acontecem na hora,
 * no navegador. Usuários e listas só existem paginados na API (10 por página): buscamos todas as páginas.
 */
export const useRadios = () => useQuery({ queryKey: ['radios'], queryFn: () => api.get('/radios/all') });
export const useCities = () => useQuery({ queryKey: ['cities'], queryFn: async () => (await api.get('/cities/all')).sort(byName) });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories/all')).sort(byName) });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: async () => (await fetchAllPages('/users')).sort(byName) });
export const useLists = () => useQuery({ queryKey: ['lists'], queryFn: () => fetchAllPages('/lists') });

/** Quantas rádios usam cada cidade / categoria, e em quantas listas cada rádio aparece. */
export function useUsage() {
  const radios = useRadios().data;
  const lists = useLists().data;
  return useMemo(() => {
    const byCity = new Map();
    const byCategory = new Map();
    for (const radio of radios ?? []) {
      byCity.set(radio.city?.id, (byCity.get(radio.city?.id) ?? 0) + 1);
      for (const category of radio.categories ?? []) byCategory.set(category.id, (byCategory.get(category.id) ?? 0) + 1);
    }
    const inLists = new Map();
    for (const list of lists ?? []) {
      for (const item of list.radios ?? []) inLists.set(item.radio?.id, (inLists.get(item.radio?.id) ?? 0) + 1);
    }
    return { byCity, byCategory, inLists };
  }, [radios, lists]);
}

/**
 * Mutação padrão: chama a API e atualiza as consultas afetadas.
 * `invalidate` = chaves para recarregar (ex.: ['radios', 'cities']).
 */
export function useSave(fn, invalidate) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  });
}
