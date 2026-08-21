import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  onPress: () => void;
};

/** Hauteur approx. du FAB CRÉER + marge verticale claire entre les deux bulles. */
const CREATE_FAB_BOTTOM = 72;
const CREATE_FAB_HEIGHT = 48;
const STACK_GAP = 18;

/**
 * FAB Copilote Club — bulle flottante (mini pop-up), inset du bord et du dock,
 * empilée au-dessus de CRÉER avec un écart net.
 */
export function ClubCopilotFab({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const right = Math.max(insets.right, 0) + clubSpace.xl;
  const bottom = CREATE_FAB_BOTTOM + CREATE_FAB_HEIGHT + STACK_GAP;

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.94}
      haptic
      style={[styles.wrap, { right, bottom }]}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le copilote Club"
      accessibilityHint="Dialogue IA — confirmation avant chaque action"
      testID="club-copilot-fab"
    >
      <View style={styles.bubble} pointerEvents="box-none">
        <LinearGradient
          colors={[tokens.accent, tokens.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.face}
        >
          <View style={styles.sheen} pointerEvents="none" />
          <View style={styles.iconDisk}>
            <Icon name="chat" size={20} color={tokens.accent} />
          </View>
          <View style={styles.copy}>
            <ClubText variant="caption" style={styles.title}>
              Copilote
            </ClubText>
            <ClubText variant="caption" style={styles.sub} numberOfLines={1}>
              Demander
            </ClubText>
          </View>
        </LinearGradient>
      </View>
    </PressableSpring>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      zIndex: 31,
      // Ombre douce type carte flottante (pas un FAB collé au bord).
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.42,
      shadowRadius: 22,
      elevation: 10,
      ...Platform.select({
        android: { backgroundColor: 'transparent' },
        default: {},
      }),
    },
    bubble: {
      borderRadius: clubRadius.pill,
      // Halo léger derrière la pill → effet mini pop-up.
      padding: 3,
      backgroundColor: 'rgba(8, 12, 20, 0.35)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    face: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 52,
      paddingLeft: 7,
      paddingRight: 16,
      paddingVertical: 7,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
    },
    sheen: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    iconDisk: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.onAccent,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.32)',
    },
    copy: {
      gap: 1,
      paddingRight: 2,
    },
    title: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    sub: {
      color: 'rgba(255,255,255,0.72)',
      fontWeight: '600',
      fontSize: 10,
      letterSpacing: 0.2,
      lineHeight: 13,
    },
  });
}
