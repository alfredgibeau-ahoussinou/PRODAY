import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePlayerHubData } from '../../hooks/usePlayerHubData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import {
  JoueurSectionHeader,
  PlayerMatchCard,
  PlayerStatCard,
  PlayerChallengeCard,
  PlayerAIRecommendation,
  PlayerProgressBar,
  JoueurCard,
} from '../../components/joueur';
import { JoueurActionButton } from '../../components/joueur/JoueurActionButton';
import { ProDayText } from '../../components/ui/ProDayText';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { getJoueurDailyQuests } from '../../features/joueur/constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';

/** Accueil Football Hub — données réelles, pas de stats inventées. */
export function PlayerFootballHubScreen() {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const nav = useTabNavigationActions();
  const hub = usePlayerHubData(profile);
  const [refreshing, setRefreshing] = useState(false);

  const identity = session?.identity;
  const accent = identity?.accent ?? '#4C8BFF';

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

  const progressApi = useJoueurProgress();
  const dailyDone = new Set(progressApi?.progress.dailyCompletedIds ?? []);

  const dailyQuest = useMemo(
    () => getJoueurDailyQuests(ageGroup === 'youth' ? 'youth' : ageGroup === 'teen' ? 'teen' : 'adult')[0],
    [ageGroup],
  );

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

  const avatarUri = profile.avatar_url;
  const nextDefiTitle = dailyQuest?.title ?? 'Connecte-toi chaque jour';
  const nextDefiProgress = dailyDone.has('daily-login') || hub.streakDays > 0 ? 1 : 0;
  const nextDefiMax = 1;

  const convocationSubtitle =
    hub.pendingConvocations.length > 0
      ? `${hub.pendingConvocations.length} convocation(s) en attente`
      : undefined;

  return (
    <JoueurScreenChrome variant="page" kicker="Football Hub" title={`Bonjour ${hub.firstName}`}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: TAB_BAR_CONTENT_INSET + 88 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <View style={styles.heroRow}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} accessibilityLabel="Photo profil" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <ProDayText variant="title" style={styles.avatarLetter}>
                {hub.firstName.charAt(0).toUpperCase()}
              </ProDayText>
            </View>
          )}
          <View style={styles.heroCopy}>
            <ProDayText variant="caption" style={styles.muted}>
              {hub.clubName ?? 'Sans club pour l’instant'}
            </ProDayText>
            <ProDayText variant="section" style={styles.heroTitle}>
              {identity?.title ?? 'Ton parcours'}
            </ProDayText>
            <PlayerProgressBar
              value={hub.profileCompletion}
              label={`Profil ${hub.profileCompletion}%`}
              accent={accent}
            />
          </View>
        </View>

        <JoueurSectionHeader title="Prochain événement" />
        {hub.loading ? (
          <ActivityIndicator color={accent} style={styles.inlineLoader} />
        ) : hub.nextEvent ? (
          <PlayerMatchCard
            event={hub.nextEvent}
            accent={accent}
            subtitle={convocationSubtitle}
            onPress={() => nav.openTeamEvent(hub.nextEvent!.id)}
          />
        ) : (
          <ProDayText variant="body" style={styles.empty}>
            Aucun match ou entraînement planifié. Consulte l’onglet Matchs ou ton équipe.
          </ProDayText>
        )}

        {hub.nextTraining && hub.nextTraining.id !== hub.nextEvent?.id ? (
          <>
            <JoueurSectionHeader title="Prochain entraînement" />
            <PlayerMatchCard
              event={hub.nextTraining}
              accent="#22C55E"
              onPress={() => nav.openTeamEvent(hub.nextTraining!.id)}
            />
          </>
        ) : null}

        <JoueurSectionHeader title="Ton prochain défi" />
        <PlayerChallengeCard
          title={nextDefiTitle}
          description={dailyQuest?.body}
          progress={nextDefiProgress}
          progressMax={nextDefiMax}
          progressLabel={`${nextDefiProgress}/${nextDefiMax}`}
          done={nextDefiProgress >= nextDefiMax}
          accent={accent}
          onPress={() => nav.setActiveTab('progression')}
        />

        <JoueurSectionHeader title="Ma forme" />
        <View style={styles.statRow}>
          <PlayerStatCard
            label="Forme"
            value={hub.formPercent != null ? `${hub.formPercent}%` : '—'}
            hint={
              hub.formPercent != null
                ? 'Basé sur ton dernier check wellness'
                : 'Pas encore de check-in wellness'
            }
            empty={hub.formPercent == null}
            accent={accent}
            onPress={() => nav.setActiveTab('feed')}
          />
          <PlayerStatCard
            label="Niveau"
            value={hub.level}
            hint={`OVR ${hub.ovr || '—'}`}
            accent={accent}
            onPress={() => nav.setActiveTab('progression')}
          />
        </View>

        <PlayerAIRecommendation
          title="Mon Coach IA"
          body="Entraînement, tactique, préparation match — avec tes vraies données."
          onPress={() => nav.openDashboard('tactics_coach')}
        />

        <JoueurSectionHeader title="Raccourcis" />
        <View style={styles.actions}>
          <JoueurCard variant="list" title="Matchs" subtitle="Calendrier & convocations" onPress={() => nav.setActiveTab('matchs')} />
          <JoueurCard variant="list" title="Performance" subtitle="Stats & forme" onPress={() => nav.setActiveTab('feed')} />
          <JoueurCard variant="list" title="Équipe" subtitle="Club & groupe" onPress={() => nav.setActiveTab('recrutement')} />
          <JoueurCard variant="list" title="Messages" subtitle="Chat équipe" onPress={() => nav.setActiveTab('messages')} />
          <JoueurCard variant="list" title="Reels" subtitle="Clips communauté" onPress={() => nav.setActiveTab('reels')} />
          <JoueurActionButton label="Entraînement IA" variant="secondary" onPress={() => nav.openDashboard('train')} />
        </View>
      </ScrollView>
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: JOUEUR_SITE.bg },
  scroll: { flex: 1 },
  pad: { padding: spacing.lg, gap: spacing.md },
  heroRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: JOUEUR_SITE.surface },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: JOUEUR_SITE.foreground },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroTitle: { color: JOUEUR_SITE.foreground },
  muted: { color: JOUEUR_SITE.muted },
  inlineLoader: { marginVertical: spacing.md },
  empty: { color: JOUEUR_SITE.muted, paddingVertical: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { gap: spacing.xs },
});
