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
  JoueurLevelBadge,
  JoueurXpBar,
} from '../../components/player/joueurPortalUi';
import {
  JOUEUR_COACH_PRICE,
  JOUEUR_PASS_PRICE,
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

function statsFor(isGirl: boolean) {
  return [
    { label: isGirl ? 'Technique' : 'Niveau', value: isGirl ? 15 : 14, max: 20 },
    { label: 'Finition', value: isGirl ? 64 : 62, max: 100 },
    { label: isGirl ? 'Relance' : 'Vitesse', value: isGirl ? 67 : 71, max: 100 },
    { label: isGirl ? 'Vision' : 'Duel', value: isGirl ? 70 : 58, max: 100 },
  ];
}

function pathSteps(isGirl: boolean) {
  return isGirl
    ? [
        { id: 'p1', label: 'Base', hint: 'Habitudes' },
        { id: 'p2', label: 'Style', hint: 'Touches' },
        { id: 'p3', label: 'Match', hint: 'Confiance' },
        { id: 'p4', label: 'Lead', hint: 'Capitaine' },
      ]
    : [
        { id: 'p1', label: 'Grind', hint: 'XP quotidien' },
        { id: 'p2', label: 'Rank', hint: 'Division' },
        { id: 'p3', label: 'Forme', hint: 'Série' },
        { id: 'p4', label: 'Elite', hint: 'Objectifs' },
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
  const accent = identity.accent;
  const isGirl = theme.gender === 'female';
  const STATS = statsFor(isGirl);
  const PATH = pathSteps(isGirl);
  const dailyQuests = getJoueurDailyQuests('teen');

  const beatIndex = progressApi?.progress.weekBeatIndex ?? 0;
  const level = progressApi?.level;
  const xp = progressApi?.progress.xp ?? 0;
  const dailyDone = progressApi?.progress.dailyCompletedIds ?? [];
  const streak = progressApi?.progress.streakDays ?? 0;
  const seasonDone = new Set(progressApi?.progress.completedChallengeIds ?? []);
  const beat = theme.weekBeats[beatIndex % theme.weekBeats.length] ?? theme.weekBeats[0]!;
  const pathActive = Math.min(PATH.length - 1, Math.floor((level?.level ?? 1) / 3));

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
      <JoueurArcadeShell identity={identity} liveLabel={isGirl ? 'QG FILLE' : 'QG GARÇON'}>
        <JoueurScorePop text={pop ?? ''} color={accent} visible={Boolean(pop)} />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.pad}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={accent}
              />
            ) : undefined
          }
        >
          <ProDayText variant="caption" style={[styles.eyebrow, { color: accent }]}>
            {identity.worldTag} · DIV {Math.min(10, level?.level ?? 1)}
          </ProDayText>

          {/* Header calme */}
          <View style={[styles.hqCard, { borderColor: `${accent}44`, backgroundColor: identity.surface }]}>
            <View style={styles.hqTop}>
              <JoueurLevelBadge level={level?.level ?? 1} label="DIV" />
              <View style={{ flex: 1 }}>
                <ProDayText variant="title" style={styles.hero}>
                  {identity.title}
                </ProDayText>
                <ProDayText variant="caption" style={styles.support}>
                  {identity.support}
                </ProDayText>
              </View>
            </View>

            <JoueurXpBar
              label={isGirl ? 'Progression' : 'XP niveau'}
              value={level?.xpIntoLevel ?? 0}
              max={level?.xpForNext ?? 100}
              color={accent}
            />

            <View style={styles.metaRow}>
              <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                {xp} XP
              </ProDayText>
              <ProDayText variant="caption" style={styles.support}>
                ·
              </ProDayText>
              <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                ★ {progressApi?.progress.stars ?? 0}
              </ProDayText>
              <ProDayText variant="caption" style={styles.support}>
                ·
              </ProDayText>
              <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                série {streak}j
              </ProDayText>
            </View>
          </View>

          {/* Chemin de carrière — calme, linéaire */}
          <ProDayText variant="caption" style={[styles.pathLabel, { color: accent }]}>
            {isGirl ? 'PARCOURS JOUEUSE' : 'PARCOURS JOUEUR'}
          </ProDayText>
          <View style={styles.pathRow}>
            {PATH.map((step, i) => {
              const active = i <= pathActive;
              return (
                <View key={step.id} style={styles.pathStepWrap}>
                  <View
                    style={[
                      styles.pathDot,
                      {
                        borderColor: accent,
                        backgroundColor: active ? accent : 'transparent',
                      },
                    ]}
                  />
                  {i < PATH.length - 1 ? (
                    <View
                      style={[
                        styles.pathLine,
                        { backgroundColor: i < pathActive ? accent : identity.border },
                      ]}
                    />
                  ) : null}
                  <ProDayText
                    variant="caption"
                    style={{
                      color: active ? identity.ink : identity.inkMuted,
                      fontWeight: '800',
                      fontSize: 10,
                      marginTop: 6,
                    }}
                  >
                    {step.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={{ color: identity.inkMuted, fontSize: 9 }}>
                    {step.hint}
                  </ProDayText>
                </View>
              );
            })}
          </View>

          {/* Stats compactes */}
          <View style={[styles.statsCard, { borderColor: identity.border, backgroundColor: identity.surface }]}>
            {STATS.map((s) => (
              <JoueurXpBar
                key={s.label}
                label={s.label}
                value={s.label === 'Niveau' || s.label === 'Technique' ? Math.min(20, level?.level ?? s.value) : s.value}
                max={s.max}
                color={accent}
              />
            ))}
            <JoueurActionRow
              primary={isGirl ? 'Session douce' : 'Session classée'}
              onPrimary={onOpenTrain}
              secondary={isGirl ? 'Pass' : 'Boutique'}
              onSecondary={onOpenPass}
            />
          </View>

          {/* Missions du jour — liste sobre */}
          <ProDayText variant="caption" style={[styles.pathLabel, { color: accent }]}>
            {isGirl ? 'MISSIONS DU JOUR' : 'OBJECTIFS DU JOUR'}
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
                      borderColor: claimed ? `${accent}33` : identity.border,
                      backgroundColor: identity.surface,
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
                  <ProDayText variant="caption" style={{ color: accent, fontWeight: '900' }}>
                    {claimed ? 'OK' : `+${q.xp}`}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Objectifs classés */}
          <ProDayText variant="caption" style={[styles.pathLabel, { color: accent }]}>
            {isGirl ? 'PALIERS CARRIÈRE' : 'OBJECTIFS CLASSÉS'}
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
                    {
                      borderColor: doneObj ? `${accent}44` : identity.border,
                      backgroundColor: identity.surface,
                      opacity: doneObj || locked ? 0.5 : 1,
                    },
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
                  <ProDayText variant="caption" style={{ color: accent, fontWeight: '900' }}>
                    {doneObj ? 'OK' : `+${obj.xp}`}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Mission semaine */}
          <View style={[styles.weekCard, { borderColor: `${accent}55`, backgroundColor: identity.soft }]}>
            <ProDayText variant="caption" style={{ color: accent, fontWeight: '900', letterSpacing: 1.2 }}>
              {isGirl ? `FOCUS · ${beat.day}` : `MISSION · ${beat.day}`}
            </ProDayText>
            <ProDayText variant="section" style={{ color: identity.ink, fontWeight: '800', marginTop: 4 }}>
              {beat.title}
            </ProDayText>
            <ProDayText variant="caption" style={[styles.support, { marginTop: 2 }]}>
              {beat.body}
            </ProDayText>
            <PressableSpring
              onPress={() => void nextMission()}
              scaleTo={0.97}
              haptic
              style={[styles.missionBtn, { borderColor: accent }]}
            >
              <ProDayText variant="caption" style={{ color: identity.ink, fontWeight: '900' }}>
                {isGirl ? 'Continuer (+25 XP)' : 'Mission suivante (+25 XP)'}
              </ProDayText>
            </PressableSpring>

            <View style={styles.priceRow}>
              <PressableSpring onPress={onOpenPass} style={[styles.priceChip, { borderColor: identity.border }]}>
                <ProDayText variant="caption" style={styles.chipLabel}>
                  Pass IA
                </ProDayText>
                <ProDayText variant="section" style={styles.chipValue}>
                  {JOUEUR_PASS_PRICE}/mois
                </ProDayText>
              </PressableSpring>
              <PressableSpring onPress={onOpenCoach} style={[styles.priceChip, { borderColor: identity.border }]}>
                <ProDayText variant="caption" style={styles.chipLabel}>
                  Coach
                </ProDayText>
                <ProDayText variant="section" style={styles.chipValue}>
                  {JOUEUR_COACH_PRICE}/h
                </ProDayText>
              </PressableSpring>
            </View>

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
  eyebrow: {
    fontWeight: '800',
    letterSpacing: 1.4,
    fontSize: 10,
  },
  hqCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    gap: 10,
  },
  hqTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  hero: {
    color: '#E8F1F8',
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.4,
  },
  support: { color: 'rgba(186, 210, 228, 0.72)', lineHeight: 17 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pathLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginTop: 4,
  },
  pathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  pathStepWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  pathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    zIndex: 2,
  },
  pathLine: {
    position: 'absolute',
    top: 6,
    left: '55%',
    right: '-45%',
    height: 2,
    zIndex: 1,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: 10,
  },
  missionList: { gap: 8 },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  weekCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: 8,
  },
  missionBtn: {
    marginTop: 4,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  priceRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  priceChip: {
    flex: 1,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 2,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  chipLabel: { color: 'rgba(186, 210, 228, 0.72)', fontSize: 10, fontWeight: '700' },
  chipValue: { color: '#E8F1F8', fontWeight: '900', fontSize: 14 },
});
