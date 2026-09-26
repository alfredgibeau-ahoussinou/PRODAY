import React from 'react';
import {
  Platform,
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
import { ADMIN_TOKENS, useAdminTokens, type AdminThemeTokens } from '../theme/adminTokens';
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
import { useAppearance } from '../../../context/AppearanceContext';
import { AdminPaneSkeleton, AdminPressable, AdminSkeletonBlock, AdminAnimatedNumber } from '../motion';

import { AdminText } from './AdminText';
export { AdminText };

export function AdminBrandMark({ compact }: { compact?: boolean }) {
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
      ? '#FFFFFF'
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
      <AdminText variant="caption" color={color} style={{ fontWeight: '700', letterSpacing: 0.2 }}>
        {label}
      </AdminText>
    </AdminPressable>
  );
}

/**
 * Header de panneau détail (modal / sheet) — Style Apple HIG épuré avec bouton fermer compact à droite.
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
  const t = useAdminTokens();
  const insets = useSafeAreaInsets();
  const topClearance = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 24);
  return (
    <View
      style={[
        styles.sheetHeader,
        {
          paddingTop: topClearance + adminSpace.md,
          borderBottomColor: t.hairline,
          backgroundColor: t.bgElevated,
          ...(t.glassBackdrop as any),
        },
      ]}
    >
      <View style={styles.sheetTitleRow}>
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <AdminText variant="h1" numberOfLines={1}>
            {title}
          </AdminText>
          {subtitle ? (
            <AdminText variant="caption" muted numberOfLines={1}>
              {subtitle}
            </AdminText>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {right}
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
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Icon name="close" size={14} color={t.foreground} />
            <AdminText variant="caption" style={{ fontWeight: '700', color: t.foreground }}>
              {closeLabel}
            </AdminText>
          </Pressable>
        </View>
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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
  const t = useAdminTokens();
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

/**
 * Sélecteur d'apparence Liquid Glass Apple unifié pour l'Espace Admin.
 * Permet de basculer instantanément de mode (Auto / Glass / Opaque) et d'intensité.
 */
export function AdminAppearanceSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = useAdminTokens();
  const {
    glassMode,
    intensity,
    isEffectiveGlass,
    isReducedTransparency,
    setGlassMode,
    setIntensity,
  } = useAppearance();

  const modes = [
    { id: 'system', label: 'Auto (Système)' },
    { id: 'glass', label: 'Liquid Glass' },
    { id: 'opaque', label: 'Opaque Solide' },
  ] as const;

  const intensities = [
    { id: 'subtle', label: 'Subtil' },
    { id: 'regular', label: 'Standard' },
    { id: 'intense', label: 'Intense' },
  ] as const;

  return (
    <View style={[styles.appearanceWrap, adminSurfaceCard(t)]}>
      <View style={styles.appearanceHead}>
        <Icon name="sparkles" size={18} color={t.signal} />
        <View style={{ flex: 1, gap: 2 }}>
          <AdminText variant="h3">Apparence & Liquid Glass</AdminText>
          <AdminText variant="caption" muted>
            {isEffectiveGlass
              ? `Liquid Glass Actif · Flou ${intensity === 'subtle' ? '16px' : intensity === 'intense' ? '40px' : '28px'} · Reflets spéculaires`
              : 'Mode Opaque Solide · Haut contraste · Zéro transparence'}
          </AdminText>
        </View>
        {isReducedTransparency ? (
          <AdminBadge label="ACCESS. REDUCED" tone="warn" />
        ) : (
          <AdminBadge label={isEffectiveGlass ? 'GLASS ON' : 'OPAQUE'} tone={isEffectiveGlass ? 'accent' : 'info'} />
        )}
      </View>

      <View style={styles.appearanceSegmentRow}>
        {modes.map((m) => {
          const selected = glassMode === m.id;
          return (
            <AdminPressable
              key={m.id}
              onPress={() => void setGlassMode(m.id)}
              scaleTo={0.97}
              style={[
                styles.appearanceSegment,
                selected && {
                  backgroundColor: isEffectiveGlass ? t.accentSoft : 'rgba(255, 255, 255, 0.12)',
                  borderColor: selected ? t.signal : t.border,
                },
              ]}
            >
              <AdminText
                variant="caption"
                color={selected ? t.signal : t.muted}
                style={{ fontWeight: selected ? '800' : '600' }}
              >
                {m.label}
              </AdminText>
            </AdminPressable>
          );
        })}
      </View>

      {isEffectiveGlass && !compact ? (
        <View style={{ gap: 6, marginTop: 4 }}>
          <AdminText variant="label" muted>
            Intensité du flou Apple
          </AdminText>
          <View style={styles.appearanceSegmentRow}>
            {intensities.map((i) => {
              const selected = intensity === i.id;
              return (
                <AdminPressable
                  key={i.id}
                  onPress={() => void setIntensity(i.id)}
                  scaleTo={0.97}
                  style={[
                    styles.appearanceSegment,
                    selected && {
                      backgroundColor: t.accentSoft,
                      borderColor: t.signal,
                    },
                  ]}
                >
                  <AdminText
                    variant="caption"
                    color={selected ? t.signal : t.muted}
                    style={{ fontWeight: selected ? '800' : '600' }}
                  >
                    {i.label}
                  </AdminText>
                </AdminPressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
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
    paddingBottom: adminSpace.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetClose: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: adminRadius.pill,
    borderWidth: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  appearanceWrap: {
    padding: adminLayout.cardPad,
    gap: adminSpace.md,
  },
  appearanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appearanceSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  appearanceSegment: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
    backgroundColor: ADMIN_TOKENS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type { AdminThemeTokens };
