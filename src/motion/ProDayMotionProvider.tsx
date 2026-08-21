import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { NavDirection } from './types';
import { navDirectionFromOrder } from './navDirection';

type ProDayMotionContextValue = {
  navDirection: NavDirection;
  /** True si une transition pane est en cours — skip empilement. */
  isPaneBusy: boolean;
  setPaneBusy: (v: boolean) => void;
  recordNav: (from: string, to: string, order?: readonly string[]) => NavDirection;
};

const ProDayMotionContext = createContext<ProDayMotionContextValue | null>(null);

const DEFAULT: ProDayMotionContextValue = {
  navDirection: 1,
  isPaneBusy: false,
  setPaneBusy: () => undefined,
  recordNav: () => 1,
};

/**
 * Provider global — interruptions nav rapides + direction forward/back.
 * Toast / chrome restent locaux aux pôles (AdminToast, etc.).
 */
export function ProDayMotionProvider({ children }: { children: React.ReactNode }) {
  const [navDirection, setNavDirection] = useState<NavDirection>(1);
  const [isPaneBusy, setPaneBusy] = useState(false);

  const recordNav = useCallback(
    (from: string, to: string, order?: readonly string[]) => {
      const dir = order?.length
        ? navDirectionFromOrder(order, from, to)
        : ((to >= from ? 1 : -1) as NavDirection);
      setNavDirection(dir);
      return dir;
    },
    [],
  );

  const value = useMemo(
    () => ({
      navDirection,
      isPaneBusy,
      setPaneBusy,
      recordNav,
    }),
    [navDirection, isPaneBusy, recordNav],
  );

  return (
    <ProDayMotionContext.Provider value={value}>{children}</ProDayMotionContext.Provider>
  );
}

export function useProDayMotion(): ProDayMotionContextValue {
  return useContext(ProDayMotionContext) ?? DEFAULT;
}
