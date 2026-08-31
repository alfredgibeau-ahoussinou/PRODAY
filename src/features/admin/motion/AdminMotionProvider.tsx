import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import {
  ProDayMotionProvider,
  useProDayMotion,
  type NavDirection,
} from '../../../motion';
import { ADMIN_MOTION_SECTION_ORDER } from './adminMotion';
import { AdminToastHost, type AdminToastPayload } from './AdminToast';

type AdminMotionContextValue = {
  navDirection: NavDirection;
  isPaneBusy: boolean;
  setPaneBusy: (v: boolean) => void;
  recordNav: (from: AdminNavSectionId, to: AdminNavSectionId) => NavDirection;
  showToast: (payload: Omit<AdminToastPayload, 'id'>) => void;
};

/**
 * Couche Admin au-dessus de ProDayMotionProvider (toast chrome admin).
 */
function AdminMotionBridge({ children }: { children: React.ReactNode }) {
  const global = useProDayMotion();
  const [toast, setToast] = useState<AdminToastPayload | null>(null);
  const toastSeq = useRef(0);

  const recordNav = useCallback(
    (from: AdminNavSectionId, to: AdminNavSectionId) =>
      global.recordNav(from, to, ADMIN_MOTION_SECTION_ORDER),
    [global],
  );

  const showToast = useCallback((payload: Omit<AdminToastPayload, 'id'>) => {
    toastSeq.current += 1;
    setToast({ ...payload, id: toastSeq.current });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo<AdminMotionContextValue>(
    () => ({
      navDirection: global.navDirection,
      isPaneBusy: global.isPaneBusy,
      setPaneBusy: global.setPaneBusy,
      recordNav,
      showToast,
    }),
    [global.navDirection, global.isPaneBusy, global.setPaneBusy, recordNav, showToast],
  );

  return (
    <AdminMotionLocalContext.Provider value={value}>
      {children}
      <AdminToastHost toast={toast} onDismiss={dismissToast} />
    </AdminMotionLocalContext.Provider>
  );
}

const AdminMotionLocalContext = React.createContext<AdminMotionContextValue | null>(null);

export function AdminMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProDayMotionProvider>
      <AdminMotionBridge>{children}</AdminMotionBridge>
    </ProDayMotionProvider>
  );
}

export function useAdminMotion(): AdminMotionContextValue {
  const ctx = React.useContext(AdminMotionLocalContext);
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
