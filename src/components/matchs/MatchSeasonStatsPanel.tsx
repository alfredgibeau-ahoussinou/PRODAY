import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { ProDaySurface } from '../ui/ProDaySurface';
import { MatchChapterIntro } from './MatchChapterIntro';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

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
      avgRating: rated > 0 ? (ratingSum / rated).toFixed(1) : '—',
    };
  }, [events, profile, matchHistory.length]);

  if (!profile) {
    return (
      <ProDaySurface variant="module" style={styles.empty}>
        <Icon name="trophy" size={32} color={colors.textMuted} />
        <ProDayText variant="section">{t('matchs.stats.intro.title')}</ProDayText>
        <ProDayText variant="body" muted style={styles.emptySub}>
          Connectez-vous pour suivre vos buts, passes et notes de match.
        </ProDayText>
        <PressableSpring onPress={() => openAuth('login')} scaleTo={0.97} haptic>
          <ProDayGradient kind="cta" style={styles.guestCta}>
            <ProDayText variant="caption" inverse style={styles.guestCtaText}>
              {t('common.login')}
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
        <PressableSpring onPress={() => openAuth('signup')} scaleTo={0.98} haptic>
          <ProDayText variant="caption" accent style={styles.guestLink}>
            {t('common.guest.signup')}
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>
    );
  }

  return (
    <View style={styles.wrap}>
      <MatchChapterIntro
        title={t('matchs.stats.intro.title')}
        subtitle={t('matchs.stats.intro.subtitle')}
      />

      <ProDaySurface variant="accent" style={[styles.hero, { borderColor: colors.border }]}>
        <View style={styles.heroGrid}>
          <StatBlock label="Matchs" value={String(season?.matches ?? totals?.matches ?? 0)} />
          <StatBlock label="Buts" value={String(season?.goals ?? totals?.goals ?? 0)} highlight />
          <StatBlock label="Passes" value={String(season?.assists ?? totals?.assists ?? 0)} />
          <StatBlock label="Note moy." value={totals?.avgRating ?? '—'} />
        </View>
        {totals && totals.minutes > 0 ? (
          <ProDayText variant="caption" muted style={styles.minutes}>
            {totals.minutes} minutes jouées (feuilles ProDay)
          </ProDayText>
        ) : null}
      </ProDaySurface>

      <ProDayText variant="section">{t('matchs.stats.history')}</ProDayText>
      {matchHistory.length === 0 ? (
        <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
          <Icon name="trophy" size={32} color={colors.textMuted} />
          <ProDayText variant="body" muted style={styles.emptySub}>
            Jouez des matchs convoqués — le staff renseignera vos notes et stats ici.
          </ProDayText>
        </ProDaySurface>
      ) : (
        matchHistory.map((e) => {
          const s = e.player_match_stats![profile.uid];
          return (
            <ProDaySurface
              key={e.id}
              variant="module"
              style={[styles.row, { borderColor: colors.border }]}
            >
              <View style={styles.rowMain}>
                <ProDayText variant="section" numberOfLines={1}>
                  {e.title}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {e.starts_at.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </ProDayText>
              </View>
              <View style={styles.rowStats}>
                <ProDayText variant="caption" accent style={styles.statNum}>
                  {s.rating?.toFixed(1) ?? '—'}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {s.goals ?? 0}B · {s.assists ?? 0}P
                </ProDayText>
              </View>
            </ProDaySurface>
          );
        })
      )}
    </View>
  );
};

const StatBlock: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={styles.statBlock}>
    <ProDayText variant="hero" accent={highlight}>
      {value}
    </ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  lead: { marginBottom: spacing.sm },
  hero: { borderWidth: 1, gap: spacing.sm },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  statBlock: { alignItems: 'center', minWidth: 72 },
  minutes: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rowMain: { flex: 1, gap: 2 },
  rowStats: { alignItems: 'flex-end' },
  statNum: { fontWeight: '900', fontSize: 16 },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
  },
  emptySub: { textAlign: 'center' },
  guestCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  guestCtaText: { fontWeight: '800' },
  guestLink: { marginTop: spacing.xs, fontWeight: '700' },
});
