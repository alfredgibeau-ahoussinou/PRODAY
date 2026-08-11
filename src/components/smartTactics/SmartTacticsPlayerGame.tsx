import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { SmartPlayerCard } from './SmartPlayerCard';
import { SmartTacticsBoard } from './SmartTacticsBoard';
import { type SmartTacticsChapterProps } from './smartTacticsUi';
import { smartTacticsService } from '../../services/smartTactics.service';
import { tacticalShareService } from '../../services/matchTalk.service';
import { eventLineupToBoardSlots } from '../../utils/tacticalBoardSync';
import type { TacticalBoardSlot } from '../../models/SmartTactics';
import type { TacticalSharePayload } from '../../models/TacticalShare';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import {
  JoueurHudCorners,
  JoueurLevelBadge,
  JoueurXpBar,
} from '../player/joueurPortalUi';
import { JOUEUR_SITE, resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  joueurGameConfirm,
  joueurGamePress,
  playJoueurSfxFireAndForget,
} from '../../features/joueur/joueurSfx';
import { JoueurArcadeShell, JoueurScorePop as ArcadePop } from '../../features/joueur/JoueurGameFx';
import { SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS } from '../../content/smartTacticsChapters';
import type { SmartTacticsChapterId } from '../../content/smartTacticsChapters';
import { spacing } from '../../theme/designTokens';

function pickNextMatch(events: SmartTacticsChapterProps['events']) {
  return [...events]
    .filter(
      (e) =>
        (e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament') &&
        e.starts_at.getTime() >= Date.now() - 2 * 60 * 60 * 1000,
    )
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
}

function useAccent() {
  const session = useJoueurSession();
  return session?.identity.accent ?? '#2F7BFF';
}

function useIdentity() {
  const session = useJoueurSession();
  return (
    session?.identity ??
    resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'neutral' })
  );
}

