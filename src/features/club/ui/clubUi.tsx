import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { spacing } from '../../../theme/designTokens';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';

export function ClubText({
  children,
  variant = 'body',
  muted,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  variant?: 'title' | 'section' | 'body' | 'caption';
  muted?: boolean;
  style?: StyleProp<any>;
  numberOfLines?: number;
}) {
  const { tokens } = useClubTheme();
  const map = {
    title: 'hero' as const,
    section: 'section' as const,
    body: 'body' as const,
    caption: 'caption' as const,
  };
  return (
    <ProDayText
      variant={map[variant]}
      numberOfLines={numberOfLines}
      style={[
        { color: muted ? tokens.muted : tokens.foreground },
        variant === 'title' && { fontWeight: '800', letterSpacing: -0.6, fontSize: 26 },
        variant === 'section' && { fontWeight: '700', letterSpacing: -0.3 },
        style,
      ]}
    >
      {children}
    </ProDayText>
  );
}

export function ClubScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => headerStyles(tokens), [tokens]);
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <ClubText variant="title">{title}</ClubText>
        {subtitle ? (
          <ClubText variant="caption" muted style={styles.sub}>
            {subtitle}
          </ClubText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function ClubChapterScroll({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { tokens } = useClubTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function ClubEmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon = 'football',
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => emptyStyles(tokens), [tokens]);
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={tokens.accent} />
      </View>
      <ClubText variant="section">{title}</ClubText>
      <ClubText variant="body" muted style={styles.body}>
        {body}
      </ClubText>
      {actionLabel && onAction ? (
        <PressableSpring onPress={onAction} scaleTo={0.97} haptic style={styles.cta}>
          <ClubText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
            {actionLabel}
          </ClubText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function ClubSectionCard({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => cardStyles(tokens), [tokens]);
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <ClubText variant="caption" muted style={styles.title}>
          {title}
        </ClubText>
      ) : null}
      {children}
    </View>
  );
}

export function ClubActionRow({
  label,
  hint,
  icon,
  onPress,
  trailing,
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);
  return (
    <PressableSpring
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      haptic={Boolean(onPress)}
      style={styles.row}
    >
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={18} color={tokens.accent} />
        </View>
      ) : null}
      <View style={styles.col}>
        <ClubText variant="body" style={{ fontWeight: '600' }}>
          {label}
        </ClubText>
        {hint ? (
          <ClubText variant="caption" muted numberOfLines={2}>
            {hint}
          </ClubText>
        ) : null}
      </View>
      {trailing ?? (
        onPress ? <Icon name="chevron-forward" size={16} color={tokens.muted} /> : null
      )}
    </PressableSpring>
  );
}

export function ClubLoading() {
  const { tokens } = useClubTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
      <ActivityIndicator color={tokens.accent} />
    </View>
  );
}

export function ClubStatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'ok' | 'warn' | 'alert' | 'neutral';
}) {
  const { tokens } = useClubTheme();
  const color =
    tone === 'ok'
      ? tokens.success
      : tone === 'warn'
        ? tokens.warning
        : tone === 'alert'
          ? tokens.danger
          : tokens.muted;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: `${color}18`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}44`,
      }}
    >
      <ClubText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </ClubText>
    </View>
  );
}

const headerStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    textCol: { flex: 1, minWidth: 0, gap: 4 },
    sub: { marginTop: 2 },
  });

const emptyStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    box: {
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: 16,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    body: { lineHeight: 20 },
    cta: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: tokens.accent,
    },
  });

const cardStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: tokens.surface,
      borderRadius: 16,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: spacing.sm,
    },
    title: {
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontWeight: '800',
      fontSize: 11,
    },
  });

const rowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accentSoft,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
