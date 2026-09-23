import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MatchChapterId } from '../../content/matchChapters';
import { ProDayText } from '../ui/ProDayText';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { usePlayerTheme } from '../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { playerType } from '../../theme/playerDesignSystem';

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
    PLAYER_DARK.accent;

  return (
    <View style={styles.container}>
      <View style={styles.segmentControl}>
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
              style={[
                styles.tabBtn,
                isSelected && styles.tabBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.tabContentRow}>
                <Ionicons
                  name={isSelected ? tab.activeIcon : tab.icon}
                  size={14}
                  color={isSelected ? teamColor : PLAYER_DARK.textMuted}
                />
                <ProDayText
                  style={[
                    styles.tabLabel,
                    isSelected ? styles.tabLabelActive : styles.tabLabelInactive,
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  segmentControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabLabel: {
    ...playerType.subheadline,
    fontSize: 12.5,
  },
  tabLabelInactive: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...playerType.micro,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
