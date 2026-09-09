import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { ADMIN_TOKENS, type AdminThemeTokens } from '../theme/adminTokens';
import {
  adminChrome,
  adminLayout,
  adminRadius,
  adminShadow,
  adminSpace,
  adminSurfaceCard,
  adminSurfaceHero,
  adminSurfaceRow,
  adminType,
  type AdminTypeVariant,
} from '../theme/adminDesignSystem';
import { AdminPaneSkeleton, AdminPressable, AdminSkeletonBlock, AdminAnimatedNumber } from '../motion';

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
    (champagne ? tokens.champagneBright : muted ? tokens.muted : tokens.foreground);
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 10 }}>
      <ProDaySymbol size={compact ? 22 : 28} variant="admin" tone="white" />
      <AdminText
        variant="brand"
        style={{
          fontSize: compact ? 9 : 10,
          letterSpacing: compact ? 1.8 : 2.8,
          color: t.railInk,
        }}
      >
        {compact ? 'ADMIN' : adminChrome.brandMark}
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
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  testID?: string;
  compact?: boolean;
}) {
  const t = ADMIN_TOKENS;
  const bg =
    variant === 'primary'
      ? t.accentHot
      : variant === 'danger'
        ? t.danger
        : variant === 'soft'
          ? t.accentSoft
          : 'transparent';
  const color =
    variant === 'primary'
      ? t.accentText
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'soft'
          ? t.accentHot
          : t.foreground;
  return (
    <AdminPressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      scaleTo={0.97}
      style={[
        styles.btn,
        compact ? styles.btnCompact : null,
        {
          backgroundColor: bg,
          borderColor:
            variant === 'ghost'
              ? t.borderStrong
              : variant === 'soft'
                ? t.borderLuxury
                : 'transparent',
          opacity: disabled ? 0.45 : 1,
          ...(variant === 'primary' ? adminShadow.glow(t) : null),
        },
      ]}
    >
      <AdminText variant="caption" color={color} style={{ fontWeight: '800' }}>
        {label}
      </AdminText>
    </AdminPressable>
  );
}

/**
 * Header de panneau détail (modal / sheet) — Fermer large, safe area, pas collé au bord.
 */
