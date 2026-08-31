import { createContext, useContext } from 'react';
import type { ParentChildBundle } from '../services/parentPortal.service';
import type { ParentTabId } from '../features/parent/navigation/parentNavConfig';

export type { ParentTabId } from '../features/parent/navigation/parentNavConfig';

export interface ParentShellContextValue {
  children: ParentChildBundle[];
  selected: ParentChildBundle | null;
  setSelectedUid: (uid: string) => void;
  reload: () => Promise<void>;
  loading: boolean;
  activeTab: ParentTabId;
  setActiveTab: (tab: ParentTabId) => void;
}

export const ParentShellContext = createContext<ParentShellContextValue | null>(null);

export function useParentShell(): ParentShellContextValue {
  const ctx = useContext(ParentShellContext);
  if (!ctx) throw new Error('useParentShell hors ParentAppShell');
  return ctx;
}
