import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { User } from '../../models/User';
import type { JoueurExperienceTheme } from '../../utils/joueurExperienceTheme';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon, type IconName } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { JoueurIdentityProvider } from '../../components/player/joueurPortalUi';
import { JoueurWorldScene } from './JoueurWorldScene';
import {
  getJoueurYouthChallenges,
  getJoueurDailyQuests,
  type JoueurDailyQuestDef,
} from './constants';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { JoueurArcadeShell, JoueurScorePop } from './JoueurGameFx';
import { joueurGamePress, joueurGameReward } from './joueurSfx';

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

type PathNode = {
  id: 'maison' | 'terrain' | 'match' | 'equipe' | 'tresor';
  icon: IconName;
  label: string;
  sub: string;
};

function pathFor(isGirl: boolean): PathNode[] {
  if (isGirl) {
    return [
      { id: 'maison', icon: 'home', label: 'Maison', sub: 'Défis doux' },
      { id: 'terrain', icon: 'star-four-points', label: 'Jardin', sub: 'Touches' },
      { id: 'match', icon: 'trophy', label: 'Match', sub: 'Calendrier' },
      { id: 'equipe', icon: 'heart', label: 'Amies', sub: 'Équipe' },
      { id: 'tresor', icon: 'bag', label: 'Trésor', sub: 'Butin' },
    ];
  }
  return [
    { id: 'maison', icon: 'home', label: 'Base', sub: 'Échauffe' },
    { id: 'terrain', icon: 'football', label: 'Terrain', sub: 'Jouer' },
    { id: 'match', icon: 'trophy', label: 'Match', sub: 'Calendrier' },
    { id: 'equipe', icon: 'people', label: 'Équipe', sub: 'Copains' },
    { id: 'tresor', icon: 'bag', label: 'Coffre', sub: 'Butin' },
  ];
}

function challengeIcon(id: string, isGirl: boolean): IconName {
  if (id === 'pied-faible') return isGirl ? 'star-four-points' : 'walk';
  if (id === 'dribbles') return 'football';
  if (id === 'passes') return 'handshake';
  if (id === 'vitesse') return 'walk';
  return 'star';
}

const DAILY_ICONS: IconName[] = ['star-four-points', 'football', 'calendar', 'person'];

