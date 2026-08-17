import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from '../coach/coachPortalUi';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';

type Props = {
  count: number;
  onPress: () => void;
};

/** Bandeau rappel matchs demain — tokens coach. */
export function CoachCarpoolReminder({ count, onPress }: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  if (count <= 0) return null;

  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.shell}>
      <Icon name="warning" size={16} color={tokens.accent} />
      <CoachText variant="caption" style={styles.text}>
        {t('carpool.reminder.compact', { n: count })}
      </CoachText>
      <CoachText variant="caption" accent style={styles.cta}>
        {t('carpool.reminder.compactCta')}
      </CoachText>
    </PressableSpring>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    shell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    text: { flex: 1, fontWeight: '700' },
    cta: { fontWeight: '800', fontSize: 12 },
  });
}
