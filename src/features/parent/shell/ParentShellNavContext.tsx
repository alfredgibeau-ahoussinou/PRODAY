import React, { createContext, useContext } from 'react';
import type { ParentTabId } from '../navigation/parentNavConfig';

export type ParentShellNavApi = {
  requestNav: (id: ParentTabId) => void;
};

const ParentShellNavContext = createContext<ParentShellNavApi | null>(null);

export function ParentShellNavProvider({
  requestNav,
  children,
}: {
  requestNav: (id: ParentTabId) => void;
  children: React.ReactNode;
}) {
  return (
    <ParentShellNavContext.Provider value={{ requestNav }}>
      {children}
    </ParentShellNavContext.Provider>
  );
}

export function useParentShellNav(): ParentShellNavApi | null {
  return useContext(ParentShellNavContext);
}
