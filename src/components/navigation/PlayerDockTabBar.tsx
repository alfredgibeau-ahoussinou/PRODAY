import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { getMobileRailLayout } from '../../navigation/mobileTabConfig';
import { PressableSpring } from '../motion/PressableSpring';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { playerColors, playerType, playerForm } from '../../theme/playerDesignSystem';
import { spacing } from '../../theme/designTokens';

/**
 * Dock du pôle Joueur — **4 destinations** (refonte Player §4) :
 * Accueil · Calendrier · Ma Carte · Menu.
 *
 * Forme « Fitness Park » : capsule flottante, icône et libellé bas de casse,
 * état actif lu sur la **couleur** uniquement (ni encart, ni soulignement).
 * Typographie **Apple system** via `playerType.nav` ; libellés à
 * `playerForm.dockLabelSize`. Toutes les couleurs viennent du socle joueur
 * (`playerDesignSystem`) — aucune valeur littérale.
 */

const DOCK_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'football',
  matchs: 'calendar',
  feed: 'person',
  profil: 'person',
  plus: 'hamburger',
};

/** Libellés visibles du dock — langue configurée de l'application. */
const DOCK_LABELS: Partial<Record<MainTabId, string>> = {
  home: 'Accueil',
  matchs: 'Calendrier',
  feed: 'Ma Carte',
  profil: 'Ma Carte',
  plus: 'Menu',
};

type Props = {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  visibleTabs?: MainTabId[];
};

export function PlayerDockTabBar({
  activeTab,
  onTabPress,
  visibleTabs,
}: Props) {
  const { productLine } = useAppTheme();
  const profile = useSessionProfile();
  const insets = useSafeAreaInsets();

  const rail = useMemo(
    () => getMobileRailLayout(productLine, profile?.role, visibleTabs),
    [productLine, profile?.role, visibleTabs],
  );

  /** Le dock imposé passe avant le rail résolu, sans perdre d'onglet.
   *  « Ma Carte » : `profil` prime sur `feed` si le rail porte encore l'ancien
   *  onglet ; le Menu reste toujours la dernière destination. */
  const slots = useMemo<MainTabId[]>(() => {
    const flat = rail.flat ?? [];
    const ordered: MainTabId[] = [];
    for (const tab of ['home', 'matchs', 'profil', 'feed', 'plus'] as MainTabId[]) {
      if (flat.includes(tab) && !ordered.includes(tab)) ordered.push(tab);
    }
    if (ordered.includes('profil')) {
      return ordered.filter((tab) => tab !== 'feed');
    }
    return ordered;
  }, [rail.flat]);

  const renderSlot = (tab: MainTabId) => {
    const active = tab === activeTab;
    const label = DOCK_LABELS[tab] ?? '';
    const icon = DOCK_ICONS[tab] ?? 'home';

    return (
      <PressableSpring
        key={tab}
        testID={`main-tab-${tab}`}
        onPress={() => onTabPress(tab)}
        scaleTo={0.97}
        haptic
        style={styles.slot}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <Icon
          name={icon}
          size={playerForm.dockIconSize}
          color={active ? playerColors.accent : playerColors.textMuted}
          variant={active ? 'filled' : 'outline'}
        />                <Text
                  style={[
                    styles.slotLabel,
                    { color: active ? playerColors.accent : playerColors.textMuted },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  /** Navigation à hauteur fixe : au-delà de ~1,4x les libellés
                   *  seraient tronqués (mesuré à 2x). */
                  maxFontSizeMultiplier={1.4}
                >
          {label}
        </Text>
      </PressableSpring>
    );
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.dock}>
        <View style={styles.row}>{slots.map((tab) => renderSlot(tab))}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  dock: {
    borderWidth: 1,
    borderRadius: 24,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: playerColors.dockBg,
    borderColor: playerColors.dockBorder,
    ...Platform.select({
      ios: {
        shadowColor: playerColors.bg,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
    minHeight: 48,
  },
  slotLabel: {
    ...playerType.nav,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
});
