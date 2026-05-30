import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CarpoolDriverBalance } from '../../models/TeamEvent';
import { colors, spacing } from '../../theme/designTokens';

interface CarpoolBalanceTableProps {
  rows: CarpoolDriverBalance[];
  seasonLabel?: string;
}

export const CarpoolBalanceTable: React.FC<CarpoolBalanceTableProps> = ({
  rows,
  seasonLabel = 'Saison en cours',
}) => {
  if (rows.length === 0) {
    return (
      <Text style={styles.empty}>
        Aucun trajet enregistré. Désignez des chauffeurs sur vos convocations pour suivre
        l’équité du roulement.
      </Text>
    );
  }

  const maxTrips = Math.max(...rows.map((r) => r.trips), 1);

  return (
    <View>
      <Text style={styles.hint}>Bilan {seasonLabel} — roulement des conducteurs.</Text>
      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.colName]}>Conducteur</Text>
        <Text style={[styles.th, styles.colTrips]}>Trajets</Text>
        <Text style={[styles.th, styles.colLast]}>Dernier</Text>
      </View>
      {rows.map((row) => (
        <View key={row.uid} style={styles.tableRow}>
          <View style={styles.colName}>
            <Text style={styles.name}>{row.name}</Text>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${(row.trips / maxTrips) * 100}%` }]}
              />
            </View>
          </View>
          <Text style={[styles.trips, styles.colTrips]}>{row.trips}</Text>
          <Text style={[styles.last, styles.colLast]}>
            {row.last_trip_at
              ? row.last_trip_at.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })
              : '—'}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  th: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  colName: { flex: 2 },
  colTrips: { flex: 0.6, textAlign: 'center' },
  colLast: { flex: 0.9, textAlign: 'right' },
  name: { fontWeight: '800', fontSize: 14, color: colors.text },
  barTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  trips: { fontWeight: '900', fontSize: 16, color: colors.accent },
  last: { fontSize: 12, color: colors.textSecondary },
});
