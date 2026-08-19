import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { SmartTacticsBoard } from './SmartTacticsBoard';
import type { SmartTacticsChapterProps } from './smartTacticsUi';
import { smartTacticsService } from '../../services/smartTactics.service';
import { tacticalShareService } from '../../services/matchTalk.service';
import { eventLineupToBoardSlots } from '../../utils/tacticalBoardSync';
import type { TacticalBoardSlot } from '../../models/SmartTactics';
import type { TacticalSharePayload } from '../../models/TacticalShare';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { JoueurXpBar } from '../player/joueurPortalUi';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { JoueurArcadeShell } from '../../features/joueur/JoueurGameFx';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
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

/**
 * Smart Tactics joueur — hub premium (briefing / XI / match).
 * Pas de compose coach, pas de « tactics run » arcade.
 */
export function SmartTacticsPlayerHome({
  profile,
  events,
  members,
  wellnessByUid,
  refreshing,
  onRefresh,
}: SmartTacticsChapterProps) {
  const session = useJoueurSession();
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const identity =
    session?.identity ??
    resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'neutral' });
  const accent = joueurTheme.accent;
  const accentAlt = joueurTheme.accentBright;
  const accentSoft = playerColors.accentSoft;
  const nav = useTabNavigationActions();

  const [briefs, setBriefs] = useState<TacticalSharePayload[]>([]);
  const [focusUid, setFocusUid] = useState(profile.uid);

  useEffect(() => {
    void tacticalShareService.listForPlayer(profile.uid).then(setBriefs);
  }, [profile.uid]);

  const next = useMemo(() => pickNextMatch(events), [events]);
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const me = cards.find((c) => c.uid === profile.uid);

  const board = useMemo(() => {
    if (!next?.lineup || next.lineup.slots.length === 0) return null;
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
  }, [next, members]);

  const mySlot = board
    ? board.starters.find((s) => s.uid === profile.uid) ??
      board.bench.find((s) => s.uid === profile.uid)
    : null;

  const inLineup = Boolean(next?.lineup?.slots.some((s) => s.uid === profile.uid));

  return (
    <JoueurArcadeShell identity={identity} liveLabel="TACTIQUE" bootSound={false}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={accent}
          />
        }
      >
        <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
          {identity.hudLabel}
        </ProDayText>
        <ProDayText variant="title" style={styles.title}>
          Tactique
        </ProDayText>
        <ProDayText variant="caption" style={styles.support}>
          Briefing coach · XI publié · Coach IA pour progresser tactiquement.
        </ProDayText>

        <PressableSpring
          onPress={() => {
            joueurGamePress();
            nav.openDashboard('tactics_coach');
          }}
          scaleTo={0.97}
          haptic
          style={[styles.coachCta, { borderColor: accent, backgroundColor: accentSoft }]}
        >
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            COACH IA
          </ProDayText>
          <ProDayText variant="section" style={styles.heroTitle}>
            Parler tactique
          </ProDayText>
          <ProDayText variant="caption" style={styles.heroBody}>
            Football, principes de jeu, drills pour ton poste.
          </ProDayText>
        </PressableSpring>

        {/* Next match hero */}
        <View style={[styles.hero, { borderColor: PLAYER_DARK.border }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {!next ? (
            <>
              <ProDayText variant="caption" style={[styles.heroKicker, { color: accent }]}>
                FIXTURE
              </ProDayText>
              <ProDayText variant="section" style={styles.heroTitle}>
                Aucun match à venir
              </ProDayText>
              <ProDayText variant="caption" style={styles.heroBody}>
                Dès qu’un match est planifié, ton statut et le XI apparaissent ici.
              </ProDayText>
            </>
          ) : (
            <>
              <ProDayText variant="caption" style={[styles.heroKicker, { color: accent }]}>
                NEXT MATCH
              </ProDayText>
              <ProDayText variant="title" style={styles.heroTitle} numberOfLines={2}>
                {next.title}
              </ProDayText>
              <ProDayText variant="caption" style={styles.heroBody}>
                {formatCalendarDate(next.starts_at)}
                {next.location_label || next.city
                  ? ` · ${next.location_label || next.city}`
                  : ''}
              </ProDayText>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: inLineup
                        ? accentSoft
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={{
                      color: inLineup ? accentAlt : accent,
                      fontWeight: '800',
                    }}
                  >
                    {next.lineup && next.lineup.slots.length > 0
                      ? inLineup
                        ? mySlot?.role === 'starter'
                          ? 'Titulaire'
                          : 'Banc'
                        : 'Hors XI'
                      : 'XI en attente'}
                  </ProDayText>
                </View>
                {mySlot?.position_label ? (
                  <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                    {mySlot.position_label}
                  </ProDayText>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* My readiness */}
        {me ? (
          <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
            <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
              TA FORME
            </ProDayText>
            <View style={styles.meRow}>
              <View style={{ flex: 1, gap: 8 }}>
                <ProDayText variant="section" style={styles.meName}>
                  {profile.display_name}
                </ProDayText>
                <JoueurXpBar
                  label="Overall"
                  value={me.overall}
                  max={99}
                  color={accent}
                />
                <JoueurXpBar
                  label="Disponibilité"
                  value={me.readiness_pct}
                  max={100}
                  color={accentAlt}
                />
              </View>
              <View style={[styles.ovrBadge, { borderColor: accent }]}>
                <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                  NOTE
                </ProDayText>
                <ProDayText variant="title" style={styles.ovrValue}>
                  {me.overall}
                </ProDayText>
              </View>
            </View>
          </View>
        ) : null}

        {/* Briefings */}
        <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
          <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
            BRIEFING COACH
          </ProDayText>
          {briefs.length === 0 ? (
            <ProDayText variant="caption" style={styles.empty}>
              Pas encore de consignes. Ton coach les partagera ici avant le match.
            </ProDayText>
          ) : (
            <View style={styles.briefList}>
              {briefs.slice(0, 6).map((b) => (
                <View key={b.id} style={styles.briefRow}>
                  <View style={[styles.briefDot, { backgroundColor: accent }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <ProDayText variant="caption" style={styles.briefTitle}>
                      {b.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.briefBody}>
                      {b.phase_label ? `${b.phase_label} · ` : ''}
                      {b.note ?? 'Consigne partagée'}
                    </ProDayText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Published XI */}
        <View style={[styles.panel, { borderColor: PLAYER_DARK.border }]}>
          <View style={styles.panelHead}>
            <ProDayText variant="caption" style={[styles.panelKicker, { color: accent }]}>
              COMPOSITION
            </ProDayText>
            {board ? (
              <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                {board.formation}
              </ProDayText>
            ) : null}
          </View>

          {!board ? (
            <ProDayText variant="caption" style={styles.empty}>
              Le XI n’est pas encore publié. Tu le verras ici en lecture seule.
            </ProDayText>
          ) : (
            <>
              <SmartTacticsBoard
                formation={board.formation}
                starters={board.starters}
                bench={board.bench}
                pool={board.pool}
                cards={cards}
                readOnly
                highlightUid={focusUid}
                seedKey={`tactics-home|${next?.id}|${board.starters.map((s) => s.uid).join(',')}`}
                onChangeFormation={() => undefined}
                onStartersChange={() => undefined}
                onBenchChange={() => undefined}
                onPoolChange={() => undefined}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {[...board.starters, ...board.bench].slice(0, 16).map((s) => {
                  const mine = s.uid === profile.uid;
                  const on = focusUid === s.uid;
                  return (
                    <PressableSpring
                      key={s.uid}
                      onPress={() => {
                        joueurGamePress();
                        setFocusUid(s.uid);
                      }}
                      scaleTo={0.95}
                      haptic
                      style={[
                        styles.chip,
                        {
                          borderColor: mine
                            ? accent
                            : on
                              ? accent
                              : PLAYER_DARK.border,
                          backgroundColor: mine
                            ? accentSoft
                            : PLAYER_DARK.surface,
                        },
                      ]}
                    >
                      <ProDayText
                        variant="caption"
                        style={{
                          color: mine ? accent : PLAYER_DARK.text,
                          fontWeight: '800',
                          fontSize: 11,
                        }}
                        numberOfLines={1}
                      >
                        {mine ? 'Toi' : s.display_name.split(' ')[0]}
                      </ProDayText>
                    </PressableSpring>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        <View style={styles.actions}>
          <PressableSpring
            onPress={() => {
              joueurGamePress();
              nav.openMatchs();
            }}
            scaleTo={0.97}
            haptic
            style={[styles.ctaPrimary, { backgroundColor: accent }]}
          >
            <ProDayText variant="caption" style={styles.ctaPrimaryText}>
              Ouvrir Matchs
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            onPress={() => {
              joueurGamePress();
              nav.setActiveTab('recrutement');
            }}
            scaleTo={0.97}
            style={[styles.ctaSecondary, { borderColor: PLAYER_DARK.border }]}
          >
            <ProDayText variant="caption" style={styles.ctaSecondaryText}>
              Squad
            </ProDayText>
          </PressableSpring>
        </View>
      </ScrollView>
    </JoueurArcadeShell>
  );
}

export function SmartTacticsPlayerHomeLoading({ accent }: { accent: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 10,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PLAYER_DARK.bg,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
  },
  title: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
    fontSize: 34,
    letterSpacing: -1,
    marginTop: -4,
  },
  support: {
    color: PLAYER_DARK.textMuted,
    lineHeight: 20,
    marginTop: -8,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    gap: 6,
    backgroundColor: PLAYER_DARK.surface,
    overflow: 'hidden',
    minHeight: 132,
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  heroBody: { color: PLAYER_DARK.textMuted, lineHeight: 18 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: PLAYER_DARK.surface,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  meRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  meName: { color: PLAYER_DARK.text, fontWeight: '700' },
  ovrBadge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  ovrValue: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 26,
  },
  empty: { color: PLAYER_DARK.textMuted, lineHeight: 18 },
  briefList: { gap: 10 },
  briefRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  briefDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 5,
  },
  briefTitle: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  briefBody: { color: PLAYER_DARK.textMuted, lineHeight: 17 },
  chipRow: { gap: 8, paddingTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10 },
  coachCta: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: 4,
  },
  ctaPrimary: {
    flex: 1.2,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: PLAYER_DARK.bg,
    fontWeight: '800',
    fontSize: 13,
  },
  ctaSecondary: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: PLAYER_DARK.surface,
  },
  ctaSecondaryText: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    fontSize: 13,
  },
});
