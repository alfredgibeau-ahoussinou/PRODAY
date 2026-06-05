import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { Logo } from '../Logo';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';

interface MercatoScreenHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  colors: AppColors;
  badgeIcon?: IconName;
  rightAction?: React.ReactNode;
}

export const MercatoScreenHeader: React.FC<MercatoScreenHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  colors,
  badgeIcon = 'search',
  rightAction,
}) => (
  <View style={[styles.wrap, { borderColor: colors.border }]}>
    <View style={[styles.accentBar, { backgroundColor: colors.brand }]} />
    <View style={[styles.body, { backgroundColor: colors.surface }]}>
      <View style={styles.topRow}>
        <Logo width={36} />
        {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
      </View>
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Icon name={badgeIcon} size={14} color={colors.brand} variant="filled" />
        <Text style={[styles.badgeText, { color: colors.brand }]}>{eyebrow}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  right: {
    marginLeft: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
