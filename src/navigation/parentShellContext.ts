import { createContext, useContext } from 'react';
import type { ParentChildBundle } from '../services/parentPortal.service';

export type ParentTabId =
  | 'home'
  | 'profil'
  | 'messages'
  | 'agenda'
  | 'trajet'
  | 'reglages';

export interface ParentShellContextValue {
  children: ParentChildBundle[];
  selected: ParentChildBundle | null;
  setSelectedUid: (uid: string) => void;
  reload: () => Promise<void>;
  loading: boolean;
}

export const ParentShellContext = createContext<ParentShellContextValue | null>(null);

export function useParentShell(): ParentShellContextValue {
  const ctx = useContext(ParentShellContext);
  if (!ctx) throw new Error('useParentShell hors ParentAppShell');
  return ctx;
}
