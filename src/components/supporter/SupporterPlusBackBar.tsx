import React from 'react';
import { StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useSupporterPlusReturn } from '../../hooks/useSupporterPlusReturn';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';

/** Légende « ← Plus » quand l’écran a été ouvert depuis le hub Plus. */
export function SupporterPlusBackBar() {
  const { showBack, onBack } = useSupporterPlusReturn();
  if (!showBack) return null;
  return (
    <PressableSpring
      style={styles.back}
      onPress={onBack}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Retour au menu Plus"
      testID="supporter-plus-back"
    >
      <ProDayText variant="caption" style={styles.backText}>
        ← Plus
      </ProDayText>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  back: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  backText: { color: SUPPORTER_SITE.accent },
});
