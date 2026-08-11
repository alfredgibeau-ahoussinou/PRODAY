import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Props = {
  title: string;
  body: string;
  tone?: 'ok' | 'warn' | 'act';
};

/** Signal président / cockpit (va bien, à surveiller, décisions). */
export function ImmersiveSignalCard({ title, body, tone = 'ok' }: Props) {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const accent =
    tone === 'ok' ? c.success : tone === 'warn' ? c.warning : c.brand;

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: c.border }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <ProDayText variant="caption" style={[styles.label, { color: accent }]}>
          {title}
        </ProDayText>
      </View>
      <ProDayText variant="caption" muted style={styles.body}>
        {body}
      </ProDayText>
    </ProDaySurface>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '30%',
      padding: spacing.md,
      gap: spacing.xs,
      borderRadius: radius.lg,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: {
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: 10,
      letterSpacing: 0.8,
    },
    body: { lineHeight: 18 },
  });
}
