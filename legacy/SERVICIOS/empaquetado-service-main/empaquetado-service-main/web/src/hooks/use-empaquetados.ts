'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { empaquetadosApi, listPath } from '@/services/empaquetados-api';
import type { Filters } from '@/types/empaquetado';

export function useEmpaquetados(filters: Filters) {
  const [query, setQuery] = useState(filters.q);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(filters.q.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);
  // La clave incluye todos los filtros: una respuesta lenta no reemplaza otra búsqueda.
  const result = useSWR(listPath({ ...filters, q: query }), empaquetadosApi.list, {
    keepPreviousData: true,
    errorRetryCount: 2,
    errorRetryInterval: 3_000,
  });
  return { ...result, isSearching: query !== filters.q.trim() || result.isValidating };
}
