import { useEffect, useRef } from 'react';

/**
 * Runs an async fetch when deps change. Aborts the previous run on cleanup
 * to avoid duplicate state updates and extra in-flight requests.
 */
export function useAbortableFetch(
  enabled: boolean,
  deps: unknown[],
  fetchFn: (signal: AbortSignal) => Promise<void>,
) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    void (async () => {
      try {
        await fetchRef.current(controller.signal);
      } catch (err) {
        if (controller.signal.aborted) return;
        throw err;
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed explicitly by caller
  }, [enabled, ...deps]);
}
