import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { SANTE_VISIO_BETA_OFF_MESSAGE } from '../../hooks/useSanteVisioEnabled';
import { useMedicalStyles } from './medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

type SanteVisioBetaBannerProps = {
  /** Compact = une ligne sous un header ; sinon carte. */
  compact?: boolean;
};

/** Bannière affichée tant que le flag admin `sante_visio` est OFF. */
export const SanteVisioBetaBanner: React.FC<SanteVisioBetaBannerProps> = ({
  compact = false,
}) => {
  const { colors: c } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.banner, compact && styles.bannerCompact]} accessibilityRole="text">
      <Icon name="lock" size={compact ? 16 : 18} color={c.textMuted} />
      <Text style={styles.text}>{SANTE_VISIO_BETA_OFF_MESSAGE}</Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    bannerCompact: {
      marginBottom: spacing.sm,
      paddingVertical: spacing.xs,
    },
    text: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
      lineHeight: 18,
    },
  });
}
