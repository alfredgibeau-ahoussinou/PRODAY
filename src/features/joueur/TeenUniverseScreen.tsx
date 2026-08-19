import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import type { User } from '../../models/User';
import type { JoueurExperienceTheme } from '../../utils/joueurExperienceTheme';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import {
  JoueurActionRow,
  JoueurIdentityProvider,
  JoueurXpBar,
} from '../../components/player/joueurPortalUi';
import {
  getJoueurDailyQuests,
  JOUEUR_RANKED_OBJECTIVES,
  type JoueurDailyQuestDef,
} from './constants';
import { advanceJoueurWeekBeat } from '../../utils/joueurUniverseProgress';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { JoueurArcadeShell, JoueurScorePop } from './JoueurGameFx';
import { joueurGameReward, joueurGamePress } from './joueurSfx';

type Actions = {
  onOpenTrain: () => void;
  onOpenPass: () => void;
  onOpenCoach: () => void;
  onOpenMatchs: () => void;
  onOpenClub: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

type Props = {
  profile: User;
  theme: JoueurExperienceTheme;
  identity: JoueurPageIdentity;
} & Actions;

const PITCH = '#16A34A';

function statsFor(isGirl: boolean) {
  return [
    { label: isGirl ? 'Technique' : 'Niveau', value: isGirl ? 15 : 14, max: 20 },
    { label: isGirl ? 'Vision' : 'Duel', value: isGirl ? 70 : 58, max: 100 },
  ];
}

/**
 * Univers 13–17 : carrière calme, style jeu vidéo soft.
 * Fille = QG violet posé · Garçon = QG cyan steel — pas d’arcade enfantine.
 */
export function TeenUniverseScreen({
  profile,
  theme,
  identity,
  onOpenTrain,
  onOpenPass,
  onOpenCoach,
  onOpenMatchs,
  onOpenClub,
  onRefresh,
  refreshing,
}: Props) {
  const progressApi = useJoueurProgress();
  const nav = useTabNavigationActions();
  const [pop, setPop] = useState<string | null>(null);
  const isGirl = theme.gender === 'female';
  const STATS = statsFor(isGirl);
  const dailyQuests = getJoueurDailyQuests('teen');

  const beatIndex = progressApi?.progress.weekBeatIndex ?? 0;
  const level = progressApi?.level;
  const dailyDone = progressApi?.progress.dailyCompletedIds ?? [];
  const streak = progressApi?.progress.streakDays ?? 0;
  const seasonDone = new Set(progressApi?.progress.completedChallengeIds ?? []);
  const beat = theme.weekBeats[beatIndex % theme.weekBeats.length] ?? theme.weekBeats[0]!;

  useEffect(() => {
    if (!progressApi?.ready) return;
    if (dailyDone.includes('daily-login')) return;
    void progressApi.claimDaily('daily-login', 15, 1).then((ok) => {
      if (ok) {
        setPop('+15 XP');
        setTimeout(() => setPop(null), 900);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressApi?.ready]);

  const nextMission = async () => {
    await advanceJoueurWeekBeat(profile.uid, theme.weekBeats.length, 25);
    await progressApi?.refresh();
    joueurGameReward('xp');
    setPop('+25 XP');
    setTimeout(() => setPop(null), 900);
  };

  const onClaimDaily = async (quest: JoueurDailyQuestDef) => {
    const ok = await progressApi?.claimDaily(quest.id, quest.xp, quest.stars);
    if (ok) {
      setPop(`+${quest.xp} XP`);
      setTimeout(() => setPop(null), 900);
    }
  };

  return (
    <JoueurIdentityProvider identity={identity}>
      <JoueurArcadeShell identity={identity} liveLabel="Accueil">
        <JoueurScorePop text={pop ?? ''} color={PITCH} visible={Boolean(pop)} />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.pad}
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
          <View style={styles.hqCard}>
            <ProDayText variant="title" style={styles.hero}>
              {identity.title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.support}>
              {identity.support}
            </ProDayText>

            <JoueurXpBar
              label={isGirl ? 'Progression' : 'XP niveau'}
              value={level?.xpIntoLevel ?? 0}
              max={level?.xpForNext ?? 100}
              color={PITCH}
            />

            <View style={styles.metaRow}>
              <ProDayText variant="caption" style={styles.metaValue}>
                Niv. {level?.level ?? 1}
              </ProDayText>
              <ProDayText variant="caption" style={styles.support}>
                ·
              </ProDayText>
              <ProDayText variant="caption" style={styles.metaValue}>
                ★ {progressApi?.progress.stars ?? 0}
              </ProDayText>
              <ProDayText variant="caption" style={styles.support}>
                ·
              </ProDayText>
              <ProDayText variant="caption" style={styles.metaValue}>
                série {streak}j
              </ProDayText>
            </View>
          </View>

          <View style={styles.statsCard}>
            {STATS.map((s) => (
              <JoueurXpBar
                key={s.label}
                label={s.label}
                value={s.label === 'Niveau' || s.label === 'Technique' ? Math.min(20, level?.level ?? 1) : s.value}
                max={s.max}
                color={PITCH}
              />
            ))}
            <JoueurActionRow
              primary={isGirl ? 'Session douce' : 'Session'}
              onPrimary={onOpenTrain}
              secondary={isGirl ? 'Pass' : 'Pass'}
              onSecondary={onOpenPass}
            />
          </View>

          <ProDayText variant="section" style={styles.sectionTitle}>
            {isGirl ? 'Missions du jour' : 'Objectifs du jour'}
          </ProDayText>
          <View style={styles.missionList}>
            {dailyQuests.map((q) => {
              const claimed = dailyDone.includes(q.id);
              return (
                <PressableSpring
                  key={q.id}
                  disabled={claimed}
                  onPress={() => {
                    if (claimed) return;
                    joueurGamePress();
                    if (q.tabHint === 'matchs') onOpenMatchs();
                    else if (q.tabHint === 'recrutement') onOpenClub();
                    else if (q.tabHint === 'profil') nav.setActiveTab('profil');
                    else if (q.tabHint === 'feed') nav.openDashboard('tactics_coach');
                    else if (q.tabHint === 'home') onOpenTrain();
                    void onClaimDaily(q);
                  }}
                  scaleTo={0.98}
                  style={[
                    styles.missionRow,
                    {
                      opacity: claimed ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={{ color: identity.ink, fontWeight: '700', fontSize: 14 }}>
                      {claimed ? '✓ ' : ''}
                      {q.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.support}>
                      {q.body}
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={{ color: PITCH, fontWeight: '700' }}>
                    {claimed ? 'OK' : `+${q.xp}`}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Objectifs saison */}
          <ProDayText variant="section" style={styles.sectionTitle}>
            {isGirl ? 'Paliers carrière' : 'Objectifs saison'}
          </ProDayText>
          <View style={styles.missionList}>
            {JOUEUR_RANKED_OBJECTIVES.map((obj) => {
              const locked = obj.id === 'ranked-streak-2' && streak < 2;
              const doneObj = seasonDone.has(obj.id);
              return (
                <PressableSpring
                  key={obj.id}
                  disabled={doneObj || locked}
                  onPress={() => {
                    if (doneObj || locked) return;
                    void progressApi?.claimChallenge(obj.id, obj.stars).then((ok) => {
                      if (ok) {
                        void progressApi.grantXp(Math.max(0, obj.xp - obj.stars * 10));
                        setPop(`+${obj.xp} XP`);
                        setTimeout(() => setPop(null), 900);
                      }
                    });
                  }}
                  scaleTo={0.98}
                  style={[
                    styles.missionRow,
                    { opacity: doneObj || locked ? 0.5 : 1 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={{ color: identity.ink, fontWeight: '700', fontSize: 14 }}>
                      {obj.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.support}>
                      {obj.body}
                      {locked ? ' · verrouillé' : ''}
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={{ color: PITCH, fontWeight: '700' }}>
                    {doneObj ? 'OK' : `+${obj.xp}`}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Mission semaine */}
          <View style={styles.weekCard}>
            <ProDayText variant="caption" style={styles.weekKicker}>
              {isGirl ? `Focus · ${beat.day}` : `Mission · ${beat.day}`}
            </ProDayText>
            <ProDayText variant="section" style={styles.weekTitle}>
              {beat.title}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.support, { marginTop: 2 }]}>
              {beat.body}
            </ProDayText>
            <PressableSpring
              onPress={() => void nextMission()}
              scaleTo={0.98}
              haptic
              style={styles.missionBtn}
            >
              <ProDayText variant="caption" style={styles.missionBtnText}>
                {isGirl ? 'Continuer (+25 XP)' : 'Mission suivante (+25 XP)'}
              </ProDayText>
            </PressableSpring>

            <JoueurActionRow
              primary="Matchs"
              onPrimary={onOpenMatchs}
              secondary={isGirl ? 'Groupe' : 'Équipe'}
              onSecondary={onOpenClub}
            />
          </View>
        </ScrollView>
      </JoueurArcadeShell>
    </JoueurIdentityProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 24,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  hqCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.2,
  },
  support: { color: '#64748B', lineHeight: 17 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaValue: { color: '#0F172A', fontWeight: '600', fontSize: 12 },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
  statsCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  missionList: { gap: 8 },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  weekCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  weekKicker: { color: '#64748B', fontWeight: '600', fontSize: 11 },
  weekTitle: { color: '#0F172A', fontWeight: '700', marginTop: 4 },
  missionBtn: {
    marginTop: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  missionBtnText: { color: PITCH, fontWeight: '700' },
});
