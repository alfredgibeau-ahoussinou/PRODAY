import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ADMIN_TOKENS, type AdminThemeTokens } from '../theme/adminTokens';
import {
  adminChrome,
  adminLayout,
  adminRadius,
  adminShadow,
  adminSpace,
  adminSurfaceCard,
  adminSurfaceHero,
  adminType,
  type AdminTypeVariant,
} from '../theme/adminDesignSystem';

type TextProps = {
  children: React.ReactNode;
  variant?: AdminTypeVariant;
  color?: string;
  champagne?: boolean;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function AdminText({
  children,
  variant = 'body',
  color,
  champagne,
  muted,
  style,
  numberOfLines,
}: TextProps) {
  const tokens = ADMIN_TOKENS;
  const resolved =
    color ??
    (champagne ? tokens.champagne : muted ? tokens.muted : tokens.foreground);
  return (
    <ProDayText
      variant="body"
      numberOfLines={numberOfLines}
      style={[adminType[variant], { color: resolved }, style]}
    >
      {children}
    </ProDayText>
  );
}

export function AdminBrandMark({ compact }: { compact?: boolean }) {
  const t = ADMIN_TOKENS;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: compact ? 6 : 8,
          height: compact ? 6 : 8,
          borderRadius: 4,
          backgroundColor: t.accent,
          ...adminShadow.champagne(t),
        }}
      />
      <AdminText
        variant="brand"
        champagne
        style={{ fontSize: compact ? 9 : 10, letterSpacing: compact ? 1.6 : 2.2 }}
      >
        {compact ? 'CONTROL' : adminChrome.brandMark}
      </AdminText>
    </View>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'soft';

export function AdminButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  testID?: string;
}) {
  const t = ADMIN_TOKENS;
  const bg =
    variant === 'primary'
      ? t.accent
      : variant === 'danger'
        ? t.danger
        : variant === 'soft'
          ? t.accentSoft
          : 'transparent';
  const color =
    variant === 'primary'
      ? t.accentText
      : variant === 'danger'
        ? '#F7F3EB'
        : variant === 'soft'
          ? t.champagneBright
          : t.foreground;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? t.borderStrong : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          ...(variant === 'primary' ? adminShadow.glow(t) : null),
        },
      ]}
    >
      <AdminText variant="caption" color={color} style={{ fontWeight: '800' }}>
        {label}
      </AdminText>
    </Pressable>
  );
}

export function AdminBadge({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: 'info' | 'success' | 'warn' | 'danger' | 'accent';
}) {
  const t = ADMIN_TOKENS;
  const map = {
    info: { bg: t.infoSoft, fg: t.info },
    success: { bg: t.successSoft, fg: t.success },
    warn: { bg: t.warnSoft, fg: t.warn },
    danger: { bg: t.dangerSoft, fg: t.danger },
    accent: { bg: t.accentSoft, fg: t.champagneBright },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg, borderColor: `${map.fg}33` }]}>
      <AdminText variant="label" color={map.fg} style={{ letterSpacing: 0.9, fontSize: 9 }}>
        {label}
      </AdminText>
    </View>
  );
}

export function AdminMetric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'warn' | 'danger';
}) {
  const t = ADMIN_TOKENS;
  const color =
    tone === 'success'
      ? t.success
      : tone === 'warn'
        ? t.warn
        : tone === 'danger'
          ? t.danger
          : t.champagneBright;
  return (
    <View style={[styles.metric, adminSurfaceCard(t)]}>
      <AdminText variant="label" muted>
        {label}
      </AdminText>
      <AdminText variant="statSm" color={color}>
        {value}
      </AdminText>
      {hint ? (
        <AdminText variant="caption" muted numberOfLines={1}>
          {hint}
        </AdminText>
      ) : null}
    </View>
  );
}

export function AdminCard({
  children,
  style,
  hero,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hero?: boolean;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={[hero ? adminSurfaceHero(t) : adminSurfaceCard(t), styles.cardPad, style]}>
      {children}
    </View>
  );
}

/** En-tête de pane unifié — densités Président. */
export function AdminPaneHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={styles.paneHeader}>
      <View style={styles.paneHeaderRow}>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <AdminBrandMark compact />
          <AdminText variant="h1" numberOfLines={1}>
            {title}
          </AdminText>
          {subtitle ? (
            <AdminText variant="caption" muted numberOfLines={2}>
              {subtitle}
            </AdminText>
          ) : null}
        </View>
        {right}
      </View>
      <View style={[styles.paneHairline, { backgroundColor: t.hairline }]} />
    </View>
  );
}

export function AdminEmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={[styles.empty, { borderColor: t.border, backgroundColor: t.surfaceMuted }]}>
      <LinearGradient
        colors={[t.champagneSoft, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AdminBrandMark compact />
      <AdminText variant="h2">{title}</AdminText>
      {body ? (
        <AdminText variant="body" muted>
          {body}
        </AdminText>
      ) : null}
    </View>
  );
}

export function AdminLoading({ label = 'Chargement du centre…' }: { label?: string }) {
  const t = ADMIN_TOKENS;
  return (
    <View style={[styles.loading, { backgroundColor: t.bg }]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: t.borderLuxury,
          backgroundColor: t.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          ...adminShadow.champagne(t),
        }}
      >
        <ActivityIndicator color={t.accent} />
      </View>
      <AdminBrandMark />
      <AdminText variant="body" muted>
        {label}
      </AdminText>
    </View>
  );
}

export function AdminSkeleton({ height = 72 }: { height?: number }) {
  const t = ADMIN_TOKENS;
  return (
    <View
      style={{
        height,
        borderRadius: adminRadius.md,
        backgroundColor: t.surfaceRaised,
        opacity: 0.5,
        borderWidth: 1,
        borderColor: t.hairline,
      }}
    />
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 40,
    paddingHorizontal: adminSpace.lg,
    paddingVertical: adminSpace.sm + 2,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: adminRadius.pill,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
  },
  metric: {
    flex: 1,
    minWidth: 118,
    gap: 6,
    padding: adminLayout.cardPad,
  },
  cardPad: {
    padding: adminLayout.cardPad,
    gap: adminSpace.md,
  },
  paneHeader: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: adminSpace.md,
    gap: adminSpace.sm,
    position: 'relative',
  },
  paneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpace.md,
  },
  paneHairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    padding: adminSpace.xl,
    gap: adminSpace.md,
    alignItems: 'flex-start',
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...adminShadow.soft,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpace.lg,
    padding: adminSpace.xl,
  },
});

export type { AdminThemeTokens };
