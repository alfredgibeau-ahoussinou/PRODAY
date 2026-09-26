import React, { createContext, useContext } from 'react';
import type { ParentTabId } from '../navigation/parentNavConfig';

export type ParentNavOptions = {
  replace?: boolean;
  clearHistory?: boolean;
};

export type ParentShellNavApi = {
  history?: ParentTabId[];
  canGoBack?: boolean;
  goBack?: () => void;
  requestNav: (id: ParentTabId, options?: ParentNavOptions) => void;
};

const ParentShellNavContext = createContext<ParentShellNavApi | null>(null);

export function ParentShellNavProvider({
  history = [],
  canGoBack = false,
  goBack = () => {},
  requestNav,
  children,
}: {
  history?: ParentTabId[];
  canGoBack?: boolean;
  goBack?: () => void;
  requestNav: (id: ParentTabId, options?: ParentNavOptions) => void;
  children: React.ReactNode;
}) {
  return (
    <ParentShellNavContext.Provider value={{ history, canGoBack, goBack, requestNav }}>
      {children}
    </ParentShellNavContext.Provider>
  );
}

export function useParentShellNav(): ParentShellNavApi | null {
  return useContext(ParentShellNavContext);
}
