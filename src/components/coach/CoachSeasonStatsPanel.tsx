import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { CoachSectionCard, CoachText } from './coachPortalUi';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';

type Props = {
  events: TeamEvent[];
  profile: User | null;
};

function aggregateTeamStats(events: TeamEvent[]) {
  const played = events.filter(
    (e) => e.player_match_stats && Object.keys(e.player_match_stats).length > 0,
  );
  let goals = 0;
  let assists = 0;
  let rated = 0;
  let ratingSum = 0;
  let players = new Set<string>();

  for (const ev of played) {
    const stats = ev.player_match_stats ?? {};
    for (const [uid, row] of Object.entries(stats)) {
      players.add(uid);
      goals += row.goals ?? 0;
      assists += row.assists ?? 0;
      if (row.rating != null) {
        rated += 1;
        ratingSum += row.rating;
      }
    }
  }

  return {
    played: played.length,
    goals,
    assists,
    players: players.size,
    avgRating: rated > 0 ? (ratingSum / rated).toFixed(1) : '—',
    recent: played
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
      .slice(0, 8),
  };
}

/** Statistiques équipe — onglet coach « Statistiques ». */
export function CoachSeasonStatsPanel({ events, profile }: Props) {
  const stats = useMemo(() => aggregateTeamStats(events), [events]);

  return (
    <View style={styles.wrap}>
      <CoachText variant="caption" muted style={styles.lead}>
        {profile?.profile.club_id
          ? 'Synthèse saison · feuilles de match renseignées par le staff.'
          : 'Rattachez un club pour suivre les stats collectives.'}
      </CoachText>

      <View style={styles.kpiRow}>
        {[
          { label: 'Matchs', value: String(stats.played) },
          { label: 'Buts', value: String(stats.goals) },
          { label: 'Passes', value: String(stats.assists) },
          { label: 'Note moy.', value: stats.avgRating },
        ].map((item, index, arr) => (
          <View
            key={item.label}
            style={[styles.kpiCell, index < arr.length - 1 && styles.kpiBorder]}
          >
            <CoachText variant="section" style={styles.kpiValue}>
              {item.value}
            </CoachText>
            <CoachText variant="caption" muted numberOfLines={1} style={styles.kpiLabel}>
              {item.label}
            </CoachText>
          </View>
        ))}
      </View>

      <CoachSectionCard
        kicker="Effectif"
        title={`${stats.players} joueur${stats.players > 1 ? 's' : ''} noté${stats.players > 1 ? 's' : ''}`}
        body="Les stats proviennent des feuilles ProDay après match."
      />

      <CoachText variant="caption" style={styles.sectionTitle}>
        Derniers matchs
      </CoachText>

      {stats.recent.length === 0 ? (
        <CoachSectionCard
          title="Pas encore de feuille"
          body="Après un match, renseignez les notes et buts depuis le centre match ou la gestion."
        />
      ) : (
        stats.recent.map((ev) => {
          const rows = Object.values(ev.player_match_stats ?? {});
          const g = rows.reduce((n, r) => n + (r.goals ?? 0), 0);
          const a = rows.reduce((n, r) => n + (r.assists ?? 0), 0);
          const score =
            ev.live_state?.home_score != null && ev.live_state?.away_score != null
              ? `${ev.live_state.home_score} – ${ev.live_state.away_score}`
              : null;
          return (
            <View key={ev.id} style={styles.row}>
              <View style={styles.rowMain}>
                <CoachText variant="section" numberOfLines={1}>
                  {ev.title}
                </CoachText>
                <CoachText variant="caption" muted>
                  {ev.starts_at.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {score ? ` · ${score}` : ''}
                </CoachText>
              </View>
              <CoachText variant="caption" style={styles.rowStats}>
                {g}B · {a}P
              </CoachText>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  lead: { lineHeight: 18 },
  kpiRow: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    borderRadius: 16,
    backgroundColor: COACH_SITE.surface,
    overflow: 'hidden',
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  kpiBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COACH_SITE.border,
  },
  kpiValue: {
    color: COACH_SITE.accent,
    fontWeight: '800',
    fontSize: 22,
  },
  kpiLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 9,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: COACH_SITE.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  rowMain: { flex: 1, gap: 2 },
  rowStats: {
    color: COACH_SITE.accent,
    fontWeight: '800',
  },
});
