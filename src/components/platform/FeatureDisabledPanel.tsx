import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { getPlatformFeatureMeta, type PlatformFeatureFlagKey } from '../../content/platformFeatureFlags';
import type { AppColors } from '../../theme/universeTheme';

type FeatureDisabledPanelProps = {
  flag: PlatformFeatureFlagKey;
  /** Bannière compacte (liste) vs panneau plein. */
  compact?: boolean;
  titleOverride?: string;
  messageOverride?: string;
};

/** UI générique quand un feature flag plateforme est OFF. */
export const FeatureDisabledPanel: React.FC<FeatureDisabledPanelProps> = ({
  flag,
  compact = false,
  titleOverride,
  messageOverride,
}) => {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const meta = getPlatformFeatureMeta(flag);
  const title = titleOverride ?? meta.disabledTitle;
  const message = messageOverride ?? meta.disabledMessage;

  if (compact) {
    return (
      <View style={styles.banner} accessibilityRole="text">
        <Icon name="lock" size={16} color={c.textMuted} />
        <ProDayText variant="caption" muted style={styles.bannerText}>
          {title}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.panel} accessibilityRole="summary">
      <View style={[styles.iconRing, { backgroundColor: c.brandSoft }]}>
        <Icon name="lock" size={28} color={c.brand} />
      </View>
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.body}>
        {message}
      </ProDayText>
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
    bannerText: { flex: 1, fontWeight: '700' },
    panel: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconRing: {
      width: 64,
      height: 64,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { textAlign: 'center', marginBottom: spacing.sm },
    body: { textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  });
}
