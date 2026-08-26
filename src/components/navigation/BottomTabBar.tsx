import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CompactTabBar } from './CompactTabBar';
import { MobileTabBar } from './MobileTabBar';
import { JoueurGameTabBar } from './JoueurGameTabBar';
import { DesktopSideTabRail } from './DesktopSideTabRail';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  desktopShellChrome,
  isDesktopWideLayout,
} from '../../theme/desktopShellChrome';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
export { desktopShellChrome, isDesktopWideLayout };

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
  /** Force le rail latéral (App.tsx place déjà le slot à gauche). */
  sideRail?: boolean;
}

/** iOS / Android : dock jeu joueur ou barre mobile. Web étroit : compact. Web large : rail. */
export const BottomTabBar: React.FC<BottomTabBarProps> = (props) => {
  const { width } = useWindowDimensions();
  const joueur = useJoueurSession();
  const joueurLive = Boolean(
    joueur?.isJoueurPlayer && joueur.ready && !joueur.needsGate,
  );
  const wideWeb =
    props.sideRail === true ||
    (Platform.OS === 'web' && isDesktopWideLayout(width));

  if (wideWeb) {
    return <DesktopSideTabRail {...props} />;
  }

  if (joueurLive) {
    return <JoueurGameTabBar {...props} />;
  }

  if (Platform.OS === 'web') {
    return <CompactTabBar {...props} />;
  }
  return <MobileTabBar {...props} />;
};
