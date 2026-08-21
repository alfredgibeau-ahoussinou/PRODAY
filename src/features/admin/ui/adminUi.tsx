import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ADMIN_TOKENS, type AdminThemeTokens } from '../theme/adminTokens';
import { adminRadius, adminSpace, adminType, type AdminTypeVariant } from '../theme/adminDesignSystem';

type TextProps = {
  children: React.ReactNode;
  variant?: AdminTypeVariant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
};

export function AdminText({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: TextProps) {
  const tokens = ADMIN_TOKENS;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[adminType[variant], { color: color ?? tokens.foreground }, style]}
    >
      {children}
    </Text>
  );
}

export function AdminBrandMark({ compact }: { compact?: boolean }) {
  return (
    <AdminText variant="brand" color={ADMIN_TOKENS.accentHot}>
      {compact ? 'CONTROL' : 'ADMIN CONTROL CENTER'}
    </AdminText>
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
    variant === 'primary' || variant === 'danger' ? '#FFFFFF' : t.foreground;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? t.borderStrong : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <AdminText variant="caption" color={color}>
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
    accent: { bg: t.accentSoft, fg: t.accentHot },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <AdminText variant="label" color={map.fg} style={{ letterSpacing: 0.8 }}>
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
          : t.foreground;
  return (
    <View style={[styles.metric, { borderColor: t.border, backgroundColor: t.surface }]}>
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <AdminText variant="statSm" color={color}>
        {value}
      </AdminText>
      {hint ? (
        <AdminText variant="caption" color={t.muted}>
          {hint}
        </AdminText>
      ) : null}
    </View>
  );
}

export function AdminCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
        style,
      ]}
    >
      {children}
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
    <View style={styles.empty}>
      <AdminText variant="h2">{title}</AdminText>
      {body ? (
        <AdminText variant="body" color={t.muted}>
          {body}
        </AdminText>
      ) : null}
    </View>
  );
}

export function AdminLoading({ label = 'Chargement…' }: { label?: string }) {
  const t = ADMIN_TOKENS;
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={t.accent} />
      <AdminText variant="caption" color={t.muted}>
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
        opacity: 0.55,
      }}
    />
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: adminSpace.lg,
    paddingVertical: adminSpace.sm + 2,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.pill,
    alignSelf: 'flex-start',
  },
  metric: {
    flex: 1,
    minWidth: 120,
    gap: 4,
    padding: adminSpace.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: adminRadius.lg,
    padding: adminSpace.lg,
    gap: adminSpace.sm,
  },
  empty: {
    padding: adminSpace.xl,
    gap: adminSpace.sm,
    alignItems: 'flex-start',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpace.md,
    padding: adminSpace.xl,
  },
});

export type { AdminThemeTokens };