/** Rail stages — gros tiles jeu, pas segment pro. */
export function SmartPlayerGameStageRail({
  active,
  onChange,
  cleared,
}: {
  active: SmartTacticsChapterId;
  onChange: (id: SmartTacticsChapterId) => void;
  cleared?: Partial<Record<SmartTacticsChapterId, boolean>>;
}) {
  const accent = useAccent();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={rail.row}
      style={rail.wrap}
    >
      {SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS.map((ch) => {
        const on = active === ch.id;
        const done = Boolean(cleared?.[ch.id]);
        return (
          <PressableSpring
            key={ch.id}
            onPress={() => {
              joueurGamePress();
              onChange(ch.id);
            }}
            scaleTo={0.94}
            haptic
            style={[
              rail.tile,
              {
                borderColor: on ? accent : JOUEUR_SITE.border,
                backgroundColor: on ? 'rgba(0,0,0,0.55)' : JOUEUR_SITE.panel,
              },
            ]}
          >
            <JoueurHudCorners color={on ? accent : JOUEUR_SITE.dim} size={10} thickness={2} />
            <View style={rail.tileTop}>
              <ProDayText variant="caption" style={[rail.step, { color: accent }]}>
                LV.{ch.step}
              </ProDayText>
              {done ? (
                <ProDayText variant="caption" style={{ color: JOUEUR_SITE.ok, fontWeight: '900' }}>
                  ★
                </ProDayText>
              ) : null}
            </View>
            <Icon name={ch.icon} size={18} color={on ? accent : JOUEUR_SITE.muted} />
            <ProDayText
              variant="caption"
              style={[rail.label, { color: on ? JOUEUR_SITE.foreground : JOUEUR_SITE.muted }]}
            >
              {ch.gameLabel}
            </ProDayText>
            <ProDayText variant="caption" style={rail.blurb} numberOfLines={1}>
              {ch.blurb}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
}

const rail = StyleSheet.create({
  wrap: { maxHeight: 108, flexGrow: 0 },
  row: {
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tile: {
    width: 112,
    minHeight: 96,
    padding: 12,
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 22,
    justifyContent: 'flex-end',
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  label: { fontSize: 13, fontWeight: '900', letterSpacing: 1.4 },
  blurb: { fontSize: 9, color: JOUEUR_SITE.dim, fontWeight: '700' },
});

function GamePageShell({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  const accent = useAccent();
  return (
    <ScrollView
      style={page.fill}
      contentContainerStyle={page.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.springify().damping(16)} style={page.head}>
        <ProDayText variant="caption" style={[page.kicker, { color: accent }]}>
          {kicker}
        </ProDayText>
        <ProDayText variant="title" style={page.title}>
          {title}
        </ProDayText>
      </Animated.View>
      {children}
    </ScrollView>
  );
}

const page = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  head: { gap: 2, marginTop: spacing.xs },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -0.6,
  },
});

/** QUEST — board de missions interactives. */
export function SmartPlayerQuestPage({
  profile,
  onOpenChapter,
  onCleared,
}: SmartTacticsChapterProps & { onCleared?: () => void }) {
  const accent = useAccent();
  const [items, setItems] = useState<TacticalSharePayload[]>([]);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [claimed, setClaimed] = useState(0);
  const [pop, setPop] = useState<string | null>(null);

  useEffect(() => {
    void tacticalShareService.listForPlayer(profile.uid).then(setItems);
  }, [profile.uid]);

  const demoQuests =
    items.length > 0
      ? items.slice(0, 6).map((it, i) => ({
          id: it.id,
          title: it.title,
          detail: it.note ?? it.phase_label ?? 'Consigne coach',
          xp: 40 + i * 15,
          rarity: i === 0 ? 'epic' : i === 1 ? 'rare' : 'common',
        }))
      : [
          {
            id: 'demo-press',
            title: 'Pressing haut',
            detail: 'Démo — dès que ton coach partage, les vraies quêtes apparaissent ici.',
            xp: 50,
            rarity: 'rare' as const,
          },
          {
            id: 'demo-build',
            title: 'Relance courte',
            detail: 'Garde le ballon bas · 2 touches max.',
            xp: 35,
            rarity: 'common' as const,
          },
          {
            id: 'demo-set',
            title: 'Coup de pied arrêté',
            detail: 'Place-toi sur le 2e poteau.',
            xp: 60,
            rarity: 'epic' as const,
          },
        ];

  const openQuest = (id: string, xp: number) => {
    if (opened[id]) return;
    joueurGameConfirm();
    playJoueurSfxFireAndForget('mission');
    setOpened((o) => ({ ...o, [id]: true }));
    setClaimed((c) => c + xp);
    setPop(`+${xp} XP`);
    onCleared?.();
    setTimeout(() => setPop(null), 900);
  };

  const rarityColor = (r: string) =>
    r === 'epic' ? '#C77DFF' : r === 'rare' ? accent : JOUEUR_SITE.ok;

  return (
    <GamePageShell kicker="ÉTAPE 01 · MISSIONS" title="TABLEAU QUÊTES">
      <ArcadePop text={pop ?? ''} color={JOUEUR_SITE.xp} visible={Boolean(pop)} />
      <View style={quest.hud}>
        <JoueurLevelBadge level={Math.max(1, Math.floor(claimed / 80) + 1)} label="QUÊTE" />
        <View style={{ flex: 1 }}>
          <JoueurXpBar label="XP MISSION" value={claimed % 100} max={100} color={JOUEUR_SITE.xp} />
          <ProDayText variant="caption" style={quest.hint}>
            Tape une mission pour la débloquer
          </ProDayText>
        </View>
      </View>

      {demoQuests.map((q, i) => {
        const isOpen = Boolean(opened[q.id]);
        const color = rarityColor(q.rarity);
        return (
          <Animated.View key={q.id} entering={FadeInRight.delay(i * 70).springify()}>
            <PressableSpring
              onPress={() => openQuest(q.id, q.xp)}
              scaleTo={0.97}
              haptic
              style={[
                quest.card,
                {
                  borderColor: isOpen ? JOUEUR_SITE.ok : color,
                  opacity: isOpen ? 0.85 : 1,
                },
              ]}
            >
              <JoueurHudCorners color={isOpen ? JOUEUR_SITE.ok : color} size={12} thickness={2} />
              <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'transparent']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={quest.cardTop}>
                <ProDayText variant="caption" style={[quest.rarity, { color }]}>
                  {q.rarity.toUpperCase()}
                </ProDayText>
                <ProDayText variant="caption" style={{ color: JOUEUR_SITE.xp, fontWeight: '900' }}>
                  +{q.xp} XP
                </ProDayText>
              </View>
              <ProDayText variant="section" style={quest.title}>
                {isOpen ? q.title : '███ █████ ?'}
              </ProDayText>
              <ProDayText variant="caption" style={quest.detail}>
                {isOpen ? q.detail : 'Appuie pour révéler la consigne'}
              </ProDayText>
              <View style={[quest.cta, { backgroundColor: isOpen ? JOUEUR_SITE.ok : color }]}>
                <ProDayText variant="caption" style={quest.ctaText}>
                  {isOpen ? 'PRIS ★' : 'ACCEPTER'}
                </ProDayText>
              </View>
            </PressableSpring>
          </Animated.View>
        );
      })}

      <PressableSpring
        onPress={() => {
          joueurGamePress();
          playJoueurSfxFireAndForget('whoosh');
          onOpenChapter('board');
        }}
        scaleTo={0.96}
        haptic
        style={[quest.next, { borderColor: accent }]}
      >
        <ProDayText variant="caption" style={[quest.nextText, { color: accent }]}>
          ÉTAPE SUIVANTE → TERRAIN
        </ProDayText>
      </PressableSpring>
    </GamePageShell>
  );
}

const quest = StyleSheet.create({
  hud: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  hint: { color: JOUEUR_SITE.muted, marginTop: 4, fontWeight: '700', fontSize: 10 },
  card: {
    padding: spacing.md,
    gap: 6,
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.elevated,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rarity: { fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: JOUEUR_SITE.foreground, fontWeight: '900', fontSize: 18 },
  detail: { color: JOUEUR_SITE.muted, fontWeight: '600', lineHeight: 18 },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaText: { color: '#05070C', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  next: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.panel,
  },
  nextText: { fontWeight: '900', letterSpacing: 1.4, fontSize: 12 },
});

/** PITCH — fog of war + reveal interactif. */
export function SmartPlayerPitchPage({
  profile,
  members,
  events,
  wellnessByUid,
  onCleared,
}: SmartTacticsChapterProps & { onCleared?: () => void }) {
  const accent = useAccent();
  const next = useMemo(() => pickNextMatch(events), [events]);
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const [revealed, setRevealed] = useState(false);
  const [focusUid, setFocusUid] = useState<string | null>(null);
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const glow = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const board = useMemo(() => {
    if (next?.lineup && next.lineup.slots.length > 0) {
      const mapped = eventLineupToBoardSlots(next.lineup);
      const used = new Set(next.lineup.slots.map((s) => s.uid));
      const pool: TacticalBoardSlot[] = members
        .filter((m) => !used.has(m.uid))
        .map((m) => ({
          uid: m.uid,
          display_name: m.display_name,
          role: 'sub' as const,
          position_label: m.profile.position,
        }));
      return {
        formation: mapped.formation || next.lineup.formation || '4-3-3',
        starters: mapped.starters,
        bench: mapped.bench,
        pool,
      };
    }
    return null;
  }, [next, members]);

  const mySlot = board
    ? board.starters.find((s) => s.uid === profile.uid) ??
      board.bench.find((s) => s.uid === profile.uid)
    : null;

  const reveal = () => {
    joueurGameConfirm();
    playJoueurSfxFireAndForget('levelup');
    setRevealed(true);
    setFocusUid(profile.uid);
    onCleared?.();
  };

  if (!board) {
    return (
      <GamePageShell kicker="ÉTAPE 02 · TERRAIN" title="TERRAIN VERROUILLÉ">
        <View style={[pitch.lock, { borderColor: accent }]}>
          <JoueurHudCorners color={accent} size={16} thickness={2} />
          <Animated.View style={[pitch.lockOrb, { borderColor: accent }, glow]} />
          <ProDayText variant="section" style={pitch.lockTitle}>
            XI PAS ENCORE PUBLIÉ
          </ProDayText>
          <ProDayText variant="caption" style={pitch.lockBody}>
            Ton coach compose encore. Reviens pour le dévoilement.
          </ProDayText>
        </View>
      </GamePageShell>
    );
  }

  return (
    <GamePageShell kicker="ÉTAPE 02 · TERRAIN" title="RÉVÉLATION TERRAIN">
      {!revealed ? (
        <PressableSpring onPress={reveal} scaleTo={0.97} haptic style={pitch.fog}>
          <LinearGradient
            colors={['#0B3D1F', '#145C2E', '#0B3D1F']}
            style={StyleSheet.absoluteFill}
          />
          <JoueurHudCorners color={JOUEUR_SITE.xp} size={18} thickness={3} />
          <Animated.View entering={ZoomIn.springify()} style={pitch.fogInner}>
            <ProDayText variant="caption" style={{ color: JOUEUR_SITE.xp, fontWeight: '900' }}>
              CONFIDENTIEL
            </ProDayText>
            <ProDayText variant="title" style={pitch.fogTitle}>
              {next?.title ?? 'MATCH'}
            </ProDayText>
            <ProDayText variant="caption" style={pitch.fogBody}>
              Tape pour révéler le XI · formation {board.formation}
            </ProDayText>
            <View style={[pitch.fogCta, { backgroundColor: accent }]}>
              <ProDayText variant="caption" style={pitch.fogCtaText}>
                ▶ RÉVÉLER LE XI
              </ProDayText>
            </View>
          </Animated.View>
        </PressableSpring>
      ) : (
        <>
          <View style={pitch.statusRow}>
            <ProDayText variant="caption" style={{ color: JOUEUR_SITE.ok, fontWeight: '900' }}>
              {mySlot
                ? mySlot.role === 'starter'
                  ? '★ TITULAIRE'
                  : '◆ BANC'
                : '○ HORS XI'}
            </ProDayText>
            <ProDayText variant="caption" style={{ color: JOUEUR_SITE.muted, fontWeight: '700' }}>
              Tape un joueur
            </ProDayText>
          </View>

          <SmartTacticsBoard
            formation={board.formation}
            starters={board.starters}
            bench={board.bench}
            pool={board.pool}
            cards={cards}
            readOnly
            highlightUid={focusUid ?? profile.uid}
            seedKey={`player-game|${next?.id}|${board.starters.map((s) => s.uid).join(',')}`}
            onChangeFormation={() => undefined}
            onStartersChange={() => undefined}
            onBenchChange={() => undefined}
            onPoolChange={() => undefined}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pitch.chipRow}>
            {[...board.starters, ...board.bench].slice(0, 14).map((s) => {
              const mine = s.uid === profile.uid;
              const on = focusUid === s.uid;
              return (
                <PressableSpring
                  key={s.uid}
                  onPress={() => {
                    joueurGamePress();
                    playJoueurSfxFireAndForget(mine ? 'star' : 'tap');
                    setFocusUid(s.uid);
                  }}
                  scaleTo={0.94}
                  haptic
                  style={[
                    pitch.chip,
                    {
                      borderColor: mine ? JOUEUR_SITE.xp : on ? accent : JOUEUR_SITE.border,
                      backgroundColor: mine ? 'rgba(255,229,102,0.12)' : JOUEUR_SITE.panel,
                    },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={{
                      color: mine ? JOUEUR_SITE.xp : JOUEUR_SITE.foreground,
                      fontWeight: '800',
                      fontSize: 11,
                    }}
                    numberOfLines={1}
                  >
                    {mine ? 'TOI' : s.display_name.split(' ')[0]}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </>
      )}
    </GamePageShell>
  );
}

const pitch = StyleSheet.create({
  lock: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.panel,
    padding: spacing.lg,
  },
  lockOrb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    marginBottom: 8,
  },
  lockTitle: { color: JOUEUR_SITE.foreground, fontWeight: '900', textAlign: 'center' },
  lockBody: { color: JOUEUR_SITE.muted, textAlign: 'center', fontWeight: '600' },
  fog: {
    minHeight: 280,
    borderWidth: 2,
    borderColor: JOUEUR_SITE.xp,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fogInner: { padding: spacing.lg, gap: 8, alignItems: 'center' },
  fogTitle: { color: '#fff', fontWeight: '900', fontSize: 26, textAlign: 'center' },
  fogBody: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontWeight: '700' },
  fogCta: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 10 },
  fogCtaText: { color: '#05070C', fontWeight: '900', letterSpacing: 1.2 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
  },
});

/** HERO — carte power-up interactive. */
export function SmartPlayerHeroPage({
  profile,
  members,
  wellnessByUid,
  onOpenChapter,
  onCleared,
}: SmartTacticsChapterProps & { onCleared?: () => void }) {
  const accent = useAccent();
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const me = cards.find((c) => c.uid === profile.uid) ?? cards[0];
  const [boost, setBoost] = useState(0);
  const [pop, setPop] = useState<string | null>(null);
  const [statFocus, setStatFocus] = useState<'ovr' | 'forme' | null>(null);

  const powerUp = () => {
    joueurGameConfirm();
    playJoueurSfxFireAndForget('xp');
    setBoost((b) => Math.min(20, b + 4));
    setPop('+CHARGE');
    onCleared?.();
    setTimeout(() => setPop(null), 800);
  };

  return (
    <GamePageShell kicker="ÉTAPE 03 · PERSONNAGE" title="CARTE HÉROS">
      <ArcadePop text={pop ?? ''} color={accent} visible={Boolean(pop)} />
      {me ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={hero.cardWrap}>
          <SmartPlayerCard card={me} fut />
        </Animated.View>
      ) : (
        <View style={[hero.empty, { borderColor: accent }]}>
          <ProDayText variant="section" style={{ color: JOUEUR_SITE.foreground, fontWeight: '900' }}>
            CARTE VERROUILLÉE
          </ProDayText>
          <ProDayText variant="caption" style={{ color: JOUEUR_SITE.muted }}>
            Complète ton profil pour débloquer.
          </ProDayText>
        </View>
      )}

      {me ? (
        <View style={hero.stats}>
          <PressableSpring
            onPress={() => {
              joueurGamePress();
              setStatFocus('ovr');
              playJoueurSfxFireAndForget('tap');
            }}
            scaleTo={0.96}
            haptic
            style={[
              hero.stat,
              { borderColor: statFocus === 'ovr' ? accent : JOUEUR_SITE.border },
            ]}
          >
            <JoueurHudCorners color={statFocus === 'ovr' ? accent : JOUEUR_SITE.dim} size={8} />
            <ProDayText variant="caption" style={hero.statLabel}>
              NOTE
            </ProDayText>
            <ProDayText variant="title" style={hero.statValue}>
              {me.overall + Math.floor(boost / 4)}
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            onPress={() => {
              joueurGamePress();
              setStatFocus('forme');
              playJoueurSfxFireAndForget('tap');
            }}
            scaleTo={0.96}
            haptic
            style={[
              hero.stat,
              { borderColor: statFocus === 'forme' ? JOUEUR_SITE.ok : JOUEUR_SITE.border },
            ]}
          >
            <JoueurHudCorners
              color={statFocus === 'forme' ? JOUEUR_SITE.ok : JOUEUR_SITE.dim}
              size={8}
            />
            <ProDayText variant="caption" style={hero.statLabel}>
              FORME
            </ProDayText>
            <ProDayText variant="title" style={[hero.statValue, { color: JOUEUR_SITE.ok }]}>
              {Math.min(100, me.readiness_pct + boost)}%
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}

      {me ? (
        <JoueurXpBar
          label="CHARGE PUISSANCE"
          value={40 + boost * 3}
          max={100}
          color={accent}
        />
      ) : null}

      <PressableSpring
        onPress={powerUp}
        scaleTo={0.95}
        haptic
        style={[hero.power, { backgroundColor: accent }]}
      >
        <ProDayText variant="caption" style={hero.powerText}>
          ⚡ BOOST
        </ProDayText>
      </PressableSpring>

      <PressableSpring
        onPress={() => {
          joueurGamePress();
          playJoueurSfxFireAndForget('whoosh');
          onOpenChapter('dashboard');
        }}
        scaleTo={0.96}
        haptic
        style={[hero.next, { borderColor: accent }]}
      >
        <ProDayText variant="caption" style={[hero.nextText, { color: accent }]}>
          ÉTAPE SUIVANTE → MATCH
        </ProDayText>
      </PressableSpring>
    </GamePageShell>
  );
}

const hero = StyleSheet.create({
  cardWrap: { alignItems: 'center', marginVertical: spacing.sm },
  empty: {
    padding: spacing.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
    backgroundColor: JOUEUR_SITE.panel,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.panel,
    gap: 4,
  },
  statLabel: {
    color: JOUEUR_SITE.muted,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  statValue: { color: JOUEUR_SITE.foreground, fontWeight: '900', fontSize: 28 },
  power: { paddingVertical: 14, alignItems: 'center' },
  powerText: { color: '#05070C', fontWeight: '900', letterSpacing: 1.6, fontSize: 13 },
  next: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.panel,
  },
  nextText: { fontWeight: '900', letterSpacing: 1.4, fontSize: 12 },
});

/** MATCH — écran VS / next level. */
export function SmartPlayerMatchPage({
  profile,
  events,
  onOpenChapter,
  onCleared,
}: SmartTacticsChapterProps & { onCleared?: () => void }) {
  const accent = useAccent();
  const nav = useTabNavigationActions();
  const next = useMemo(() => pickNextMatch(events), [events]);
  const [ready, setReady] = useState(false);
  const inLineup = Boolean(next?.lineup?.slots.some((s) => s.uid === profile.uid));
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.5, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [pulse]);
  const vsGlow = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const markReady = () => {
    joueurGameConfirm();
    playJoueurSfxFireAndForget('enter');
    setReady(true);
    onCleared?.();
  };

  return (
    <GamePageShell kicker="ÉTAPE 04 · NIVEAU SUIVANT" title="CHARGEMENT MATCH">
      {!next ? (
        <View style={[match.empty, { borderColor: accent }]}>
          <JoueurHudCorners color={accent} size={14} />
          <ProDayText variant="section" style={match.emptyTitle}>
            AUCUN MATCH
          </ProDayText>
          <ProDayText variant="caption" style={match.emptyBody}>
            Pas de match planifié — le prochain niveau arrive bientôt.
          </ProDayText>
        </View>
      ) : (
        <View style={[match.vs, { borderColor: accent }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(20,40,70,0.9)', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />
          <JoueurHudCorners color={accent} size={18} thickness={3} />
          <ProDayText variant="caption" style={[match.when, { color: accent }]}>
            {formatCalendarDate(next.starts_at)}
            {next.location_label || next.city
              ? ` · ${(next.location_label || next.city).toUpperCase()}`
              : ''}
          </ProDayText>
          <ProDayText variant="title" style={match.title} numberOfLines={2}>
            {next.title.toUpperCase()}
          </ProDayText>
          <Animated.View style={[match.vsBadge, { borderColor: accent }, vsGlow]}>
            <ProDayText variant="title" style={[match.vsText, { color: accent }]}>
              VS
            </ProDayText>
          </Animated.View>
          <ProDayText
            variant="caption"
            style={{
              color: inLineup ? JOUEUR_SITE.ok : JOUEUR_SITE.warn,
              fontWeight: '900',
              letterSpacing: 1.2,
            }}
          >
            {next.lineup && next.lineup.slots.length > 0
              ? inLineup
                ? '✓ TU ES DANS LE GROUPE'
                : '○ PAS DANS LE XI'
              : '⏳ XI EN ATTENTE'}
          </ProDayText>
        </View>
      )}

      <PressableSpring
        onPress={markReady}
        scaleTo={0.95}
        haptic
        style={[
          match.ready,
          { backgroundColor: ready ? JOUEUR_SITE.ok : accent },
        ]}
      >
        <ProDayText variant="caption" style={match.readyText}>
          {ready ? 'PRÊT ★' : 'JE SUIS PRÊT'}
        </ProDayText>
      </PressableSpring>

      <View style={match.actions}>
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onOpenChapter('board');
          }}
          scaleTo={0.96}
          haptic
          style={[match.side, { borderColor: accent }]}
        >
          <ProDayText variant="caption" style={[match.sideText, { color: accent }]}>
            OUVRIR TERRAIN
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            playJoueurSfxFireAndForget('whoosh');
            nav.openMatchs();
          }}
          scaleTo={0.96}
          haptic
          style={[match.side, { borderColor: JOUEUR_SITE.xp }]}
        >
          <ProDayText variant="caption" style={[match.sideText, { color: JOUEUR_SITE.xp }]}>
            CENTRE MATCH
          </ProDayText>
        </PressableSpring>
      </View>
    </GamePageShell>
  );
}

const match = StyleSheet.create({
  empty: {
    padding: spacing.lg,
    borderWidth: 1.5,
    gap: 8,
    backgroundColor: JOUEUR_SITE.panel,
    alignItems: 'center',
  },
  emptyTitle: { color: JOUEUR_SITE.foreground, fontWeight: '900' },
  emptyBody: { color: JOUEUR_SITE.muted, textAlign: 'center' },
  vs: {
    minHeight: 240,
    padding: spacing.lg,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  when: { fontWeight: '900', letterSpacing: 1.4, fontSize: 10 },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  vsBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  vsText: { fontWeight: '900', fontSize: 22 },
  ready: { paddingVertical: 16, alignItems: 'center' },
  readyText: { color: '#05070C', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  side: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: JOUEUR_SITE.panel,
  },
  sideText: { fontWeight: '900', fontSize: 11, letterSpacing: 1 },
});

/** Shell portail joueur — arcade + stages. */
export function SmartPlayerGamePortal({
  chapter,
  onChangeChapter,
  chapterProps,
}: {
  chapter: SmartTacticsChapterId;
  onChangeChapter: (id: SmartTacticsChapterId) => void;
  chapterProps: SmartTacticsChapterProps;
}) {
  const identity = useIdentity();
  const [cleared, setCleared] = useState<Partial<Record<SmartTacticsChapterId, boolean>>>({});
  const mark = (id: SmartTacticsChapterId) =>
    setCleared((c) => (c[id] ? c : { ...c, [id]: true }));

  const body = (() => {
    switch (chapter) {
      case 'board':
        return (
          <SmartPlayerPitchPage {...chapterProps} onCleared={() => mark('board')} />
        );
      case 'me':
        return <SmartPlayerHeroPage {...chapterProps} onCleared={() => mark('me')} />;
      case 'dashboard':
        return (
          <SmartPlayerMatchPage {...chapterProps} onCleared={() => mark('dashboard')} />
        );
      case 'inbox':
      default:
        return <SmartPlayerQuestPage {...chapterProps} onCleared={() => mark('inbox')} />;
    }
  })();

  return (
    <JoueurArcadeShell identity={identity} liveLabel="TACTIQUE" bootSound>
      <View style={portal.top}>
        <ProDayText variant="caption" style={[portal.kicker, { color: identity.accent }]}>
          {identity.hudLabel}
        </ProDayText>
        <ProDayText variant="section" style={portal.title}>
          Tactique
        </ProDayText>
      </View>
      <SmartPlayerGameStageRail
        active={chapter}
        onChange={onChangeChapter}
        cleared={cleared}
      />
      <View style={portal.body}>{body}</View>
    </JoueurArcadeShell>
  );
}

const portal = StyleSheet.create({
  top: {
    paddingHorizontal: spacing.md,
    paddingTop: 44,
    gap: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  body: { flex: 1, minHeight: 0 },
});
