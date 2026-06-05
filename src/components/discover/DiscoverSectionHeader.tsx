import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

interface DiscoverSectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  /** Titres plus petits pour carrousels / zones denses */
  compact?: boolean;
}

export const DiscoverSectionHeader: React.FC<DiscoverSectionHeaderProps> = ({
  label,
  title,
  subtitle,
  compact = false,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, compact && styles.subCompact]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.4,
      color: c.text,
      marginTop: spacing.xs,
    },
    titleCompact: {
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    sub: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textSecondary,
      marginTop: 2,
    },
    subCompact: {
      fontSize: 12,
      lineHeight: 17,
      color: c.textMuted,
    },
  });
}
