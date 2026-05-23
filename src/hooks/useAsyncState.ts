import { useState, useCallback } from "react";

export function useAsyncState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <T>(
      action: () => Promise<T>,
      fallbackMessage: string,
      rethrow: boolean,
    ): Promise<T | undefined> => {
      try {
        setLoading(true);
        setError(null);
        return await action();
      } catch (err) {
        const message = err instanceof Error ? err.message : fallbackMessage;
        setError(message);
        if (rethrow) throw err;
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** For mutations — sets loading/error, rethrows on failure. */
  const run = useCallback(
    <T>(action: () => Promise<T>, fallback = "An error occurred"): Promise<T> =>
      execute(action, fallback, true) as Promise<T>,
    [execute],
  );

  /** For reads called from effects — sets loading/error, swallows the throw. */
  const load = useCallback(
    <T>(action: () => Promise<T>, fallback = "An error occurred"): Promise<T | undefined> =>
      execute(action, fallback, false),
    [execute],
  );

  return { loading, error, run, load };
}
