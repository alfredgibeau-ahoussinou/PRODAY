import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { withAlpha } from '../../../components/navigation/tabBarShared';
import {
  primaryTabForCoachNav,
  type CoachNavItemId,
} from '../navigation/coachNavConfig';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';
import { proForm } from '../../../theme/professionalDesign';

type Props = {
  items: CoachNavResolvedItem[];
  activeId: CoachNavItemId;
  onSelect: (id: CoachNavItemId) => void;
};

const TAB_HIT_SLOP = { top: 8, bottom: 6, left: 6, right: 6 } as const;

/**
 * Dock Coach — **4 destinations** (Accueil / Calendrier / Équipe / Menu) et la
 * même forme que le dock Club/Admin :
 *
 *  - capsule flottante à extrémités pleinement arrondies et fond flouté ;
 *  - **aucun encart ni soulignement** sous l’onglet actif : l’état se lit
 *    uniquement sur la couleur de l’icône et du libellé ;
 *  - libellés en **bas de casse** (jamais en capitales) à `proForm.dockLabelSize`.
 *
 * Les couleurs viennent des jetons Coach (`useCoachTheme`). La palette figée du
 * pôle Joueur, qui imposait des surfaces fixes et ignorait le thème clair, n’est
 * plus utilisée ici.
 */
export function CoachTabBar({ items, activeId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForCoachNav(activeId);

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
      testID="coach-tab-bar"
    >
      <View style={styles.dock}>
        <View style={[StyleSheet.absoluteFill, styles.blurClip]} pointerEvents="none">
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 30}
            tint={tokens.isLight ? 'light' : 'dark'}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.row}>
          {items.map((item) => {
            const on = item.id === highlight;
            return (
              <PressableSpring
                key={item.id}
                onPress={() => onSelect(item.id)}
                style={styles.slot}
                scaleTo={0.96}
                haptic
                hitSlop={TAB_HIT_SLOP}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={item.label}
                accessibilityHint={item.hint}
                testID={`coach-tab-${item.id}`}
              >
                <View style={styles.iconWrap}>
                  <Icon
                    name={item.icon}
                    size={proForm.dockIconSize}
                    color={on ? tokens.accent : tokens.muted}
                    variant={on ? 'filled' : 'outline'}
                  />
                  {item.aiBadge ? (
                    <View style={[styles.aiDot, { backgroundColor: tokens.accent }]} />
                  ) : null}
                </View>

                <Text
                  style={[styles.slotLabel, { color: on ? tokens.accent : tokens.muted }]}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  numberOfLines={1}
                >
                  {item.shortLabel ?? item.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      paddingHorizontal: spacing.md,
      paddingTop: 0,
      backgroundColor: 'transparent',
      flexShrink: 0,
      zIndex: 20,
    },
    blurClip: {
      borderRadius: proForm.dockRadius,
      overflow: 'hidden',
    },
    dock: {
      borderWidth: 1,
      borderRadius: proForm.dockRadius,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 6,
      overflow: 'hidden',
      /** Même recette de translucidité que le dock Club, appliquée au jeton Coach. */
      backgroundColor: withAlpha(tokens.surface, 0.88),
      borderColor: tokens.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.45,
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
      justifyContent: 'space-between',
    },
    slot: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
      paddingVertical: 2,
    },
    /** Colonne d’icône nue : pas de fond, pas de bordure (référence). */
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    aiDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    /** Libellés en bas de casse, taille HIG de barre d’onglets. */
    slotLabel: {
      fontSize: proForm.dockLabelSize,
      fontWeight: '600',
      letterSpacing: 0.1,
      width: '100%',
      textAlign: 'center',
    },
  });
}