function BounceOrb({
  children,
  color,
  size = 88,
}: {
  children: React.ReactNode;
  color: string;
  size?: number;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: 'rgba(255,255,255,0.85)',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Univers -13 — carte d’aventure / petit jeu.
 * Icônes vectorielles (pas d’emojis) pour éviter les « ??? » selon device.
 */
export function YouthUniverseScreen({
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
  const [activePath, setActivePath] = useState<PathNode['id']>('terrain');
  const isGirl = theme.gender === 'female';
  const challenges = getJoueurYouthChallenges(theme.gender);
  const dailyQuests = getJoueurDailyQuests('youth');
  const path = useMemo(() => pathFor(isGirl), [isGirl]);

  const stars = progressApi?.progress.stars ?? 0;
  const done = new Set(progressApi?.progress.completedChallengeIds ?? []);
  const dailyDone = progressApi?.progress.dailyCompletedIds ?? [];
  const level = progressApi?.level?.level ?? 1;
  const streak = progressApi?.progress.streakDays ?? 0;
  const xpInto = progressApi?.level?.xpIntoLevel ?? 0;
  const xpMax = progressApi?.level?.xpForNext ?? 100;
  const xpPct = Math.max(0, Math.min(1, xpInto / Math.max(1, xpMax)));
  const stampsDone = challenges.filter((c) => done.has(c.id)).length;

  const ink = identity.ink;
  const muted = identity.inkMuted;
  const accent = identity.accent;
  const firstName =
    profile.display_name?.trim().split(/\s+/)[0] || (isGirl ? 'Championne' : 'Champion');

  const mapW = Dimensions.get('window').width - spacing.md * 2;

  useEffect(() => {
    if (!progressApi?.ready) return;
    if (dailyDone.includes('daily-login')) return;
    void progressApi.claimDaily('daily-login', 15, 1).then((ok) => {
      if (ok) {
        setPop('+1 etoile');
        joueurGameReward('star');
        setTimeout(() => setPop(null), 900);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressApi?.ready]);

  const complete = async (id: string, starGain: number) => {
    const ok = await progressApi?.claimChallenge(id, starGain);
    if (!ok) return;
    joueurGameReward('star');
    setPop(`+${starGain}`);
    setTimeout(() => setPop(null), 900);
  };

  const onClaimDaily = async (quest: JoueurDailyQuestDef) => {
    const ok = await progressApi?.claimDaily(quest.id, quest.xp, quest.stars);
    if (ok) {
      joueurGameReward('xp');
      setPop(`+${quest.stars}`);
      setTimeout(() => setPop(null), 900);
    }
  };

  const openNode = (id: PathNode['id']) => {
    setActivePath(id);
    joueurGamePress();
    if (id === 'maison' || id === 'terrain') onOpenTrain();
    else if (id === 'match') onOpenMatchs();
    else if (id === 'equipe') onOpenClub();
    else onOpenPass();
  };

  const skyTop = isGirl ? '#FFF0F7' : '#FFF9E0';
  const skyMid = isGirl ? '#FBCFE8' : '#FDE68A';
  const ground = isGirl ? '#A7F3D0' : '#86EFAC';
  const mascotIcon: IconName = isGirl ? 'star-four-points' : 'football';
  const worldTitle = isGirl ? 'Île magique' : 'Terrain secret';

  return (
    <JoueurIdentityProvider identity={identity}>
      <JoueurArcadeShell identity={identity} liveLabel={worldTitle.toUpperCase()}>
        <JoueurScorePop text={pop ?? ''} color={accent} visible={Boolean(pop)} light />
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
          <View style={[styles.mapFrame, { borderColor: accent, width: mapW }]}>
            <LinearGradient
              colors={[skyTop, skyMid, ground]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.mapScene} pointerEvents="none">
              <JoueurWorldScene
                identity={identity}
                kind="pitch_playful"
                height={168}
                compact
                showBanner={false}
              />
            </View>

            <View style={styles.mapHud}>
              <View style={[styles.candyPill, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                <Icon name="star" size={16} color={accent} variant="filled" />
                <ProDayText variant="section" style={{ color: ink, fontWeight: '800', fontSize: 18 }}>
                  {stars}
                </ProDayText>
              </View>
              <View style={[styles.candyPill, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                <Icon name="time" size={15} color={accent} variant="filled" />
                <ProDayText variant="caption" style={{ color: ink, fontWeight: '800' }}>
                  {streak} j
                </ProDayText>
              </View>
            </View>

            <View style={styles.mapCenter}>
              <BounceOrb color={identity.soft} size={96}>
                <Icon name={mascotIcon} size={44} color={accent} variant="filled" />
              </BounceOrb>
              <View style={[styles.speech, { borderColor: accent }]}>
                <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                  {isGirl ? 'Salut' : 'Hey'} {firstName} !
                </ProDayText>
                <ProDayText
                  variant="section"
                  style={{ color: ink, fontWeight: '800', fontSize: 20, textAlign: 'center' }}
                >
                  {identity.title}
                </ProDayText>
              </View>
            </View>

            <View style={styles.xpWrap}>
              <View style={[styles.xpTrack, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                <View
                  style={[
                    styles.xpFill,
                    { width: `${Math.round(xpPct * 100)}%`, backgroundColor: accent },
                  ]}
                />
              </View>
              <ProDayText variant="caption" style={{ color: ink, fontWeight: '800' }}>
                Niveau {level} · {xpInto}/{xpMax} XP
              </ProDayText>
            </View>
          </View>

          <PressableSpring
            onPress={() => {
              joueurGamePress();
              onOpenTrain();
            }}
            scaleTo={0.96}
            haptic
            style={[styles.playBtn, { backgroundColor: accent }]}
          >
            <View style={styles.playIconWrap}>
              <Icon
                name={isGirl ? 'play' : 'football'}
                size={26}
                color="#fff"
                variant="filled"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText variant="section" style={styles.playBtnTitle}>
                {isGirl ? 'Jouer maintenant' : 'C’est parti !'}
              </ProDayText>
              <ProDayText variant="caption" style={styles.playBtnSub}>
                {isGirl ? 'Un défi maison tout doux' : 'Un mini-défi sur le terrain'}
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={22} color="#fff" />
          </PressableSpring>

          <ProDayText variant="section" style={[styles.blockTitle, { color: ink }]}>
            {isGirl ? 'Mon parcours' : 'Mon aventure'}
          </ProDayText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pathRow}
          >
            {path.map((node, i) => {
              const on = activePath === node.id;
              const unlocked = i <= Math.min(path.length - 1, Math.floor(level / 2) + 1);
              return (
                <View key={node.id} style={styles.pathItem}>
                  {i > 0 ? (
                    <View
                      style={[
                        styles.pathBridge,
                        { backgroundColor: unlocked ? accent : identity.border },
                      ]}
                    />
                  ) : null}
                  <PressableSpring
                    onPress={() => openNode(node.id)}
                    scaleTo={0.97}
                    haptic
                    style={[
                      styles.pathOrb,
                      {
                        borderColor: on ? accent : unlocked ? `${accent}88` : identity.border,
                        backgroundColor: on
                          ? identity.soft
                          : unlocked
                            ? identity.elevated
                            : 'rgba(255,255,255,0.45)',
                        opacity: unlocked ? 1 : 0.55,
                      },
                    ]}
                  >
                    <Icon
                      name={unlocked ? node.icon : 'lock'}
                      size={26}
                      color={on || unlocked ? accent : muted}
                      variant={on ? 'filled' : 'outline'}
                    />
                    <ProDayText
                      variant="caption"
                      style={{ color: ink, fontWeight: '800', textAlign: 'center' }}
                    >
                      {node.label}
                    </ProDayText>
                    <ProDayText
                      variant="caption"
                      style={{ color: muted, fontSize: 10, textAlign: 'center' }}
                    >
                      {node.sub}
                    </ProDayText>
                  </PressableSpring>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.album, { backgroundColor: identity.elevated, borderColor: accent }]}>
            <View style={styles.albumHead}>
              <ProDayText variant="section" style={{ color: ink, fontWeight: '800', fontSize: 18 }}>
                {isGirl ? 'Album d’étoiles' : 'Collection de défis'}
              </ProDayText>
              <View style={[styles.albumBadge, { backgroundColor: identity.soft }]}>
                <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                  {stampsDone}/{challenges.length}
                </ProDayText>
              </View>
            </View>
            <ProDayText variant="caption" style={{ color: muted, marginBottom: 8 }}>
              {isGirl
                ? 'Tape un tampon pour le réussir et gagner des étoiles.'
                : 'Coche un défi pour gagner des étoiles.'}
            </ProDayText>
            <View style={styles.stampGrid}>
              {challenges.map((c) => {
                const isDone = done.has(c.id);
                return (
                  <PressableSpring
                    key={c.id}
                    onPress={() => {
                      if (!isDone) void complete(c.id, c.xp);
                      else joueurGamePress();
                    }}
                    scaleTo={0.97}
                    haptic
                    style={[
                      styles.stampCard,
                      {
                        borderColor: isDone ? accent : identity.border,
                        backgroundColor: isDone ? identity.soft : '#fff',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.stampRing,
                        {
                          borderColor: isDone ? accent : `${accent}44`,
                          backgroundColor: isDone ? accent : 'transparent',
                        },
                      ]}
                    >
                      <Icon
                        name={isDone ? 'star' : challengeIcon(c.id, isGirl)}
                        size={24}
                        color={isDone ? '#fff' : accent}
                        variant="filled"
                      />
                    </View>
                    <ProDayText
                      variant="caption"
                      style={{
                        color: ink,
                        fontWeight: '800',
                        textAlign: 'center',
                        fontSize: 12,
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {c.title}
                    </ProDayText>
                    <ProDayText
                      variant="caption"
                      style={{
                        color: muted,
                        textAlign: 'center',
                        fontSize: 10,
                        lineHeight: 14,
                      }}
                    >
                      {isDone ? 'Reussi !' : `+${c.xp}`}
                    </ProDayText>
                  </PressableSpring>
                );
              })}
            </View>
          </View>

          <ProDayText variant="section" style={[styles.blockTitle, { color: ink }]}>
            {isGirl ? 'Missions du jour' : 'Missions du jour'}
          </ProDayText>
          <View style={styles.stickerCol}>
            {dailyQuests.map((q, idx) => {
              const claimed = dailyDone.includes(q.id);
              const icon = DAILY_ICONS[idx] ?? 'star';
              return (
                <PressableSpring
                  key={q.id}
                  disabled={claimed}
                  onPress={() => {
                    if (claimed) return;
                    joueurGamePress();
                    if (q.tabHint === 'matchs') onOpenMatchs();
                    else if (q.tabHint === 'profil') nav.setActiveTab('profil');
                    else if (q.tabHint === 'home') onOpenTrain();
                    void onClaimDaily(q);
                  }}
                  scaleTo={0.97}
                  style={[
                    styles.sticker,
                    {
                      backgroundColor: claimed ? identity.soft : identity.elevated,
                      borderColor: claimed ? `${accent}66` : accent,
                    },
                  ]}
                >
                  <View style={[styles.stickerIcon, { backgroundColor: '#fff' }]}>
                    <Icon
                      name={claimed ? 'checkmark-circle' : icon}
                      size={22}
                      color={accent}
                      variant="filled"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText
                      variant="section"
                      style={{ color: ink, fontWeight: '800', fontSize: 15 }}
                    >
                      {q.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={{ color: muted }}>
                      {q.body}
                    </ProDayText>
                  </View>
                  <View style={[styles.stickerReward, { backgroundColor: accent }]}>
                    <ProDayText variant="caption" style={{ color: '#fff', fontWeight: '800' }}>
                      {claimed ? 'OK' : `+${q.stars}`}
                    </ProDayText>
                  </View>
                </PressableSpring>
              );
            })}
          </View>

          <View style={styles.helpRow}>
            <PressableSpring
              onPress={() => {
                joueurGamePress();
                onOpenCoach();
              }}
              scaleTo={0.96}
              style={[styles.helpCard, { backgroundColor: accent }]}
            >
              <Icon name="chat" size={22} color="#fff" variant="filled" />
              <ProDayText variant="caption" style={{ color: '#fff', fontWeight: '800' }}>
                {isGirl ? 'Coach' : 'Coach'}
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => {
                joueurGamePress();
                onOpenPass();
              }}
              scaleTo={0.96}
              style={[
                styles.helpCard,
                { backgroundColor: identity.elevated, borderColor: accent, borderWidth: 2 },
              ]}
            >
              <Icon name="bag" size={22} color={accent} variant="filled" />
              <ProDayText variant="caption" style={{ color: ink, fontWeight: '800' }}>
                {isGirl ? 'Trésor' : 'Butin'}
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => {
                joueurGamePress();
                onOpenClub();
              }}
              scaleTo={0.96}
              style={[
                styles.helpCard,
                { backgroundColor: identity.elevated, borderColor: accent, borderWidth: 2 },
              ]}
            >
              <Icon
                name={isGirl ? 'heart' : 'people'}
                size={22}
                color={accent}
                variant="filled"
              />
              <ProDayText variant="caption" style={{ color: ink, fontWeight: '800' }}>
                {isGirl ? 'Amies' : 'Équipe'}
              </ProDayText>
            </PressableSpring>
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
    paddingTop: spacing.xl + 26,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: 14,
  },
  mapFrame: {
    alignSelf: 'center',
    borderRadius: 32,
    borderWidth: 3,
    overflow: 'hidden',
    minHeight: 300,
    paddingBottom: 14,
  },
  mapScene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    opacity: 0.55,
  },
  mapHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  candyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  mapCenter: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  speech: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    borderWidth: 2.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    maxWidth: '92%',
  },
  xpWrap: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  xpTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 999,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 28,
  },
  playIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  playBtnSub: { color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  blockTitle: {
    fontWeight: '800',
    fontSize: 18,
    marginTop: 4,
  },
  pathRow: {
    gap: 4,
    paddingVertical: 4,
    paddingRight: 12,
  },
  pathItem: {
    width: 92,
    alignItems: 'center',
    position: 'relative',
  },
  pathBridge: {
    position: 'absolute',
    left: -10,
    top: 36,
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  pathOrb: {
    width: 86,
    minHeight: 108,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  album: {
    borderRadius: 28,
    borderWidth: 2.5,
    padding: spacing.md,
  },
  albumHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  albumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stampCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 124,
    borderRadius: 24,
    borderWidth: 2.5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stampRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerCol: { gap: 10 },
  sticker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    borderWidth: 2.5,
  },
  stickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerReward: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  helpRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  helpCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 22,
  },
});
