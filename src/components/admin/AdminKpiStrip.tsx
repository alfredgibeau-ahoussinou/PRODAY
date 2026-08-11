import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { computeStatDelta } from '../../utils/adminInsights';

export type AdminKpiItem = {
  key: string;
  label: string;
  value: number;
  previous?: number;
  icon: 'people' | 'calendar' | 'document' | 'warning' | 'mail' | 'time' | 'briefcase' | 'bag' | 'star-four-points' | 'videocam' | 'business';
  alert?: boolean;
  onPress?: () => void;
};

export const AdminKpiStrip: React.FC<{ items: AdminKpiItem[] }> = ({ items }) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const delta = computeStatDelta(item.value, item.previous);
        const isAlert = item.alert && item.value > 0;
        const card = (
          <View style={[styles.card, isAlert && styles.cardAlert]}>
            <View style={styles.top}>
              <View style={[styles.iconWrap, isAlert && styles.iconWrapAlert]}>
                <Icon name={item.icon} size={15} color={isAlert ? '#FFFFFF' : adminChrome.accentHot} />
              </View>
              {delta != null && delta !== 0 ? (
                <Text style={[styles.delta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
                  {delta > 0 ? `+${delta}` : delta}
                </Text>
              ) : item.onPress ? (
                <Icon name="chevron-forward" size={12} color={c.textMuted} />
              ) : null}
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
            {isAlert ? <View style={styles.alertDot} /> : null}
          </View>
        );

        if (!item.onPress) {
          return (
            <View key={item.key} style={styles.cell}>
              {card}
            </View>
          );
        }

        return (
          <PressableSpring key={item.key} style={styles.cell} onPress={item.onPress} scaleTo={0.96} haptic>
            {card}
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
    cell: { width: '47%' },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
      minHeight: 108,
      overflow: 'hidden',
      ...shadows.card,
    },
    cardAlert: {
      borderColor: adminChrome.accent,
      backgroundColor: adminChrome.soft,
    },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapAlert: { backgroundColor: adminChrome.accent },
    value: { fontSize: 28, fontWeight: '800', color: c.text, letterSpacing: -0.8, marginTop: 4 },
    label: { fontSize: 11, fontWeight: '600', color: c.textMuted, lineHeight: 14 },
    delta: { fontSize: 11, fontWeight: '800' },
    deltaUp: { color: c.success },
    deltaDown: { color: c.error },
    alertDot: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: adminChrome.accent,
    },
  });
}
