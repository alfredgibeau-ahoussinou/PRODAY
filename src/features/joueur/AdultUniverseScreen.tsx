import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import type { User } from '../../models/User';
import type { HealthSnapshot } from '../../core/types/health';
import type { JoueurExperienceTheme } from '../../utils/joueurExperienceTheme';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { FUT18_PREMIUM } from '../../theme/fut18PremiumPalette';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import {
  JoueurActionRow,
  JoueurIdentityProvider,
  JoueurLevelBadge,
  JoueurXpBar,
} from '../../components/player/joueurPortalUi';
import { PlayerMaFormeCard } from '../../components/player/PlayerMaFormeCard';
import { PlayerCardReveal } from '../../components/joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import { JoueurWorldScene } from './JoueurWorldScene';
import { JoueurPricingStrip } from './JoueurPricingStrip';
import { JoueurDailyQuestBoard } from './JoueurDailyQuestBoard';
import { JoueurAttributeRadar } from './JoueurAttributeRadar';
import { JoueurArcadeShell, JoueurScorePop } from './JoueurGameFx';

import { joueurGamePress } from './joueurSfx';
import { JOUEUR_SEASON_OBJECTIVES, getJoueurDailyQuests } from './constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import type { JoueurDailyQuestDef } from './constants';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';

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

/** Hub Ultimate — boucle de jeu (XP, quêtes, carte FUT, forme). */
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
  const joueurTheme = useJoueurTheme();
  const accent = joueurTheme.accent;
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
      <JoueurArcadeShell identity={identity} liveLabel="PRO">
        <JoueurScorePop text={pop ?? ''} color={JOUEUR_SITE.xp} visible={Boolean(pop)} />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
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
          <ProDayText variant="caption" style={[styles.switchLabel, { color: JOUEUR_SITE.muted }]}>
            PRO · {identity.genderLabel}
            {isWoman ? ' · PERFORMANCE' : ' · MODE PRO'}
          </ProDayText>

          <ProDayText variant="caption" style={[styles.brand, { color: accent }]}>
            {identity.eyebrow} · {theme.copy.brand.toUpperCase()}
          </ProDayText>
          <ProDayText variant="title" style={styles.hero}>
            {identity.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.support}>
            {identity.support}
          </ProDayText>

          <View style={[styles.hud, { borderColor: accent }]}>
            <JoueurLevelBadge level={level?.level ?? 1} />
            <View style={styles.hudMid}>
              <View style={styles.hudRow}>
                <ProDayText variant="caption" style={[styles.hudStat, { color: accent }]}>
                  NOTE {ovr}
                </ProDayText>
                <ProDayText variant="caption" style={styles.hudStatMuted}>
                  ★ {stars}
                </ProDayText>
                <ProDayText variant="caption" style={styles.hudStatMuted}>
                  SÉRIE {streak}j
                </ProDayText>
              </View>
              <JoueurXpBar
                label="XP"
                value={level?.xpIntoLevel ?? 0}
                max={level?.xpForNext ?? 100}
                color={accent}
              />
            </View>
          </View>

          <View style={styles.cardStage}>
            <PlayerCardReveal
              card={{ ...card, overall: ovr }}
              width={240}
              onPress={() => onOpenProfile?.() ?? nav.setActiveTab('profil')}
            />
          </View>

          <View style={[styles.radarCard, { borderColor: `${accent}44`, backgroundColor: identity.surface }]}>
            <ProDayText variant="caption" style={[styles.brand, { color: accent, marginBottom: 8 }]}>
              RADAR DE PERFORMANCE (6 AXES)
            </ProDayText>
            <JoueurAttributeRadar
              attributes={{
                pace: Math.min(99, Math.max(50, ovr - 2 + (level?.level ?? 1))),
                shooting: Math.min(99, Math.max(45, ovr - 6 + (level?.level ?? 1))),
                passing: Math.min(99, Math.max(55, ovr + 1)),
                dribbling: Math.min(99, Math.max(52, ovr + (level?.level ?? 1))),
                defending: Math.min(99, Math.max(40, ovr - 8)),
                physical: Math.min(99, Math.max(50, ovr - 1)),
              }}
              size={220}
              accent={accent}
            />
          </View>


          <JoueurDailyQuestBoard
            accent={accent}
            completedIds={dailyDone}
            quests={dailyQuests}
            title="QUÊTES PRO"
            onClaim={onClaimDaily}
            onHintTab={onHintTab}
          />

          <View style={styles.seasonWrap}>
            <ProDayText variant="caption" style={[styles.brand, { color: accent }]}>
              OBJECTIFS SAISON
            </ProDayText>
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
                    {
                      borderColor: done ? `${accent}44` : JOUEUR_SITE.border,
                      opacity: done || locked ? 0.55 : 1,
                    },
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
                  <ProDayText variant="caption" style={{ color: accent, fontWeight: '900' }}>
                    {done ? 'PRIS' : `+${obj.xp}`}
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
                  icon: 'walk' as const,
                  a: onOpenTrain,
                },
                {
                  t: 'Matchs',
                  s: isWoman ? 'Calendrier & live' : 'Matchs live',
                  icon: 'football' as const,
                  a: onOpenMatchs,
                },
                {
                  t: isWoman ? 'Club' : 'Groupe',
                  s: isWoman ? 'Ton équipe' : 'Ton groupe',
                  icon: 'shield' as const,
                  a: onOpenClub,
                },
                {
                  t: 'Carte',
                  s: 'Passeport',
                  icon: 'person' as const,
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
                style={[styles.tile, { borderColor: `${accent}33` }]}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: `${accent}18` }]}>
                  <Icon name={tile.icon} size={18} color={accent} />
                </View>
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
            accent={accent}
            onOpenTraining={onOpenTrain}
          />

          <View style={styles.sceneWrap}>
            <JoueurWorldScene identity={identity} kind="pitch_data" height={180} />
          </View>

          <JoueurActionRow
            primary="Coach humain"
            onPrimary={onOpenCoach}
            secondary="Pass IA"
            onSecondary={onOpenPass}
          />

          <JoueurPricingStrip
            accent={accent}
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
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
  },
  switchLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
    fontSize: 13,
  },
  brand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.8,
    marginTop: 4,
  },
  hero: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '700',
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 38,
  },
  support: {
    color: JOUEUR_SITE.muted,
    lineHeight: 20,
    fontSize: 14,
    marginTop: -4,
  },
  hud: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: FUT18_PREMIUM.panelBg,
  },
  hudMid: { flex: 1, gap: 8 },
  hudRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  hudStat: { fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  hudStatMuted: { color: JOUEUR_SITE.muted, fontWeight: '800', fontSize: 11 },
  cardStage: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radarCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonWrap: { gap: 8 },

  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: FUT18_PREMIUM.panelBg,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: FUT18_PREMIUM.panelBg,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: 4,
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileTitle: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '800',
    fontSize: 15,
  },
  tileSub: { color: JOUEUR_SITE.muted, fontSize: 12 },
  sceneWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
});
