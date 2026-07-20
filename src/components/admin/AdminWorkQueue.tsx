import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import type { AdminWorkItem } from '../../utils/adminInsights';
import { useAdminStyles } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const KIND_ICON: Record<AdminWorkItem['kind'], 'shield' | 'time' | 'warning' | 'document' | 'mail'> = {
  verification: 'shield',
  reel: 'time',
  report: 'warning',
  payment: 'document',
  application: 'mail',
  post: 'document',
  quote: 'document',
};

const PRIORITY_COLOR = (c: AppColors, p: AdminWorkItem['priority']) => {
  switch (p) {
    case 'critical':
      return c.error;
    case 'high':
      return c.warning;
    case 'medium':
      return c.brand;
    default:
      return c.textMuted;
  }
};

interface AdminWorkQueueProps {
  items: AdminWorkItem[];
  onPressItem?: (item: AdminWorkItem) => void;
  compact?: boolean;
  maxItems?: number;
}

export const AdminWorkQueue: React.FC<AdminWorkQueueProps> = ({
  items,
  onPressItem,
  compact = false,
  maxItems,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const visible = maxItems ? items.slice(0, maxItems) : items;

  if (visible.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="checkmark-circle" size={28} color={c.success} />
        <Text style={styles.emptyTitle}>File vide</Text>
        <Text style={styles.emptySub}>Aucune action prioritaire en attente.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {visible.map((item) => (
        <PressableSpring
          key={item.id}
          onPress={() => onPressItem?.(item)}
          disabled={!onPressItem}
          scaleTo={0.98}
          haptic={Boolean(onPressItem)}
        >
          <View style={[styles.row, compact && styles.rowCompact]}>
            <View style={[styles.stripe, { backgroundColor: PRIORITY_COLOR(c, item.priority) }]} />
            <View style={styles.iconBox}>
              <Icon name={KIND_ICON[item.kind]} size={16} color={c.brand} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.sub} numberOfLines={compact ? 1 : 2}>
                {item.subtitle}
              </Text>
              {item.meta ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
            {onPressItem ? <Icon name="chevron-forward" size={16} color={c.textMuted} /> : null}
          </View>
        </PressableSpring>
      ))}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      overflow: 'hidden',
      ...shadows.card,
    },
    rowCompact: { paddingVertical: spacing.sm },
    stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    copy: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: '800', color: c.text },
    sub: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
    meta: { fontSize: 10, fontWeight: '700', color: c.textMuted, marginTop: 2 },
    empty: {
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.xs,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    emptySub: { fontSize: 12, color: c.textMuted, textAlign: 'center' },
  });
}
