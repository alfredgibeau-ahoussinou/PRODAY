import React, { useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import {
  CLUB_CREATE_ACTIONS,
  type ClubCreateActionId,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

/** Aligné avec ClubCopilotFab — dock + pastille 40. */
const FAB_BOTTOM = 72;
const EDGE_INSET = clubSpace.md; // 12

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: ClubCreateActionId, nav?: ClubNavItemId) => void;
};

/** Sheet + CRÉER — match, entraînement, joueur, club… (logique inchangée). */
export function ClubCreateSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }]} />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, clubSpace.lg) }]}>
          <View style={styles.handle} />
          <ClubText variant="h3">Créer</ClubText>
          <ClubText variant="caption" muted style={{ marginBottom: clubSpace.sm }}>
            Choisissez ce que vous voulez ajouter
          </ClubText>
          {CLUB_CREATE_ACTIONS.map((action) => (
            <PressableSpring
              key={action.id}
              onPress={() => {
                onSelect(action.id, action.nav);
                onClose();
              }}
              scaleTo={0.98}
              haptic
              style={styles.row}
            >
              <View style={styles.icon}>
                <Icon name={action.icon} size={18} color={tokens.accent} />
              </View>
              <ClubText variant="body" style={{ fontWeight: '600', flex: 1 }}>
                {action.label}
              </ClubText>
              <Icon name="chevron-forward" size={16} color={tokens.faint} />
            </PressableSpring>
          ))}
        </View>
      </View>
    </Modal>
  );
}

/**
 * FAB CRÉER — pastille icon-only collée au bord droit (même traitement que Copilote),
 * sous le Copilote, ouvre la sheet de création.
 */
export function ClubCreateFab({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createFabStyles(), []);
  const right = Math.max(insets.right, 0) + EDGE_INSET;

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.92}
      haptic
      style={[styles.wrap, { right, bottom: FAB_BOTTOM }]}
      accessibilityRole="button"
      accessibilityLabel="Créer"
      testID="club-create-fab"
      hitSlop={8}
    >
      <View style={styles.bubble} pointerEvents="box-none">
        <LinearGradient
          colors={[tokens.accent, tokens.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.face}
        >
          <Icon name="add" size={20} color={tokens.onAccent} />
        </LinearGradient>
      </View>
    </PressableSpring>
  );
}

function createFabStyles() {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      zIndex: 30,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
      ...Platform.select({
        android: { backgroundColor: 'transparent' },
        default: {},
      }),
    },
    bubble: {
      borderRadius: clubRadius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    face: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
  });
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    scrim: { ...StyleSheet.absoluteFillObject },
    sheet: {
      backgroundColor: tokens.raised,
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      gap: clubSpace.xs,
      borderTopWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.lift,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.borderStrong,
      marginBottom: clubSpace.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: 4,
      borderRadius: clubRadius.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
  });
}
