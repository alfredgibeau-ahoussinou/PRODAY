import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import type { User } from '../../models/User';
import type { HealthSnapshot } from '../../core/types/health';
import type { JoueurExperienceTheme } from '../../utils/joueurExperienceTheme';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import {
  JoueurActionRow,
  JoueurIdentityProvider,
  JoueurXpBar,
} from '../../components/player/joueurPortalUi';
import { PlayerMaFormeCard } from '../../components/player/PlayerMaFormeCard';
import { ProDayFutCard } from '../../components/cards/ProDayFutCard';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { JoueurPricingStrip } from './JoueurPricingStrip';
import { JoueurDailyQuestBoard } from './JoueurDailyQuestBoard';
import { JoueurArcadeShell, JoueurScorePop } from './JoueurGameFx';
import { joueurGamePress } from './joueurSfx';
import { JOUEUR_SEASON_OBJECTIVES, getJoueurDailyQuests } from './constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import type { JoueurDailyQuestDef } from './constants';

type Actions = {
  onOpenTrain: () => void;
  onOpenPass: () => void;
  onOpenCoach: () => void;
  onOpenMatchs: () => void;
  onOpenClub: () => void;
  onOpenProfile?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

type Props = {
  profile: User;
  theme: JoueurExperienceTheme;
  identity: JoueurPageIdentity;
  health: HealthSnapshot;
} & Actions;

const PITCH = '#16A34A';

/** Hub joueur adulte — carte FUT épurée, palette claire. */
export function AdultUniverseScreen({
  profile,
  theme,
  identity,
  health,
  onOpenTrain,
  onOpenPass,
  onOpenCoach,
  onOpenMatchs,
  onOpenClub,
  onOpenProfile,
  onRefresh,
  refreshing,
}: Props) {
  const progressApi = useJoueurProgress();
  const nav = useTabNavigationActions();
  const [pop, setPop] = useState<string | null>(null);
  const isWoman = theme.gender === 'female';
  const card = useMemo(() => userToProDayCard(profile), [profile]);

  const level = progressApi?.level;
  const ovr = progressApi?.ovr ?? 60;
  const stars = progressApi?.progress.stars ?? 0;
  const streak = progressApi?.progress.streakDays ?? 0;
  const dailyDone = progressApi?.progress.dailyCompletedIds ?? [];
  const dailyQuests = getJoueurDailyQuests('adult');
  const seasonDone = new Set(progressApi?.progress.completedChallengeIds ?? []);

  const flash = (text: string) => {
    setPop(text);
    setTimeout(() => setPop(null), 900);
  };

  useEffect(() => {
    if (!progressApi?.ready) return;
    if (dailyDone.includes('daily-login')) return;
    void progressApi.claimDaily('daily-login', 15, 1).then((ok) => {
      if (ok) flash('+15 XP');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressApi?.ready]);

  const onClaimDaily = async (quest: JoueurDailyQuestDef) => {
    const ok = await progressApi?.claimDaily(quest.id, quest.xp, quest.stars);
    if (ok) flash(`+${quest.xp} XP`);
  };

  const onHintTab = (tab: NonNullable<JoueurDailyQuestDef['tabHint']>) => {
    if (tab === 'matchs') onOpenMatchs();
    else if (tab === 'profil') onOpenProfile?.() ?? nav.setActiveTab('profil');
    else if (tab === 'recrutement') onOpenClub();
    else if (tab === 'home') onOpenTrain();
    else if (tab === 'feed') nav.openDashboard('tactics_coach');
    else nav.setActiveTab(tab);
  };

  const claimSeason = async (id: string, xp: number, starsGain: number) => {
    if (seasonDone.has(id)) return;
    if (id === 'season-streak-3' && streak < 3) return;
    if (id === 'season-ovr-70' && ovr < 70) return;
    // challenge stocke l’id ; XP = stars*10 — on compense avec grantXp du delta
    const baseXp = starsGain * 10;
    const ok = await progressApi?.claimChallenge(id, starsGain);
    if (!ok) return;
    const extra = Math.max(0, xp - baseXp);
    if (extra > 0) await progressApi?.grantXp(extra);
    flash(`+${xp} XP`);
  };

  return (
    <JoueurIdentityProvider identity={identity}>
      <JoueurArcadeShell identity={identity} liveLabel="Accueil">
        <JoueurScorePop text={pop ?? ''} color={PITCH} visible={Boolean(pop)} />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={PITCH}
              />
            ) : undefined
          }
        >
          <ProDayText variant="title" style={styles.hero}>
            {identity.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.support}>
            {identity.support}
          </ProDayText>

          <View style={styles.hud}>
            <View style={styles.hudRow}>
              <ProDayText variant="caption" style={styles.hudStat}>
                Note {ovr}
              </ProDayText>
              <ProDayText variant="caption" style={styles.hudStatMuted}>
                Niv. {level?.level ?? 1}
              </ProDayText>
              <ProDayText variant="caption" style={styles.hudStatMuted}>
                Série {streak}j
              </ProDayText>
            </View>
            <JoueurXpBar
              label="XP"
              value={level?.xpIntoLevel ?? 0}
              max={level?.xpForNext ?? 100}
              color={PITCH}
            />
          </View>

          <View style={styles.cardStage}>
            <ProDayFutCard
              card={{ ...card, overall: ovr }}
              width={200}
              onAction={(action) => {
                if (action === 'view_club' || action === 'recruit') onOpenClub();
                if (action === 'invite') onOpenMatchs();
                if (action === 'message' && onOpenProfile) onOpenProfile();
              }}
            />
          </View>

          <JoueurDailyQuestBoard
            accent={PITCH}
            completedIds={dailyDone}
            quests={dailyQuests}
            title="Quêtes du jour"
            onClaim={onClaimDaily}
            onHintTab={onHintTab}
          />

          <ProDayText variant="section" style={styles.sectionTitle}>
            Objectifs saison
          </ProDayText>
          <View style={styles.seasonWrap}>
            {JOUEUR_SEASON_OBJECTIVES.map((obj) => {
              const locked =
                (obj.id === 'season-streak-3' && streak < 3) ||
                (obj.id === 'season-ovr-70' && ovr < 70);
              const done = seasonDone.has(obj.id);
              return (
                <PressableSpring
                  key={obj.id}
                  disabled={done || locked}
                  onPress={() => {
                    joueurGamePress();
                    void claimSeason(obj.id, obj.xp, obj.stars);
                  }}
                  scaleTo={0.98}
                  style={[
                    styles.seasonRow,
                    { opacity: done || locked ? 0.55 : 1 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={styles.tileTitle}>
                      {obj.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.tileSub}>
                      {obj.body}
                      {locked ? ' · verrouillé' : ''}
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={{ color: PITCH, fontWeight: '700' }}>
                    {done ? 'Pris' : `+${obj.xp}`}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          <View style={styles.tileGrid}>
            {(
              [
                {
                  t: isWoman ? 'Session' : 'S’entraîner',
                  s: '+XP session',
                  a: onOpenTrain,
                },
                {
                  t: 'Matchs',
                  s: isWoman ? 'Calendrier & live' : 'Matchs live',
                  a: onOpenMatchs,
                },
                {
                  t: isWoman ? 'Club' : 'Groupe',
                  s: isWoman ? 'Ton équipe' : 'Ton groupe',
                  a: onOpenClub,
                },
                {
                  t: 'Carte',
                  s: 'Passeport',
                  a: () => onOpenProfile?.() ?? nav.setActiveTab('profil'),
                },
              ] as const
            ).map((tile) => (
              <PressableSpring
                key={tile.t}
                onPress={() => {
                  joueurGamePress();
                  tile.a();
                }}
                scaleTo={0.98}
                haptic
                style={styles.tile}
              >
                <ProDayText variant="section" style={styles.tileTitle}>
                  {tile.t}
                </ProDayText>
                <ProDayText variant="caption" style={styles.tileSub}>
                  {tile.s}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>

          <PlayerMaFormeCard
            uid={profile.uid}
            displayName={profile.display_name}
            health={health}
            ageGroup="adult"
            accent={PITCH}
            onOpenTraining={onOpenTrain}
          />

          <JoueurActionRow
            primary="Coach humain"
            onPrimary={onOpenCoach}
            secondary="Pass IA"
            onSecondary={onOpenPass}
          />

          <JoueurPricingStrip
            accent={PITCH}
            onOpenPass={onOpenPass}
            onOpenCoach={onOpenCoach}
            onOpenFree={onOpenClub}
          />
        </ScrollView>
      </JoueurArcadeShell>
    </JoueurIdentityProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 8,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  hero: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  support: {
    color: '#64748B',
    lineHeight: 20,
    fontSize: 14,
  },
  hud: {
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  hudRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  hudStat: { color: PITCH, fontWeight: '700', fontSize: 12 },
  hudStatMuted: { color: '#64748B', fontWeight: '600', fontSize: 11 },
  cardStage: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  seasonWrap: { gap: 8 },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 2,
  },
  tileTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  tileSub: { color: '#64748B', fontSize: 12 },
});
