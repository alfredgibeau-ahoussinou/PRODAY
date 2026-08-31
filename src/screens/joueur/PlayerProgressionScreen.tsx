import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePlayerHubData } from '../../hooks/usePlayerHubData';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import {
  JoueurSectionHeader,
  PlayerChallengeCard,
  PlayerProgressBar,
  PlayerStatCard,
} from '../../components/joueur';
import { ProDayText } from '../../components/ui/ProDayText';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { JOUEUR_SEASON_OBJECTIVES, getJoueurDailyQuests } from '../../features/joueur/constants';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';

/** Progression — objectifs, défis adaptés âge, barres sur données réelles. */
export function PlayerProgressionScreen({ embedded = false }: { embedded?: boolean }) {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const progressApi = useJoueurProgress();
  const hub = usePlayerHubData(profile);
  const nav = useTabNavigationActions();
  const [refreshing, setRefreshing] = useState(false);

  const theme = useJoueurTheme();
  const accent = theme.accent;

  const ageGroup = useMemo(
    () =>
      session?.ageGroup ??
      resolveJoueurAgeGroup({
        age: profile?.profile.age,
        birthDate: profile?.profile.birth_date,
        gender: profile?.profile.gender,
      }),
    [session?.ageGroup, profile],
  );

  const dailyQuests = useMemo(() => {
    const band = ageGroup === 'youth' ? 'youth' : ageGroup === 'teen' ? 'teen' : 'adult';
    return getJoueurDailyQuests(band);
  }, [ageGroup]);

  const seasonDone = new Set(progressApi?.progress.completedChallengeIds ?? []);
  const dailyDone = new Set(progressApi?.progress.dailyCompletedIds ?? []);
  const streak = progressApi?.progress.streakDays ?? 0;
  const ovr = progressApi?.ovr ?? 0;
  const xp = progressApi?.progress.xp ?? 0;
  const xpNext = progressApi?.level?.xpForNext ?? 100;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hub.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [hub]);

  if (!profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  const body = (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
        decelerationRate="normal"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <View style={styles.statRow}>
          <PlayerStatCard label="Niveau" value={progressApi?.level?.level ?? 1} accent={accent} />
          <PlayerStatCard
            label="Activités"
            value={hub.activities.length}
            hint={hub.activities.length ? 'Enregistrées' : 'Aucune activité'}
            empty={hub.activities.length === 0}
            accent={accent}
          />
        </View>

        <JoueurSectionHeader title="XP saison" />
        <PlayerProgressBar
          value={xp % xpNext}
          max={xpNext}
          label={`${xp % xpNext} / ${xpNext} XP`}
          accent={accent}
        />

        <JoueurSectionHeader title="Quêtes du jour" />
        {dailyQuests.map((q) => {
          const done = dailyDone.has(q.id);
          const prog = done ? 1 : q.id === 'daily-login' && streak > 0 ? 1 : 0;
          return (
            <PlayerChallengeCard
              key={q.id}
              title={q.title}
              description={q.body}
              progress={prog}
              progressMax={1}
              progressLabel={done ? 'Fait' : `${prog}/1`}
              done={done}
              accent={accent}
              onPress={() => {
                if (q.tabHint) nav.setActiveTab(q.tabHint);
              }}
            />
          );
        })}

        <JoueurSectionHeader title="Objectifs saison" />
        {JOUEUR_SEASON_OBJECTIVES.map((obj) => {
          let prog = 0;
          let max = 1;
          if (obj.id === 'season-streak-3') {
            prog = Math.min(streak, 3);
            max = 3;
          } else if (obj.id === 'season-ovr-70') {
            prog = Math.min(ovr, 70);
            max = 70;
          }
          const done = seasonDone.has(obj.id) || prog >= max;
          return (
            <PlayerChallengeCard
              key={obj.id}
              title={obj.title}
              description={obj.body}
              progress={prog}
              progressMax={max}
              progressLabel={`${prog}/${max}`}
              done={done}
              accent={accent}
            />
          );
        })}

        {hub.activities.length === 0 ? (
          <ProDayText variant="body" style={styles.empty}>
            Tes matchs et entraînements apparaîtront ici une fois enregistrés par ton club ou toi.
          </ProDayText>
        ) : null}
      </ScrollView>
  );

  if (embedded) {
    return body;
  }

  return (
    <JoueurScreenChrome variant="page" kicker="Parcours" title="Progression">
      {body}
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PLAYER_DARK.bg },
  scroll: { flex: 1 },
  pad: { padding: spacing.lg, gap: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  empty: { color: PLAYER_DARK.textMuted, marginTop: spacing.sm },
});
