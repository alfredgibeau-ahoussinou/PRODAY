import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedStatistics } from '../../../services/supporterFootball/types';
import {
  SUPPORTER_SPACE_COPY,
  SUPPORTER_SPACE_MATCH,
} from '../theme/supporterSpaceTheme';

type Props = {
  statistics: UnifiedStatistics | null | undefined;
};

function formatCell(v: number | string | null | undefined): string {
  if (v == null || v === '') return '–';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v).padStart(2, '0') : String(v);
  }
  return String(v);
}

/** Dual-column match stats — dark Match Center card. Empty if API has no rows. */
export const MatchDetailsCard: React.FC<Props> = ({ statistics }) => {
  if (!statistics?.rows?.length) {
    return (
      <View style={styles.card}>
        <ProDayText variant="body" style={styles.title}>
          {SUPPORTER_SPACE_COPY.matchDetails}
        </ProDayText>
        <ProDayText variant="body" style={styles.empty}>
          {SUPPORTER_SPACE_COPY.noMatchStats}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ProDayText variant="body" style={styles.title}>
        {SUPPORTER_SPACE_COPY.matchDetails}
      </ProDayText>
      {statistics.rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <ProDayText variant="body" style={styles.value}>
            {formatCell(row.home)}
          </ProDayText>
          <ProDayText variant="caption" style={styles.label} numberOfLines={1}>
            {row.label}
          </ProDayText>
          <ProDayText variant="body" style={styles.value}>
            {formatCell(row.away)}
          </ProDayText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SPACE_MATCH.border,
  },
  title: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '700',
    fontSize: 17,
  },
  empty: { color: SUPPORTER_SPACE_MATCH.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  value: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '700',
    width: 48,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  label: {
    flex: 1,
    color: SUPPORTER_SPACE_MATCH.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
});
