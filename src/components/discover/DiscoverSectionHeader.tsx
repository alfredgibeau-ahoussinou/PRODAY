import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { discover, discoverType } from '../../theme/discoverTheme';
import { colors, spacing } from '../../theme/designTokens';

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
}) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
    {subtitle ? (
      <Text style={[styles.sub, compact && styles.subCompact]}>{subtitle}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  label: discoverType.sectionLabel,
  title: { ...discoverType.sectionTitle, marginTop: spacing.xs },
  titleCompact: {
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  sub: { ...discoverType.body, marginTop: 2 },
  subCompact: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
