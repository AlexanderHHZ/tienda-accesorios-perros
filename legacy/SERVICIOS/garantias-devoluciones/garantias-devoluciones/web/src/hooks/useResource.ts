import { useCallback, useEffect, useRef, useState } from 'react';
import { asApiError, type ApiError } from '../api/client';

/** Cancela lecturas obsoletas al cambiar de área, cerrar un diálogo o actualizar. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError(null);
    try {
      const result = await load(current.signal);
      if (!current.signal.aborted) setData(result);
    } catch (failure) {
      if (!current.signal.aborted) setError(asApiError(failure));
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);

  return { data, setData, error, loading, reload };
}
