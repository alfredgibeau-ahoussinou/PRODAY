import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  primaryTabForClubNav,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import type { ClubNavResolvedItem } from '../navigation/resolveClubNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubForm } from '../theme/clubDesignSystem';

type Props = {
  items: ClubNavResolvedItem[];
  activeId: ClubNavItemId;
  onSelect: (id: ClubNavItemId) => void;
  /** FAB central du dock (« + CRÉER ») — forme reprise de la référence Apple Fitness. */
  onCreate?: () => void;
};

const TAB_HIT_SLOP = { top: 8, bottom: 6, left: 6, right: 6 } as const;

/** Dock club dark premium — calqué sur le pôle coach (5 onglets capsule flottante, accent club & micro-labels). */
export function ClubTabBar({ items, activeId, onSelect, onCreate }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const highlight = primaryTabForClubNav(activeId);
  /** FAB central uniquement si le dock a de quoi l'encadrer. */
  const withFab = Boolean(onCreate) && items.length >= 4;
  const head = withFab ? items.slice(0, 2) : items;
  const tail = withFab ? items.slice(2) : [];

  const renderSlot = (item: ClubNavResolvedItem) => {
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
        testID={`club-tab-${item.id}`}
      >
        {/*
          Référence : **aucun encart** derrière l'icône, **aucun soulignement**.
          L'état actif se lit uniquement sur la couleur — icône et libellé.
        */}
        <View style={styles.iconWrap}>
          <Icon
            name={item.icon}
            size={clubForm.dockIconSize}
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
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
      testID="club-tab-bar"
    >
      <View style={styles.dock}>
        {/* Flou clippé séparément : le dock lui-même ne peut plus masquer le FAB. */}
        <View style={[StyleSheet.absoluteFill, styles.blurClip]} pointerEvents="none">
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.row}>
          {head.map(renderSlot)}
          {/* Créneau central libre : le FAB vient s'y poser en surimpression. */}
          {withFab ? <View style={styles.fabSpacer} /> : null}
          {tail.map(renderSlot)}
        </View>
      </View>

      {/*
        FAB central **posé sur l'arête** du dock (référence) : ancré en haut du
        conteneur, il dépasse de `fabSize × fabOverlap` au-dessus du dock, et le
        `marginTop` du root réserve exactement cette même hauteur.
      */}
      {withFab && onCreate ? (
        <View style={styles.fabAnchor} pointerEvents="box-none">
          <PressableSpring
            onPress={onCreate}
            scaleTo={0.94}
            haptic
            hitSlop={10}
            style={[styles.fab, { backgroundColor: tokens.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Créer"
            accessibilityHint="Créer un match, un entraînement, un joueur ou un événement"
            testID="club-create-fab"
          >
            <Icon name="add" size={clubForm.fabIconSize} color={tokens.onAccent} />
          </PressableSpring>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  /** Hauteur dont le FAB dépasse de l'arête supérieure du dock. */
  const fabProtrusion = clubForm.fabSize * clubForm.fabOverlap;
  return StyleSheet.create({
    root: {
      paddingHorizontal: spacing.md,
      // Réserve **exactement** la part de FAB qui dépasse du dock : il ne
      // recouvre jamais le dernier élément du contenu.
      marginTop: fabProtrusion,
      backgroundColor: 'transparent',
      flexShrink: 0,
      zIndex: 20,
    },
    blurClip: {
      borderRadius: clubForm.dockRadius,
      overflow: 'hidden',
    },
    dock: {
      borderWidth: 1,
      // Capsule à extrémités pleinement arrondies (référence).
      borderRadius: clubForm.dockRadius,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 6,
      // Surface mesurée `#191E23` = rgb(25,30,35), translucide sur le contenu ;
      // bordure = `borderStrong` (D-011).
      backgroundColor: 'rgba(25, 30, 35, 0.88)',
      borderColor: tokens.borderStrong,
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
    /** Largeur du créneau central réservé au FAB. */
    fabSpacer: {
      width: clubForm.fabSize,
    },
    /** Ancrage du FAB : centré sur toute la largeur, dépassant du dock. */
    fabAnchor: {
      position: 'absolute',
      top: -fabProtrusion,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 2,
    },
    fab: {
      width: clubForm.fabSize,
      height: clubForm.fabSize,
      borderRadius: clubForm.fabSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    /** Colonne d'icône nue : pas de fond, pas de bordure (référence). */
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
    /** Libellés en bas de casse, taille HIG de barre d'onglets (référence). */
    slotLabel: {
      fontSize: clubForm.dockLabelSize,
      fontWeight: '600',
      letterSpacing: 0.1,
      width: '100%',
      textAlign: 'center',
    },
  });
}
