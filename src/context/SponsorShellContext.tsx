import React, { createContext, useContext } from 'react';
import type { SponsorContentSegment, SponsorMainTabId, SponsorRoute } from '../navigation/sponsorTabConfig';

export type SponsorShellNavigate = (route: SponsorRoute) => void;

interface SponsorShellContextValue {
  navigate: SponsorShellNavigate;
  pendingChatThreadId: string | null;
  pendingChatDraft: string | null;
  openChat: (threadId: string, draft?: string) => void;
  clearPendingChat: () => void;
}

const SponsorShellContext = createContext<SponsorShellContextValue | null>(null);

export const SponsorShellProvider: React.FC<{
  value: SponsorShellContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <SponsorShellContext.Provider value={value}>{children}</SponsorShellContext.Provider>
);

export function useSponsorShell(): SponsorShellContextValue {
  const ctx = useContext(SponsorShellContext);
  if (!ctx) throw new Error('useSponsorShell must be used within SponsorShellProvider');
  return ctx;
}

export function useSponsorShellOptional(): SponsorShellContextValue | null {
  return useContext(SponsorShellContext);
}

export function sponsorTabRoute(
  tab: SponsorMainTabId,
  segment?: SponsorContentSegment,
): SponsorRoute {
  return segment ? { tab, segment } : { tab };
}
