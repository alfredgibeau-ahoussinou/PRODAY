import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';
import { Icon } from './Icon';
import { Logo } from '../Logo';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
  centered?: boolean;
  showBrandLogo?: boolean;
  dark?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  label,
  onBack,
  onMenu,
  rightAction,
  centered = false,
  showBrandLogo = false,
  dark = false,
}) => {
  const ink = dark ? colors.brandInverse : colors.text;
  const subInk = dark ? colors.heroMuted : colors.textSecondary;
  const wrapStyle = dark ? styles.wrapDark : styles.wrap;

  if (centered || onBack) {
    return (
      <View style={wrapStyle}>
        <View style={styles.bar}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={dark ? colors.brandInverse : colors.accent} />
            </TouchableOpacity>
          ) : (
            <View style={styles.side} />
          )}
          <Text style={[styles.barTitle, { color: ink }]} numberOfLines={1}>
            {title}
          </Text>
          {rightAction ??
            (onMenu ? (
              <TouchableOpacity onPress={onMenu} style={styles.side} hitSlop={12}>
                <Icon name="menu" size={20} color={ink} />
              </TouchableOpacity>
            ) : (
              <View style={styles.side} />
            ))}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subInk }]}>{subtitle}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      {label ? (
        <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      ) : null}
      {showBrandLogo && (
        <View style={styles.brandRow}>
          <Logo background={dark ? 'dark' : 'light'} width={72} />
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={[styles.title, { color: ink }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitleInline, { color: subInk }]}>{subtitle}</Text>
          ) : null}
        </View>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
  },
  wrapDark: {
    backgroundColor: colors.surfaceInverse,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.interactive,
  },
  label: {
    ...{
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.8,
      color: colors.accent,
      textTransform: 'uppercase',
    },
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  labelDark: { color: colors.heroMuted },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  side: { width: 44, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  brandRow: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  titles: { flex: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleInline: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
