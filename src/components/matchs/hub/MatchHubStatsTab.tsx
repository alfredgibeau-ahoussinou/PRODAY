import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { getMyMatchStat } from '../../../utils/matchLive';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

interface MatchHubStatsTabProps {
  event: TeamEvent;
  profile: User;
}

export const MatchHubStatsTab: React.FC<MatchHubStatsTabProps> = ({ event, profile }) => {
  const { colors } = useAppTheme();
  const myStat = getMyMatchStat(event, profile.uid);
  const season = profile.profile.season_stats;

  const rows = useMemo(() => {
    const stats = Object.values(event.player_match_stats ?? {});
    return stats.sort(
      (a, b) =>
        (b.goals ?? 0) - (a.goals ?? 0) ||
        (b.assists ?? 0) - (a.assists ?? 0) ||
        (b.rating ?? 0) - (a.rating ?? 0)
    );
  }, [event.player_match_stats]);

  return (
    <View style={styles.wrap}>
      {myStat || season ? (
        <ProDaySurface variant="accent" style={[styles.myCard, { borderColor: colors.border }]}>
          <ProDayText variant="eyebrow" accent>
            Ma fiche
          </ProDayText>
          {myStat ? (
            <View style={styles.statGrid}>
              <StatPill label="Note" value={myStat.rating?.toFixed(1) ?? '…'} />
              <StatPill label="Min" value={String(myStat.minutes_played ?? '…')} />
              <StatPill label="Buts" value={String(myStat.goals ?? 0)} />
              <StatPill label="Passes" value={String(myStat.assists ?? 0)} />
              <StatPill label="J" value={String(myStat.yellow_cards ?? 0)} />
              <StatPill label="R" value={String(myStat.red_cards ?? 0)} />
            </View>
          ) : (
            <ProDayText variant="caption" muted>
              Pas encore de feuille de match individuelle pour ce match.
            </ProDayText>
          )}
          {season ? (
            <ProDayText variant="caption" muted style={styles.seasonLine}>
              Saison : {season.matches} matchs · {season.goals} buts · {season.assists} passes
            </ProDayText>
          ) : null}
        </ProDaySurface>
      ) : null}

      <ProDayText variant="section">Feuille de match équipe</ProDayText>
      {rows.length === 0 ? (
        <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
          <Icon name="trophy" size={32} color={colors.textMuted} />
          <ProDayText variant="body" muted style={styles.emptySub}>
            Les notes et statistiques seront renseignées par le staff après ou pendant le match.
          </ProDayText>
        </ProDaySurface>
      ) : (
        <ProDaySurface variant="module" style={[styles.table, { borderColor: colors.border }]}>
          <View style={[styles.tableHead, { borderBottomColor: colors.border }]}>
            <ProDayText variant="caption" muted style={styles.colName}>
              Joueur
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              Note
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              Min
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              B
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.colNum}>
              P
            </ProDayText>
          </View>
          {rows.map((r) => (
            <View
              key={r.uid}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.border },
                r.uid === profile.uid && { backgroundColor: colors.accentSoft },
              ]}
            >
              <ProDayText variant="caption" style={styles.colName} numberOfLines={1}>
                {r.player_name}
              </ProDayText>
              <ProDayText variant="caption" accent style={styles.colNum}>
                {r.rating?.toFixed(1) ?? '…'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.colNum}>
                {r.minutes_played ?? '…'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.colNum}>
                {r.goals ?? 0}
              </ProDayText>
              <ProDayText variant="caption" style={styles.colNum}>
                {r.assists ?? 0}
              </ProDayText>
            </View>
          ))}
        </ProDaySurface>
      )}
    </View>
  );
};

const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.pill}>
    <ProDayText variant="section">{value}</ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  myCard: { borderWidth: 1, gap: spacing.sm },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: { alignItems: 'center', minWidth: 52 },
  seasonLine: { marginTop: spacing.xs },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
  },
  emptySub: { textAlign: 'center' },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colName: { flex: 2, fontWeight: '700' },
  colNum: { flex: 1, textAlign: 'center', fontWeight: '700' },
});
