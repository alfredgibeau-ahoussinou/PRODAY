import React from 'react';
import { Platform } from 'react-native';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CompactTabBar } from './CompactTabBar';
import { MobileTabBar } from './MobileTabBar';
import { JoueurGameTabBar } from './JoueurGameTabBar';
import { useJoueurSession } from '../../context/JoueurSessionContext';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
}

/** iOS / Android : dock jeu joueur ou barre mobile. Web : compact / jeu. */
export const BottomTabBar: React.FC<BottomTabBarProps> = (props) => {
  const joueur = useJoueurSession();
  const joueurLive = Boolean(
    joueur?.isJoueurPlayer && joueur.ready && !joueur.needsGate,
  );

  if (joueurLive) {
    return <JoueurGameTabBar {...props} />;
  }

  if (Platform.OS === 'web') {
    return <CompactTabBar {...props} />;
  }
  return <MobileTabBar {...props} />;
};
