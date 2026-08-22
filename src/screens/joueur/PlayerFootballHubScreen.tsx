import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  PlayerHubShortcutRow,
  PlayerMatchDayEmpty,
  PlayerMatchDayHero,
} from '../../components/joueur/PlayerMatchDayChrome';
import { PushScreenTransition } from '../../components/motion';
import { TrainHubScreen } from '../training/TrainHubScreen';
import { JoueurTacticsCoachScreen } from './JoueurTacticsCoachScreen';
import { screenScrollPad } from '../../navigation/screenLayout';
import { resolvePlayerShieldWidth } from '../../utils/playerShieldLayout';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { spacing } from '../../theme/designTokens';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { resolveJoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { getJoueurDailyQuests } from '../../features/joueur/constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { PlayerShieldCard } from '../../components/joueur/PlayerShieldCard';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  playerCanShowRsvp,
  type PlayerRsvpChoice,
} from '../../utils/amateurPlayerHome';

type HubOverlay = 'train' | 'train_ai' | 'train_coach' | 'tactics_coach' | null;

/** Accueil Football Hub — match day, RSVP réel, pas de stats inventées. */
export function PlayerFootballHubScreen() {
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const nav = useTabNavigationActions();
  const { pendingDashboardView, clearPendingDashboard, goBackTab, returnTab } = useTabNavigation();
  const hub = usePlayerHubData(profile);
  const [refreshing, setRefreshing] = useState(false);
  const [overlay, setOverlay] = useState<HubOverlay>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  useEffect(() => {
    if (!pendingDashboardView || !profile) return;
    if (pendingDashboardView === 'train') setOverlay('train');
    else if (pendingDashboardView === 'train_ai') setOverlay('train_ai');
    else if (pendingDashboardView === 'train_coach') setOverlay('train_coach');
    else if (pendingDashboardView === 'tactics_coach') setOverlay('tactics_coach');
    clearPendingDashboard();
  }, [pendingDashboardView, clearPendingDashboard, profile]);

  const playerTheme = usePlayerThemeColors();
  const accent = playerTheme.accent;
  const accentAlt = playerTheme.accentAlt;
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

  const closeDashboardOverlay = useCallback(() => {
    setOverlay(null);
    if (returnTab) goBackTab();
  }, [goBackTab, returnTab]);

  const trainInitialView =
    overlay === 'train_ai' ? 'ai' : overlay === 'train_coach' ? 'coach' : 'hub';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hub.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [hub]);

  const onRsvp = useCallback(
    async (choice: PlayerRsvpChoice) => {
      if (!profile || hub.dayPriority.kind === 'calm') return;
      const event = hub.dayPriority.event;
      setRsvpBusy(true);
      try {
        await teamEventsService.updateRsvp(event.id, profile.uid, choice);
        await hub.refresh();
      } catch (e) {
        Alert.alert(
          'Présence',
          e instanceof Error ? e.message : 'Impossible d’enregistrer la réponse.',
        );
      } finally {
        setRsvpBusy(false);
      }
    },
    [profile, hub],
  );

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

  const shieldWidth = resolvePlayerShieldWidth();
  const priority = hub.dayPriority;
  const heroEvent = priority.kind === 'calm' ? null : priority.event;
  const showRsvp = heroEvent ? playerCanShowRsvp(heroEvent, profile.uid) : false;
  const secondaryTraining =
    hub.nextTraining && hub.nextTraining.id !== heroEvent?.id ? hub.nextTraining : null;

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

          <PlayerHubShortcutRow
            accent={accent}
            items={[
              {
                id: 'matchs',
                label: 'Matchs',
                icon: 'trophy',
                onPress: () => nav.setActiveTab('matchs'),
              },
              {
                id: 'train',
                label: 'Train',
                icon: 'football',
                onPress: () => nav.openDashboard('train'),
              },
              {
                id: 'messages',
                label: 'Messages',
                icon: 'chat',
                onPress: () => nav.setActiveTab('messages'),
              },
              {
                id: 'equipe',
                label: 'Équipe',
                icon: 'people',
                onPress: () => nav.setActiveTab('recrutement'),
              },
            ]}
          />

          <JoueurSectionHeader
            title="Match day"
            subtitle={
              hub.pendingConvocations.length > 0
                ? `${hub.pendingConvocations.length} à confirmer`
                : undefined
            }
          />
          {hub.loading ? (
            <ActivityIndicator color={accent} style={styles.inlineLoader} />
          ) : priority.kind === 'calm' ? (
            <PlayerMatchDayEmpty
              accent={accent}
              onOpenMatchs={() => nav.setActiveTab('matchs')}
              onOpenTrain={() => nav.openDashboard('train')}
            />
          ) : (
            <PlayerMatchDayHero
              priority={priority}
              playerUid={profile.uid}
              accent={accent}
              busy={rsvpBusy}
              showRsvp={showRsvp}
              onOpen={() => {
                if (priority.kind === 'live') {
                  nav.openTeamEvent(priority.event.id);
                  return;
                }
                nav.openTeamEvent(priority.event.id);
              }}
              onChooseRsvp={(choice) => void onRsvp(choice)}
            />
          )}

          {secondaryTraining ? (
            <>
              <JoueurSectionHeader title="Prochain entraînement" />
              <PlayerMatchCard
                event={secondaryTraining}
                accent={accentAlt}
                onPress={() => nav.openTeamEvent(secondaryTraining.id)}
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

          <JoueurSectionHeader title="Plus" />
          <View style={styles.actions}>
            <JoueurCard
              variant="list"
              title="Calendrier matchs"
              subtitle="Convocations & résultats"
              onPress={() => nav.setActiveTab('matchs')}
            />
            <JoueurCard
              variant="list"
              title="S’entraîner"
              subtitle="Hub entraînement"
              onPress={() => nav.openDashboard('train')}
            />
            <JoueurCard
              variant="list"
              title="Messages"
              subtitle="Chat équipe"
              onPress={() => nav.setActiveTab('messages')}
            />
          </View>
        </ScrollView>
      </JoueurScreenChrome>

      <PushScreenTransition active={overlay === 'train' || overlay === 'train_ai' || overlay === 'train_coach'}>
        {overlay === 'train' || overlay === 'train_ai' || overlay === 'train_coach' ? (
          <TrainHubScreen
            onBack={closeDashboardOverlay}
            initialView={trainInitialView}
          />
        ) : null}
      </PushScreenTransition>

      <PushScreenTransition active={overlay === 'tactics_coach'}>
        {overlay === 'tactics_coach' ? (
          <JoueurTacticsCoachScreen onBack={closeDashboardOverlay} />
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
  inlineLoader: { marginVertical: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { gap: spacing.xs },
});
