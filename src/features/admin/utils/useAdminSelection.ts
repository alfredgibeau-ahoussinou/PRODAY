import { useCallback, useState } from 'react';

/** Sélection multi pour actions groupées. */
export function useAdminSelection<T extends string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectAll = useCallback((ids: T[]) => {
    setSelected(new Set(ids));
  }, []);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  return {
    selected,
    count: selected.size,
    ids: [...selected],
    toggle,
    clear,
    selectAll,
    isSelected,
  };
}
