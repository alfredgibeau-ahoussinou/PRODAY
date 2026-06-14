import { useEffect } from 'react';

/** Consomme un deep link une seule fois au montage / changement. */
export function useConsumePending<T>(
  pending: T | null,
  clear: () => void,
  onPending: (value: T) => void
) {
  useEffect(() => {
    if (pending == null) return;
    onPending(pending);
    clear();
  }, [pending, clear, onPending]);
}
