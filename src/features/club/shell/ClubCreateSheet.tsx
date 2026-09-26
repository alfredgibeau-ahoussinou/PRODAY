import React, { useEffect, useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PressableSpring } from '../../../components/motion';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { Icon } from '../../../components/ui/Icon';
import {
  CLUB_CREATE_ACTIONS,
  type ClubCreateActionId,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubChrome, clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

/** Aligné avec ClubCopilotFab — dock + FAB 56. */
const FAB_BOTTOM = clubChrome.createFabBottom;
const EDGE_INSET = clubSpace.md; // 12

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: ClubCreateActionId, nav?: ClubNavItemId) => void;
};

/** Sheet + CRÉER — bas→haut ProDayMotion + blur (logique inchangée). */
export function ClubCreateSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const reduced = useReducedMotion();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const backdrop = useSharedValue(visible ? 1 : 0);
  const sheetY = useSharedValue(visible ? 0 : 72);

  useEffect(() => {
    if (visible) {
      if (reduced) {
        backdrop.value = 1;
        sheetY.value = 0;
        return;
      }
      backdrop.value = withTiming(1, {
        duration: prodayMotion.duration.modal,
        easing: prodayMotion.easing.out,
      });
      sheetY.value = withSpring(0, prodayMotion.spring.sheet);
      return;
    }
    if (reduced) {
      backdrop.value = 0;
      sheetY.value = 72;
      return;
    }
    backdrop.value = withTiming(0, { duration: prodayMotion.duration.fast });
    sheetY.value = withTiming(80, {
      duration: prodayMotion.duration.exit,
      easing: prodayMotion.easing.in,
    });
  }, [visible, reduced, backdrop, sheetY]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
    opacity: 0.55 + backdrop.value * 0.45,
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fermer">
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.scrim }]} />
          </Animated.View>
        </Pressable>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, clubSpace.lg) },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <ClubText variant="h3">Créer</ClubText>
              <ClubText variant="caption" muted style={{ marginBottom: clubSpace.sm }}>
                Actions rapides — match, séance, joueur…
              </ClubText>
            </View>
            <PressableSpring
              onPress={onClose}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.closeBtn}
            >
              <Icon name="close" size={20} color={tokens.foreground} />
            </PressableSpring>
          </View>
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
        </Animated.View>
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
  const styles = useMemo(() => createFabStyles(tokens.accent), [tokens.accent]);
  const right = Math.max(insets.right, 0) + EDGE_INSET;

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.92}
      haptic
      style={[styles.wrap, { right, bottom: FAB_BOTTOM }]}
      accessibilityRole="button"
      accessibilityLabel="Créer — actions"
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
          <Icon name="add" size={28} color={tokens.onAccent} />
        </LinearGradient>
      </View>
    </PressableSpring>
  );
}

function createFabStyles(accent: string) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      zIndex: 30,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
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
      width: 56,
      height: 56,
      borderRadius: 28,
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
    sheetHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: clubSpace.md,
      marginBottom: clubSpace.xs,
    },
    closeBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
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
