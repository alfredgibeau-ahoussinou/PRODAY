import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { MatchChapterIntro } from './MatchChapterIntro';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import { MatchEmptyState, MatchKpiRow, MatchLightPanel } from './matchCenterUi';

interface MatchSeasonStatsPanelProps {
  profile: User | null;
  events: TeamEvent[];
}

export const MatchSeasonStatsPanel: React.FC<MatchSeasonStatsPanelProps> = ({
  profile,
  events,
}) => {
  const { colors } = useAppTheme();
  const { openAuth } = useTabNavigation();
  const { t } = useTranslation();
  const season = profile?.profile.season_stats;

  const matchHistory = useMemo(() => {
    if (!profile) return [];
    return events
      .filter((e) => e.player_match_stats?.[profile.uid])
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
      .slice(0, 12);
  }, [events, profile]);

  const totals = useMemo(() => {
    if (!profile) return null;
    let goals = 0;
    let assists = 0;
    let minutes = 0;
    let rated = 0;
    let ratingSum = 0;
    for (const e of events) {
      const s = e.player_match_stats?.[profile.uid];
      if (!s) continue;
      goals += s.goals ?? 0;
      assists += s.assists ?? 0;
      minutes += s.minutes_played ?? 0;
      if (s.rating != null) {
        rated += 1;
        ratingSum += s.rating;
      }
    }
    return {
      matches: matchHistory.length,
      goals,
      assists,
      minutes,
      avgRating: rated > 0 ? (ratingSum / rated).toFixed(1) : '…',
    };
  }, [events, profile, matchHistory.length]);

  if (!profile) {
    return (
      <View style={styles.wrap}>
        <MatchChapterIntro
          kicker="Stats"
          title={t('matchs.stats.intro.title')}
          subtitle="Connectez-vous pour suivre buts, passes et notes de match."
        />
        <MatchEmptyState
          title={t('matchs.stats.intro.title')}
          body="Vos stats de saison apparaissent ici après connexion."
          cta={t('common.login')}
          onPress={() => openAuth('login')}
        />
        <PressableSpring onPress={() => openAuth('signup')} scaleTo={0.98} haptic>
          <ProDayText variant="caption" style={[styles.guestLink, { color: colors.accent }]}>
            {t('common.guest.signup')}
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MatchChapterIntro
        kicker="Stats"
        title={t('matchs.stats.intro.title')}
        subtitle={t('matchs.stats.intro.subtitle')}
      />

      <MatchKpiRow
        items={[
          {
            label: 'Matchs',
            value: String(season?.matches ?? totals?.matches ?? 0),
            tone: colors.accent,
          },
          {
            label: 'Buts',
            value: String(season?.goals ?? totals?.goals ?? 0),
            tone: MATCH_SITE.warn,
          },
          {
            label: 'Passes',
            value: String(season?.assists ?? totals?.assists ?? 0),
          },
          {
            label: 'Note',
            value: totals?.avgRating ?? '…',
          },
        ]}
      />

      {totals && totals.minutes > 0 ? (
        <ProDayText variant="caption" style={styles.minutes}>
          {totals.minutes} minutes jouées (feuilles ProDay)
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" style={[styles.sectionKicker, { color: colors.accent }]}>
        {t('matchs.stats.history')}
      </ProDayText>

      {matchHistory.length === 0 ? (
        <MatchEmptyState
          title="Pas encore de feuille"
          body="Jouez des matchs convoqués. Le staff renseignera notes et stats ici."
        />
      ) : (
        matchHistory.map((e) => {
          const s = e.player_match_stats![profile.uid];
          return (
            <MatchLightPanel key={e.id} style={styles.row}>
              <View style={styles.rowMain}>
                <ProDayText variant="section" numberOfLines={1} style={styles.rowTitle}>
                  {e.title}
                </ProDayText>
                <ProDayText variant="caption" style={styles.muted}>
                  {e.starts_at.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </ProDayText>
              </View>
              <View style={styles.rowStats}>
                <ProDayText variant="caption" style={[styles.statNum, { color: colors.accent }]}>
                  {s.rating?.toFixed(1) ?? '…'}
                </ProDayText>
                <ProDayText variant="caption" style={styles.muted}>
                  {s.goals ?? 0}B · {s.assists ?? 0}P
                </ProDayText>
              </View>
            </MatchLightPanel>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  minutes: { textAlign: 'center', color: MATCH_SITE.muted },
  sectionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { color: MATCH_SITE.foreground, fontWeight: '800' },
  rowStats: { alignItems: 'flex-end' },
  statNum: { fontWeight: '900', fontSize: 16 },
  muted: { color: MATCH_SITE.muted },
  guestLink: { fontWeight: '700', textAlign: 'center' },
});
