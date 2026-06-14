import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { Icon } from './Icon';
import { Logo } from '../Logo';
import { ProDayText } from './ProDayText';

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
  /** Fond sombre aligné espace partenaire */
  sponsorDark?: boolean;
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
  sponsorDark = false,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const isDarkHeader = dark || sponsorDark;
  const ink = isDarkHeader
    ? sponsorDark
      ? SPONSOR_THEME.text
      : c.brandInverse
    : c.text;
  const subInk = isDarkHeader
    ? sponsorDark
      ? SPONSOR_THEME.textSecondary
      : c.heroMuted
    : c.textSecondary;
  const wrapStyle = [
    isDarkHeader ? styles.wrapDark : styles.wrap,
    !isDarkHeader && { backgroundColor: c.background },
    sponsorDark && {
      backgroundColor: SPONSOR_THEME.surface,
      borderBottomWidth: 1,
      borderBottomColor: SPONSOR_THEME.borderSubtle,
    },
  ];
  const backIconColor = sponsorDark
    ? SPONSOR_THEME.heroSubtext
    : dark
      ? c.brandInverse
      : c.brand;
  const backBtnStyle = sponsorDark
    ? { backgroundColor: SPONSOR_THEME.primarySoft }
    : { backgroundColor: c.brandSoft };

  if (centered || onBack) {
    return (
      <View style={wrapStyle}>
        <View style={styles.bar}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={[styles.backBtn, backBtnStyle]} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={backIconColor} />
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
    <View
      style={[
        wrapStyle,
        !isDarkHeader && {
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
        },
      ]}
    >
      {showBrandLogo ? (
        <View style={styles.brandRow}>
          <Logo background={dark ? 'dark' : 'light'} width={72} />
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.titles}>
          {label ? (
            <ProDayText variant="caption" muted style={styles.labelCompact}>
              {label}
            </ProDayText>
          ) : null}
          <ProDayText variant="title" inverse={isDarkHeader} style={[styles.appTitle, { color: ink }]}>
            {title}
          </ProDayText>
          {subtitle ? (
            <ProDayText variant="body" style={[styles.subtitleInline, { color: subInk }]}>
              {subtitle}
            </ProDayText>
          ) : null}
        </View>
        {rightAction}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
  wrap: {
    backgroundColor: c.background,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  labelCompact: {
    marginBottom: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  wrapDark: {
    backgroundColor: c.surfaceInverse,
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
      color: c.brand,
      textTransform: 'uppercase',
    },
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  labelDark: { color: c.heroMuted },
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
    backgroundColor: c.brandSoft,
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
}
