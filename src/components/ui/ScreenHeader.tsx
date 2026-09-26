import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import type { AppColors } from '../../theme/universeTheme';
import { Icon } from './Icon';
import { Logo } from '../Logo';
import { ProDayText } from './ProDayText';
import { useAppearance } from '../../context/AppearanceContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  onBack?: () => void;
  showBack?: boolean;
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
  showBack,
  onMenu,
  rightAction,
  centered = false,
  showBrandLogo = false,
  dark = false,
  sponsorDark = false,
}) => {
  const { colors: c } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const tabNav = useTabNavigationOptional();
  const { tokens: glassTokens, isEffectiveGlass } = useAppearance();
  const styles = useMemo(() => createStyles(c), [c]);

  const effectiveOnBack =
    onBack ??
    (showBack || tabNav?.returnTab
      ? () => {
          if (tabNav?.returnTab) tabNav.goBackTab();
        }
      : undefined);
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
    isEffectiveGlass && glassTokens.blurStyle,
    isEffectiveGlass && {
      borderBottomWidth: 1,
      borderBottomColor: glassTokens.border,
    },
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
      : isPlayer
        ? joueurTheme.accent
        : c.brand;
  const backBtnStyle = sponsorDark
    ? { backgroundColor: SPONSOR_THEME.primarySoft }
    : { backgroundColor: isPlayer ? playerColors.accentSoft : c.brandSoft };

  if (centered || effectiveOnBack) {
    return (
      <View style={wrapStyle}>
        <View style={styles.bar}>
          {effectiveOnBack ? (
            <TouchableOpacity
              onPress={effectiveOnBack}
              style={[styles.backBtn, backBtnStyle]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="chevron-back" size={22} color={backIconColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.side} />
          )}
          <ProDayText
            variant="section"
            numberOfLines={1}
            style={[styles.barTitle, { color: ink }]}
          >
            {title}
          </ProDayText>
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
          <ProDayText variant="body" style={[styles.subtitle, { color: subInk }]}>
            {subtitle}
          </ProDayText>
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
          <Logo
            background={isDarkHeader ? 'dark' : 'light'}
            width={72}
            sponsor={sponsorDark}
          />
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
    // §5.1 — bouton retour squircle 44×44, radius 12, bordure border.
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.brandSoft,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
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
  subtitleInline: {
    marginTop: 4,
  },
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
}
