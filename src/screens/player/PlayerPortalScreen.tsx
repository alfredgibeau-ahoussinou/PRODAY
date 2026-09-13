import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { AnimatedRouteContent } from '../../components/motion';

import { PlayerHomeScreen } from './PlayerHomeScreen';
import { PlayerStatsScreen } from './PlayerStatsScreen';
import { PlayerWellnessScreen } from './PlayerWellnessScreen';
import { PlayerTacticalView } from './PlayerTacticalView';

export type PlayerTabId = 'cockpit' | 'stats' | 'wellness' | 'tactics';

interface PlayerPortalScreenProps {
  initialTab?: PlayerTabId;
}

export const PlayerPortalScreen: React.FC<PlayerPortalScreenProps> = ({
  initialTab = 'cockpit',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlayerTabId>(initialTab);

  const tabs: { id: PlayerTabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'cockpit', label: 'Carrière', icon: 'person' },
    { id: 'stats', label: 'Passeport & CV', icon: 'shield-checkmark' },
    { id: 'wellness', label: 'Santé', icon: 'heart' },
    { id: 'tactics', label: 'Tactique', icon: 'git-network' },
  ];

  const handleTabChange = (tabId: PlayerTabId) => {
    prodayHaptics.selection();
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cockpit':
        return <PlayerHomeScreen onNavigateTab={handleTabChange} />;
      case 'stats':
        return <PlayerStatsScreen />;
      case 'wellness':
        return <PlayerWellnessScreen />;
      case 'tactics':
        return <PlayerTacticalView />;
      default:
        return <PlayerHomeScreen onNavigateTab={handleTabChange} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Apple Segmented Pill Rail */}
      <View style={styles.railContainer}>
        <View style={styles.pillRail}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#000000' : '#94A3B8'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cross-Fade Animated Body */}
      <View style={styles.body}>
        <AnimatedRouteContent
          routeKey={activeTab}
          routeOrder={tabs.map((t) => t.id)}
        >
          {renderContent()}
        </AnimatedRouteContent>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  railContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pillRail: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#30D158',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '900',
  },
  body: {
    flex: 1,
  },
});
