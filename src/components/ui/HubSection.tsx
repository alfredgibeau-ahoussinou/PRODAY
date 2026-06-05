import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface HubSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: AppColors;
  style?: ViewStyle;
  compact?: boolean;
}

/** Bloc section unifié dashboard / profil — même grammaire visuelle ProDay. */
export const HubSection: React.FC<HubSectionProps> = ({
  title,
  subtitle,
  children,
  colors,
  style,
  compact,
}) => (
  <View
    style={[
      styles.wrap,
      compact ? styles.wrapCompact : null,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      shadows.soft,
      style,
    ]}
  >
    {title ? (
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    ) : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  wrapCompact: {
    padding: spacing.md,
  },
  head: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
});
