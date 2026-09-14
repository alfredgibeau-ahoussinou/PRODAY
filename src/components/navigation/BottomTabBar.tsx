import React from 'react';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { ProDayBottomTabBar } from './ProDayBottomTabBar';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
  sideRail?: boolean;
}

/**
 * Barre de navigation ProDay v4 — 4 destinations stables (Accueil, Calendrier, 3e pôle, Menu).
 * Fixée au bas de l'écran sur mobile, tablette et web centré.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = (props) => {
  return (
    <ProDayBottomTabBar
      activeTab={props.activeTab}
      onTabPress={props.onTabPress}
      unreadCount={props.unreadCount}
    />
  );
};
