import React, { createContext, useContext } from 'react';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { SupporterDockTabId } from '../features/supporter/navigation/supporterTabs';

export type SupporterShellNavigate = (tab: MainTabId) => void;

interface SupporterShellContextValue {
  navigate: SupporterShellNavigate;
  activeTab: SupporterDockTabId | MainTabId;
}

const SupporterShellContext = createContext<SupporterShellContextValue | null>(null);

export const SupporterShellProvider: React.FC<{
  value: SupporterShellContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <SupporterShellContext.Provider value={value}>{children}</SupporterShellContext.Provider>
);

export function useSupporterShell(): SupporterShellContextValue {
  const ctx = useContext(SupporterShellContext);
  if (!ctx) throw new Error('useSupporterShell must be used within SupporterShellProvider');
  return ctx;
}

export function useSupporterShellOptional(): SupporterShellContextValue | null {
  return useContext(SupporterShellContext);
}
