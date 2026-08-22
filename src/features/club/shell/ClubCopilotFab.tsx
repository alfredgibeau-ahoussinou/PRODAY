import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from './ClubThemeContext';
import { clubChrome, clubRadius, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  onPress: () => void;
};

/** Hauteur approx. FAB CRÉER (56) + marge — Copilote reste au-dessus, secondaire. */
const CREATE_FAB_BOTTOM = clubChrome.createFabBottom;
const CREATE_FAB_HEIGHT = 56;
const STACK_GAP = 14;
const EDGE_INSET = clubSpace.md; // 12

/**
 * FAB Copilote — secondaire (ghost émeraude), sous le poids du FAB Créer bleu 56.
 * Masqué sur Accueil par le shell.
 */
export function ClubCopilotFab({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(
    () => createStyles(tokens.pitch, tokens.pitchSoft),
    [tokens.pitch, tokens.pitchSoft],
  );

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
      <View style={styles.face}>
        <Icon name="chat" size={17} color={tokens.pitch} />
      </View>
    </PressableSpring>
  );
}

function createStyles(pitch: string, pitchSoft: string) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      zIndex: 31,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
      elevation: 3,
      ...Platform.select({
        android: { backgroundColor: 'transparent' },
        default: {},
      }),
    },
    face: {
      width: 40,
      height: 40,
      borderRadius: clubRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: pitchSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: pitch,
    },
  });
}
