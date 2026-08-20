import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedStatistics } from '../../../services/supporterFootball/types';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_MATCH } from '../theme/supporterSpaceTheme';

type Props = {
  statistics: UnifiedStatistics | null | undefined;
  homeLabel: string;
  awayLabel: string;
  /** Match Center uses dark charcoal surfaces. */
  variant?: 'light' | 'dark';
};

function toNum(v: number | string | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace('%', ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const StatsBars: React.FC<Props> = ({
  statistics,
  homeLabel,
  awayLabel,
  variant = 'light',
}) => {
  const dark = variant === 'dark';
  const palette = dark
    ? {
        empty: SUPPORTER_SPACE_MATCH.muted,
        side: SUPPORTER_SPACE_MATCH.gaugeYellow,
        sideRight: SUPPORTER_SPACE_MATCH.accent,
        label: SUPPORTER_SPACE_MATCH.muted,
        val: SUPPORTER_SPACE_MATCH.foreground,
        track: SUPPORTER_SPACE_MATCH.elevated,
        barHome: SUPPORTER_SPACE_MATCH.gaugeYellow,
        barAway: SUPPORTER_SPACE_MATCH.accent,
      }
    : {
        empty: SUPPORTER_SPACE.muted,
        side: SUPPORTER_SPACE.yellow,
        sideRight: SUPPORTER_SPACE.accent,
        label: SUPPORTER_SPACE.muted,
        val: SUPPORTER_SPACE.foreground,
        track: SUPPORTER_SPACE.band,
        barHome: SUPPORTER_SPACE.yellow,
        barAway: SUPPORTER_SPACE.accent,
      };

  if (!statistics?.rows?.length) {
    return (
      <ProDayText variant="body" style={{ color: palette.empty }}>
        Statistiques non disponibles pour ce match.
      </ProDayText>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="caption" style={{ color: palette.side, fontWeight: '700' }}>
          {homeLabel}
        </ProDayText>
        <ProDayText variant="caption" style={{ color: palette.sideRight, fontWeight: '700' }}>
          {awayLabel}
        </ProDayText>
      </View>
      {statistics.rows.map((row) => {
        const h = toNum(row.home);
        const a = toNum(row.away);
        const total = h + a || 1;
        const hPct = (h / total) * 100;
        const aPct = (a / total) * 100;
        return (
          <View key={row.key} style={styles.row}>
            <ProDayText variant="caption" style={[styles.label, { color: palette.label }]}>
              {row.label}
            </ProDayText>
            <View style={styles.values}>
              <ProDayText variant="caption" style={[styles.val, { color: palette.val }]}>
                {row.home ?? '–'}
              </ProDayText>
              <View style={[styles.barTrack, { backgroundColor: palette.track }]}>
                <View
                  style={[styles.barHome, { width: `${hPct}%`, backgroundColor: palette.barHome }]}
                />
                <View
                  style={[styles.barAway, { width: `${aPct}%`, backgroundColor: palette.barAway }]}
                />
              </View>
              <ProDayText variant="caption" style={[styles.val, { color: palette.val }]}>
                {row.away ?? '–'}
              </ProDayText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  row: { gap: 8 },
  label: { textAlign: 'center', fontSize: 12 },
  values: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  val: {
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barHome: { height: 8 },
  barAway: { height: 8 },
});
