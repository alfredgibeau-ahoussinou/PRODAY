import React from 'react';
import { Platform } from 'react-native';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CompactTabBar } from './CompactTabBar';
import { MobileTabBar } from './MobileTabBar';

export { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';

interface BottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
  visibleTabs?: MainTabId[];
}

/** iOS / Android : barre mobile dédiée. Web : barre compacte. */
export const BottomTabBar: React.FC<BottomTabBarProps> = (props) => {
  if (Platform.OS === 'web') {
    return <CompactTabBar {...props} />;
  }
  return <MobileTabBar {...props} />;
};
