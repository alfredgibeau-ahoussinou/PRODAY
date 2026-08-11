import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { PARENT_SITE } from '../../content/parentPageIdentity';

export function ParentSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ProDaySurface variant="module" style={styles.card}>
      <ProDayText variant="section">{title}</ProDayText>
      {subtitle ? (
        <ProDayText variant="caption" muted>
          {subtitle}
        </ProDayText>
      ) : null}
      {children}
    </ProDaySurface>
  );
}

export function ParentAlertChip({ label }: { label: string }) {
  const { colors: c } = useThemedScreen();
  return (
    <View style={[styles.alert, { backgroundColor: c.accentSoft }]}>
      <Icon name="alert-circle" size={14} color={c.accent} />
      <ProDayText variant="caption" accent style={{ flex: 1 }}>
        {label}
      </ProDayText>
    </View>
  );
}

export function ParentActionButton({
  label,
  onPress,
  tone = 'primary',
  icon,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors: c } = useThemedScreen();
  const bg =
    tone === 'primary'
      ? PARENT_SITE.accent
      : tone === 'danger'
        ? 'rgba(239, 68, 68, 0.18)'
        : c.surfaceMuted;
  const color =
    tone === 'primary' ? '#042f2e' : tone === 'danger' ? '#FCA5A5' : c.text;
  return (
    <PressableSpring
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      haptic
      style={[
        styles.actionBtn,
        {
          backgroundColor: bg,
          borderColor: tone === 'ghost' ? c.border : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={14} color={color} /> : null}
          <ProDayText variant="caption" style={{ color, fontWeight: '800' }}>
            {label}
          </ProDayText>
        </>
      )}
    </PressableSpring>
  );
}

export function ParentQuickGrid({
  items,
}: {
  items: { id: string; label: string; icon: IconName; onPress: () => void }[];
}) {
  const { colors: c } = useThemedScreen();
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={item.onPress}
          scaleTo={0.96}
          haptic
          style={[styles.gridItem, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
        >
          <Icon name={item.icon} size={18} color={PARENT_SITE.accent} />
          <ProDayText variant="caption" style={{ fontWeight: '700', textAlign: 'center' }}>
            {item.label}
          </ProDayText>
        </PressableSpring>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
