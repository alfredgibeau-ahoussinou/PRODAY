import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PlayerCoachAiChat } from './PlayerCoachAiChat';
import { ProDayText } from '../ui/ProDayText';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

type Props = {
  bottomOffset?: number;
};

/** FAB global « Demander à mon Coach IA » dans le shell joueur. */
export function PlayerCoachAiFab({ bottomOffset }: Props) {
  const session = useJoueurSession();
  const playerTheme = usePlayerThemeColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const accent = playerTheme.accent;
  const bottom =
    bottomOffset ?? TAB_BAR_CONTENT_INSET + insets.bottom + spacing.md;

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        <PressableSpring
          onPress={() => setOpen(true)}
          scaleTo={0.97}
          haptic
          style={[styles.fab, { backgroundColor: accent, shadowColor: playerTheme.accentGlow }]}
          accessibilityRole="button"
          accessibilityLabel="Demander à mon Coach IA"
          testID="player-coach-ai-fab"
        >
          <Icon name="star-four-points" size={22} color={PLAYER_DARK.bg} />
        </PressableSpring>
      </View>

      <AnimatedModalShell
        visible={open}
        onClose={() => setOpen(false)}
        variant="compact"
        handleOnly
        sheetBackgroundColor={PLAYER_DARK.bg}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <ProDayText variant="section" style={styles.sheetTitle}>
              Coach IA
            </ProDayText>
            <PressableSpring
              onPress={() => setOpen(false)}
              scaleTo={0.97}
              style={[
                styles.closeBtn,
                {
                  borderColor: `${accent}55`,
                  backgroundColor: playerTheme.accentSoft,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <ProDayText variant="caption" style={[styles.closeText, { color: accent }]}>
                Fermer
              </ProDayText>
            </PressableSpring>
          </View>
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
    flex: 1,
    height: 520,
    maxHeight: '85%',
    backgroundColor: PLAYER_DARK.bg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PLAYER_DARK.border,
  },
  sheetTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  closeText: {
    fontWeight: '800',
  },
});
