import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { adminNavDirection, type AdminNavDirection } from './adminMotion';
import { AdminToastHost, type AdminToastPayload } from './AdminToast';

type AdminMotionContextValue = {
  navDirection: AdminNavDirection;
  /** True si une transition pane est en cours — skip empilement. */
  isPaneBusy: boolean;
  setPaneBusy: (v: boolean) => void;
  recordNav: (from: AdminNavSectionId, to: AdminNavSectionId) => AdminNavDirection;
  showToast: (payload: Omit<AdminToastPayload, 'id'>) => void;
};

const AdminMotionContext = createContext<AdminMotionContextValue | null>(null);

export function AdminMotionProvider({ children }: { children: React.ReactNode }) {
  const [navDirection, setNavDirection] = useState<AdminNavDirection>(1);
  const [isPaneBusy, setPaneBusy] = useState(false);
  const [toast, setToast] = useState<AdminToastPayload | null>(null);
  const toastSeq = useRef(0);

  const recordNav = useCallback((from: AdminNavSectionId, to: AdminNavSectionId) => {
    const dir = adminNavDirection(from, to);
    setNavDirection(dir);
    return dir;
  }, []);

  const showToast = useCallback((payload: Omit<AdminToastPayload, 'id'>) => {
    toastSeq.current += 1;
    setToast({ ...payload, id: toastSeq.current });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      navDirection,
      isPaneBusy,
      setPaneBusy,
      recordNav,
      showToast,
    }),
    [navDirection, isPaneBusy, recordNav, showToast],
  );

  return (
    <AdminMotionContext.Provider value={value}>
      {children}
      <AdminToastHost toast={toast} onDismiss={dismissToast} />
    </AdminMotionContext.Provider>
  );
}

export function useAdminMotion(): AdminMotionContextValue {
  const ctx = useContext(AdminMotionContext);
  if (!ctx) {
    return {
      navDirection: 1,
      isPaneBusy: false,
      setPaneBusy: () => undefined,
      recordNav: (_f, _t) => 1,
      showToast: () => undefined,
    };
  }
  return ctx;
}
