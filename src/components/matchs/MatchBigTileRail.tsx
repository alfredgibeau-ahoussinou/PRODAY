import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MatchChapterId } from '../../content/matchChapters';
import { ProDayText } from '../ui/ProDayText';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { usePlayerTheme } from '../../context/PlayerThemeContext';

interface TabItem {
  id: MatchChapterId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'calendrier', label: 'Matchs', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'centre', label: 'Carte', icon: 'map-outline', activeIcon: 'map' },
  { id: 'convocations', label: 'Convocs', icon: 'mail-outline', activeIcon: 'mail' },
  { id: 'stats', label: 'Stats', icon: 'trophy-outline', activeIcon: 'trophy' },
];

interface MatchBigTileRailProps {
  active: MatchChapterId;
  onSelect: (id: MatchChapterId) => void;
  amicauxBadge?: number;
  convocationsBadge?: number;
  accentColor?: string;
}

export const MatchBigTileRail: React.FC<MatchBigTileRailProps> = ({
  active,
  onSelect,
  convocationsBadge,
  accentColor,
}) => {
  const playerTheme = usePlayerTheme();
  const teamColor =
    accentColor ||
    playerTheme.clubColors?.primary ||
    playerTheme.colors.accent ||
    '#00E676';

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isSelected = active === tab.id;
          const badge =
            tab.id === 'convocations' && convocationsBadge && convocationsBadge > 0
              ? convocationsBadge
              : null;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                if (!isSelected) {
                  prodayHaptics.tabSwitch();
                  onSelect(tab.id);
                }
              }}
              style={styles.tabBtn}
              activeOpacity={0.75}
            >
              <View style={styles.tabContentRow}>
                <Ionicons
                  name={isSelected ? tab.activeIcon : tab.icon}
                  size={17}
                  color={isSelected ? teamColor : '#8B8B9A'}
                />
                <ProDayText
                  style={[
                    styles.tabLabel,
                    isSelected
                      ? [styles.tabLabelActive, { color: '#FFFFFF' }]
                      : styles.tabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </ProDayText>
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                    <ProDayText style={styles.badgeText}>
                      {badge > 9 ? '9+' : badge}
                    </ProDayText>
                  </View>
                ) : null}
              </View>
              {isSelected ? (
                <View style={[styles.activeUnderline, { backgroundColor: teamColor }]} />
              ) : (
                <View style={styles.inactiveUnderline} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  tabLabelInactive: {
    color: '#8B8B9A',
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 1.5,
  },
  inactiveUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: 'transparent',
  },
  badge: {
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginLeft: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
