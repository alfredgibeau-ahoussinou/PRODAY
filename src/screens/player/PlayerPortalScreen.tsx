import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { AnimatedRouteContent } from '../../components/motion';

import { PlayerHomeScreen } from './PlayerHomeScreen';
import { PlayerStatsScreen } from './PlayerStatsScreen';
import { PlayerWellnessScreen } from './PlayerWellnessScreen';
import { PlayerTacticalView } from './PlayerTacticalView';
import {
  playerColors,
  playerType,
  playerForm,
  playerCardElevated,
  PLAYER_SURFACE_TOKENS,
} from '../../theme/playerDesignSystem';

export type PlayerTabId = 'cockpit' | 'stats' | 'wellness' | 'tactics';

interface PlayerPortalScreenProps {
  initialTab?: PlayerTabId;
}

/**
 * Portail interne du pôle Joueur (cockpit · passeport · santé · tactique).
 *
 * Rail segmenté « Fitness Park » : pilule sur surface élevée, segment actif en
 * **contour d'accent** (jamais un aplat), typographie Apple system. Toutes les
 * couleurs viennent du socle partagé — aucune valeur littérale.
 */
export const PlayerPortalScreen: React.FC<PlayerPortalScreenProps> = ({
  initialTab = 'cockpit',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlayerTabId>(initialTab);

  const tabs: { id: PlayerTabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'cockpit', label: 'Carrière', icon: 'person' },
    { id: 'stats', label: 'Passeport & CV', icon: 'shield-checkmark' },
    { id: 'wellness', label: 'Forme & Récup', icon: 'fitness' },
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
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      {/* Rail segmenté — sélection au contour, libellés Apple system */}
      <View
        style={styles.railContainer}
        accessibilityRole="tablist"
        accessibilityLabel="Sections du pôle joueur"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRail}
          style={styles.pillRailScroll}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                testID={`player-portal-tab-${tab.id}`}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? playerColors.accent : playerColors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? playerColors.text : playerColors.textMuted },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Body — cross-fade */}
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
    backgroundColor: playerColors.bg,
  },
  railContainer: {
    paddingHorizontal: playerForm.space.lg,
    paddingBottom: playerForm.space.md,
  },
  pillRailScroll: {
    borderRadius: playerForm.cardRadius,
  },
  pillRail: {
    ...playerCardElevated(PLAYER_SURFACE_TOKENS),
    flexDirection: 'row',
    /** Remplit la largeur sur grand écran ; devient défilable dès 320 pt
     *  pour que « Passeport & CV » ne soit jamais tronqué. */
    flexGrow: 1,
    padding: 4,
  },
  tabButton: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: playerForm.space.sm,
    /** Cible tactile du socle (44 pt) — 36 pt mesurés avant sur écran étroit. */
    minHeight: playerForm.chipHeight,
    minWidth: 96,
    borderRadius: playerForm.chipRadius,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    borderColor: playerColors.accent,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    ...playerType.caption,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
});
