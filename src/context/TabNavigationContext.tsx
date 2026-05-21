import React, { createContext, useContext } from 'react';
import type { MainTabId } from '../navigation/MainTabs';

interface TabNavigationContextValue {
  activeTab: MainTabId;
  setActiveTab: (tab: MainTabId) => void;
}

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

export const TabNavigationProvider: React.FC<{
  value: TabNavigationContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <TabNavigationContext.Provider value={value}>{children}</TabNavigationContext.Provider>
);

export function useTabNavigation(): TabNavigationContextValue {
  const ctx = useContext(TabNavigationContext);
  if (!ctx) throw new Error('useTabNavigation must be used within TabNavigationProvider');
  return ctx;
}
