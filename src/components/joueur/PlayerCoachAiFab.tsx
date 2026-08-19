import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PlayerCoachAiChat } from './PlayerCoachAiChat';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

type Props = {
  bottomOffset?: number;
};

/** FAB global « Demander à mon Coach IA » dans le shell joueur. */
export function PlayerCoachAiFab({ bottomOffset }: Props) {
  const session = useJoueurSession();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const accent = session?.identity?.accent ?? '#4C8BFF';
  const bottom =
    bottomOffset ?? TAB_BAR_CONTENT_INSET + insets.bottom + spacing.md;

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        <PressableSpring
          onPress={() => setOpen(true)}
          scaleTo={0.97}
          haptic
          style={[styles.fab, { backgroundColor: accent }]}
          accessibilityRole="button"
          accessibilityLabel="Demander à mon Coach IA"
          testID="player-coach-ai-fab"
        >
          <Icon name="star-four-points" size={22} color="#fff" />
        </PressableSpring>
      </View>

      <AnimatedModalShell visible={open} onClose={() => setOpen(false)} variant="compact">
        <View style={styles.sheet}>
          <PlayerCoachAiChat />
        </View>
      </AnimatedModalShell>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 40,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sheet: {
    height: 520,
    maxHeight: '85%',
  },
});