export function AdminSheetHeader({
  title,
  subtitle,
  onClose,
  closeLabel = 'Fermer',
  right,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel?: string;
  right?: React.ReactNode;
}) {
  const t = ADMIN_TOKENS;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.sheetHeader,
        {
          paddingTop: Math.max(insets.top, 12) + adminSpace.sm,
          borderBottomColor: t.hairline,
          backgroundColor: t.bgElevated,
        },
      ]}
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        hitSlop={8}
        style={({ pressed }) => [
          styles.sheetClose,
          {
            backgroundColor: t.surfaceMuted,
            borderColor: t.borderStrong,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Icon name="close" size={18} color={t.accentHot} />
        <AdminText variant="h3" champagne style={{ fontWeight: '800' }}>
          {closeLabel}
        </AdminText>
      </Pressable>
      <View style={styles.sheetTitleRow}>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <AdminText variant="h1" numberOfLines={2}>
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
    </View>
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
    <View style={[styles.badge, { backgroundColor: map.bg, borderColor: `${map.fg}40` }]}>
      <AdminText variant="label" color={map.fg} style={{ letterSpacing: 0.8, fontSize: 9 }}>
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
          : t.accentHot;
  return (
    <View style={[styles.metric, adminSurfaceCard(t)]}>
      <AdminText variant="label" muted>
        {label}
      </AdminText>
      {typeof value === 'number' ? (
        <AdminAnimatedNumber value={value} variant="statSm" color={color} />
      ) : (
        <AdminText variant="statSm" color={color}>
          {value}
        </AdminText>
      )}
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

/** En-tête de pane Espace Admin. */
export function AdminPaneHeader({
  title,
  subtitle,
  right,
  eyebrow = 'BUREAU ADMIN',
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  eyebrow?: string;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={styles.paneHeader}>
      <View style={styles.paneHeaderRow}>
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <AdminText variant="label" color={t.signal}>
            {eyebrow}
          </AdminText>
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
      <View style={[styles.paneAccent, { backgroundColor: t.signal }]} />
    </View>
  );
}

export function AdminEmptyState({
  title,
  body,
  icon = 'stats-chart',
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View style={[styles.empty, { borderColor: t.border, backgroundColor: t.surfaceMuted }]}>
      <LinearGradient
        colors={[t.signalSoft, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.emptyIcon, { backgroundColor: t.accentSoft, borderColor: t.borderLuxury }]}>
        <Icon name={icon} size={20} color={t.signal} />
      </View>
      <AdminText variant="h2">{title}</AdminText>
      {body ? (
        <AdminText variant="body" muted>
          {body}
        </AdminText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 4 }}>
          <AdminButton label={actionLabel} variant="soft" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function AdminLoading({ label = 'Chargement du centre…' }: { label?: string }) {
  const t = ADMIN_TOKENS;
  return (
    <View style={[styles.loading, { backgroundColor: t.bg }]} accessibilityLabel={label}>
      <View style={styles.loadingHead}>
        <AdminBrandMark />
        <AdminText variant="caption" muted>
          {label}
        </AdminText>
      </View>
      <AdminPaneSkeleton rows={5} />
    </View>
  );
}

export function AdminSkeleton({ height = 72 }: { height?: number }) {
  return <AdminSkeletonBlock height={height} />;
}

/** Champ recherche unifié. */
export function AdminSearchField({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const t = ADMIN_TOKENS;
  return (
    <View
      style={[
        styles.searchWrap,
        { backgroundColor: t.surfaceMuted, borderColor: t.borderStrong },
      ]}
    >
      <Icon name="search" size={16} color={t.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.faint}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        style={[styles.searchInput, { color: t.foreground }]}
      />
    </View>
  );
}

/** Champ formulaire unifié. */
export function AdminField({
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = ADMIN_TOKENS;
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={t.faint}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      style={[
        styles.field,
        {
          color: t.foreground,
          borderColor: t.borderStrong,
          backgroundColor: t.surfaceMuted,
          minHeight: multiline ? 80 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}

/** Chip filtre / segment. */
export function AdminFilterChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const t = ADMIN_TOKENS;
  return (
    <AdminPressable
      testID={testID}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? t.accentSoft : t.surfaceMuted,
          borderColor: active ? t.borderLuxury : t.border,
        },
      ]}
    >
      <AdminText variant="caption" color={active ? t.accentHot : t.muted}>
        {label}
      </AdminText>
    </AdminPressable>
  );
}

/** Rangée d’entité — listes admin premium. */
export function AdminEntityRow({
  title,
  subtitle,
  meta,
  badge,
  badgeTone = 'info',
  leading,
  trailing,
  onPress,
  selected,
  actions,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeTone?: 'info' | 'success' | 'warn' | 'danger' | 'accent';
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  actions?: React.ReactNode;
}) {
  const t = ADMIN_TOKENS;
  const body = (
    <View
      style={[
        adminSurfaceRow(t),
        styles.entityRow,
        selected ? { borderColor: t.borderLuxury, backgroundColor: t.surfaceRaised } : null,
      ]}
    >
      {leading ? <View style={styles.entityLeading}>{leading}</View> : null}
      <View style={styles.entityBody}>
        <View style={styles.entityTitleRow}>
          <AdminText variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </AdminText>
          {badge ? <AdminBadge label={badge} tone={badgeTone} /> : null}
        </View>
        {subtitle ? (
          <AdminText variant="caption" muted numberOfLines={2}>
            {subtitle}
          </AdminText>
        ) : null}
        {meta ? (
          <AdminText variant="caption" color={t.faint} numberOfLines={1}>
            {meta}
          </AdminText>
        ) : null}
        {actions ? <View style={styles.entityActions}>{actions}</View> : null}
      </View>
      {trailing ??
        (onPress ? (
          <Icon name="chevron-forward" size={16} color={t.faint} />
        ) : null)}
    </View>
  );

  if (!onPress) return body;
  return (
    <AdminPressable onPress={onPress} scaleTo={0.985}>
      {body}
    </AdminPressable>
  );
}

/** Initiale avatar pour listes. */
export function AdminAvatarMark({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'info' | 'success' | 'warn' | 'danger';
}) {
  const t = ADMIN_TOKENS;
  const map = {
    accent: { bg: t.accentSoft, fg: t.accentHot },
    info: { bg: t.infoSoft, fg: t.info },
    success: { bg: t.successSoft, fg: t.success },
    warn: { bg: t.warnSoft, fg: t.warn },
    danger: { bg: t.dangerSoft, fg: t.danger },
  }[tone];
  const initial = (label.trim()[0] || '?').toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: map.bg, borderColor: `${map.fg}35` }]}>
      <AdminText variant="h3" color={map.fg}>
        {initial}
      </AdminText>
    </View>
  );
}

/** Tuile métrique pressable (hub Commande). */
export function AdminMetricTile({
  label,
  value,
  hot,
  onPress,
}: {
  label: string;
  value: string | number;
  hot?: boolean;
  onPress?: () => void;
}) {
  const t = ADMIN_TOKENS;
  return (
    <AdminPressable
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.97}
      style={[
        styles.metricTile,
        {
          borderColor: hot && Number(value) > 0 ? t.warn : t.border,
          backgroundColor: t.surface,
        },
      ]}
    >
      <AdminText variant="label" color={t.faint}>
        {label}
      </AdminText>
      <AdminText
        variant="statSm"
        color={hot && Number(value) > 0 ? t.warn : t.foreground}
      >
        {value}
      </AdminText>
    </AdminPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 40,
    paddingHorizontal: adminSpace.lg,
    paddingVertical: adminSpace.sm + 2,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    minHeight: 34,
    paddingHorizontal: adminSpace.md,
    paddingVertical: 6,
  },
  sheetHeader: {
    paddingHorizontal: adminLayout.headerPadX,
    paddingBottom: adminSpace.lg,
    gap: adminSpace.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetClose: {
    minHeight: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: adminSpace.xl,
    paddingVertical: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpace.md,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
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
    paddingBottom: adminSpace.md + 2,
    gap: adminSpace.sm,
    position: 'relative',
  },
  paneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpace.md,
  },
  paneAccent: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
  },
  empty: {
    padding: adminSpace.xl,
    gap: adminSpace.md,
    alignItems: 'flex-start',
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    paddingTop: adminSpace.md,
  },
  loadingHead: {
    paddingHorizontal: adminSpace.lg,
    gap: adminSpace.sm,
    marginBottom: adminSpace.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  field: {
    borderWidth: 1,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  entityLeading: {
    flexShrink: 0,
  },
  entityBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  entityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entityActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTile: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    padding: adminSpace.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    gap: 4,
  },
});

export type { AdminThemeTokens };
