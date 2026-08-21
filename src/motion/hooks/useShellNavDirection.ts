import { useCallback, useRef, useState } from 'react';
import { useProDayMotion } from '../ProDayMotionProvider';
import { navDirectionFromOrder } from '../navDirection';
import type { NavDirection } from '../types';

/**
 * Direction forward/back pour shells (Club, Coach, Parent, Président…).
 * Interrompt proprement via ProDayMotionProvider.isPaneBusy côté PaneTransition.
 */
export function useShellNavDirection(order: readonly string[]) {
  const { recordNav } = useProDayMotion();
  const [direction, setDirection] = useState<NavDirection>(1);
  const keyRef = useRef<string | null>(null);

  const noteNav = useCallback(
    (next: string) => {
      const from = keyRef.current ?? next;
      const dir = order.length
        ? recordNav(from, next, order)
        : navDirectionFromOrder(order, from, next);
      setDirection(dir);
      keyRef.current = next;
      return dir;
    },
    [order, recordNav],
  );

  return { direction, noteNav } as const;
}
