import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePlayerHubData } from '../../hooks/usePlayerHubData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import {
  JoueurSectionHeader,
  PlayerMatchCard,
  PlayerStatCard,
  PlayerChallengeCard,
  PlayerProgressBar,
  JoueurCard,
} from '../../components/joueur';
import { ProDayText } from '../../components/ui/ProDayText';
import { PushScreenTransition } from '../../components/motion';
import { TrainHubScreen } from '../training/TrainHubScreen';
import { JoueurTacticsCoachScreen } from './JoueurTacticsCoachScreen';
import { screenScrollPad } from '../../navigation/screenLayout';
import { resolvePlayerShieldWidth } from '../../utils/playerShieldLayout';
import { spacing } from '../../theme/designTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { getJoueurDailyQuests } from '../../features/joueur/constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { PlayerShieldCard } from '../../components/joueur/PlayerShieldCard';
import { userToProDayCard } from '../../utils/prodayFutCard';

type HubOverlay = 'train' | 'train_ai' | 'tactics_coach' | null;

/** Accueil Football Hub — données réelles, pas de stats inventées. */
export function PlayerFootballHubScreen() {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const nav = useTabNavigationActions();
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const hub = usePlayerHubData(profile);
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<HubOverlay>(null);

  useEffect(() => {
    if (!pendingDashboardView || !profile) return;
    if (pendingDashboardView === 'train') setOverlay('train');
    else if (pendingDashboardView === 'train_ai') setOverlay('train_ai');
    else if (pendingDashboardView === 'tactics_coach') setOverlay('tactics_coach');
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard, profile]);

  const accent = PLAYER_DARK.accent;
  const progressApi = useJoueurProgress();

  const shieldCard = useMemo(() => {
    if (!profile) return null;
    const card = userToProDayCard(profile, { clubName: hub.clubName ?? undefined });
    const ovr = progressApi?.ovr ?? card.overall;
    return {
      displayName: profile.display_name,
      position: profile.profile.position,
      photoUrl: profile.avatar_url,
      clubName: hub.clubName ?? card.clubName,
      stats: {
        matches: card.matches,
        notes: card.formPct > 0 ? card.formPct / 10 : null,
        goals: card.goals,
        assists: card.assists,
        rating: ovr > 0 ? ovr / 10 : null,
      },
    };
  }, [profile, hub.clubName, progressApi?.ovr]);

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

  const nextDefiTitle = dailyQuest?.title ?? 'Connecte-toi chaque jour';
  const nextDefiProgress = dailyDone.has('daily-login') || hub.streakDays > 0 ? 1 : 0;
  const nextDefiMax = 1;

  const convocationSubtitle =
    hub.pendingConvocations.length > 0
      ? `${hub.pendingConvocations.length} convocation(s) en attente`
      : undefined;

  const shieldWidth = resolvePlayerShieldWidth();

  return (
    <>
      <JoueurScreenChrome variant="page" kicker="Parcours" title={`Bonjour ${hub.firstName}`}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.pad, screenScrollPad(spacing.xl + spacing.md)]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
          }
        >
          {shieldCard ? (
            <View style={styles.shieldWrap}>
              <PlayerShieldCard
                displayName={shieldCard.displayName}
                position={shieldCard.position}
                photoUrl={shieldCard.photoUrl}
                clubName={shieldCard.clubName}
                stats={shieldCard.stats}
                width={shieldWidth}
                onPress={() => nav.setActiveTab('profil')}
              />
              <PlayerProgressBar
                value={hub.profileCompletion}
                label={`Profil ${hub.profileCompletion}%`}
                accent={accent}
                style={[styles.profileBar, { width: shieldWidth }]}
              />
            </View>
          ) : null}

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
            onPress={() => nav.setActiveTab('feed')}
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
              onPress={() => nav.setActiveTab('feed')}
            />
          </View>

          <JoueurSectionHeader title="Raccourcis" />
          <View style={styles.actions}>
            <JoueurCard variant="list" title="Matchs" subtitle="Calendrier & convocations" onPress={() => nav.setActiveTab('matchs')} />
            <JoueurCard variant="list" title="Messages" subtitle="Chat équipe" onPress={() => nav.setActiveTab('messages')} />
            <JoueurCard variant="list" title="Entraînement IA" subtitle="Programme personnalisé" onPress={() => nav.openDashboard('train_ai')} />
            <JoueurCard variant="list" title="Équipe" subtitle="Club & groupe" onPress={() => nav.setActiveTab('recrutement')} />
          </View>
        </ScrollView>
      </JoueurScreenChrome>

      <PushScreenTransition active={overlay === 'train' || overlay === 'train_ai'}>
        {overlay === 'train' || overlay === 'train_ai' ? (
          <TrainHubScreen
            onBack={() => setOverlay(null)}
            initialView={overlay === 'train_ai' ? 'ai' : 'hub'}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'tactics_coach'}>
        {overlay === 'tactics_coach' ? (
          <JoueurTacticsCoachScreen onBack={() => setOverlay(null)} />
        ) : null}
      </PushScreenTransition>
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PLAYER_DARK.bg },
  scroll: { flex: 1 },
  pad: { padding: spacing.lg, gap: spacing.md },
  shieldWrap: { alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm, width: '100%' },
  profileBar: { opacity: 0.85 },
  muted: { color: PLAYER_DARK.textMuted },
  inlineLoader: { marginVertical: spacing.md },
  empty: { color: PLAYER_DARK.textMuted, paddingVertical: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { gap: spacing.xs },
});
