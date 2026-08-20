import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedStatistics } from '../../../services/supporterFootball/types';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  statistics: UnifiedStatistics | null | undefined;
  homeLabel: string;
  awayLabel: string;
};

function toNum(v: number | string | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace('%', ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const StatsBars: React.FC<Props> = ({ statistics, homeLabel, awayLabel }) => {
  if (!statistics?.rows?.length) {
    return (
      <ProDayText variant="body" style={styles.empty}>
        Statistiques non disponibles pour ce match.
      </ProDayText>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="caption" style={styles.side}>
          {homeLabel}
        </ProDayText>
        <ProDayText variant="caption" style={styles.sideRight}>
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
            <View style={styles.values}>
              <ProDayText variant="caption" style={styles.val}>
                {row.home ?? '–'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.label}>
                {row.label}
              </ProDayText>
              <ProDayText variant="caption" style={styles.val}>
                {row.away ?? '–'}
              </ProDayText>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barHome, { width: `${hPct}%` }]} />
              <View style={[styles.barAway, { width: `${aPct}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  empty: { color: SUPPORTER_SPACE.muted },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  side: { color: SUPPORTER_SPACE.bright },
  sideRight: { color: SUPPORTER_SPACE.muted },
  row: { gap: 6 },
  values: { flexDirection: 'row', alignItems: 'center' },
  val: { color: SUPPORTER_SPACE.foreground, width: 40, textAlign: 'center' },
  label: { color: SUPPORTER_SPACE.muted, flex: 1, textAlign: 'center' },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: SUPPORTER_SPACE.band,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barHome: { height: 6, backgroundColor: SUPPORTER_SPACE.accent },
  barAway: { height: 6, backgroundColor: SUPPORTER_SPACE.bright },
});
