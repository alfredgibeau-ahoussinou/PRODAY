import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from './ClubThemeContext';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  onPress: () => void;
};

/** Hauteur approx. du FAB CRÉER (pastille 40) + marge verticale claire entre les deux. */
const CREATE_FAB_BOTTOM = 72;
const CREATE_FAB_HEIGHT = 40;
const STACK_GAP = 14;
/** Inset droit serré (hors safe area) — collé au bord, discret. */
const EDGE_INSET = clubSpace.md; // 12

/**
 * FAB Copilote Club — pastille icon-only collée au bord droit,
 * au-dessus de CRÉER, poids visuel minimal sur Accueil.
 */
export function ClubCopilotFab({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(), []);

  const right = Math.max(insets.right, 0) + EDGE_INSET;
  const bottom = CREATE_FAB_BOTTOM + CREATE_FAB_HEIGHT + STACK_GAP;

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.92}
      haptic
      style={[styles.wrap, { right, bottom }]}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le copilote Club"
      accessibilityHint="Dialogue IA — confirmation avant chaque action"
      testID="club-copilot-fab"
      hitSlop={8}
    >
      <View style={styles.bubble} pointerEvents="box-none">
        <LinearGradient
          colors={[tokens.accent, tokens.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.face}
        >
          <Icon name="chat" size={18} color={tokens.onAccent} />
        </LinearGradient>
      </View>
    </PressableSpring>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      zIndex: 31,
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
