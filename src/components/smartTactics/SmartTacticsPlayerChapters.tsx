import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { PlayerTacticalInbox } from '../player/PlayerTacticalInbox';
import { SmartPlayerCard } from './SmartPlayerCard';
import { SmartTacticsBoard } from './SmartTacticsBoard';
import {
  SMART_PITCH,
  SmartTacticsChapterScroll,
  SmartTacticsEmpty,
  type SmartTacticsChapterProps,
} from './smartTacticsUi';
import { smartTacticsService } from '../../services/smartTactics.service';
import { eventLineupToBoardSlots } from '../../utils/tacticalBoardSync';
import type { TacticalBoardSlot } from '../../models/SmartTactics';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { formatCalendarDate } from '../../utils/seasonCalendar';
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

/** Accueil joueur — consignes coach, pas de compose XI. */
export function SmartPlayerInboxChapter({
  profile,
  onOpenChapter,
}: SmartTacticsChapterProps) {
  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Consignes</ProDayText>
      <ProDayText variant="caption" muted>
        Messages du coach pour toi — pas de composition ici.
      </ProDayText>

      <PlayerTacticalInbox uid={profile.uid} />

      <ProDaySurface variant="module" style={styles.hint}>
        <ProDayText variant="caption" style={{ fontWeight: '800', color: SMART_PITCH.warm }}>
          Comment ça marche
        </ProDayText>
        <ProDayText variant="caption" muted>
          · Lis les consignes partagées par ton coach{'\n'}
          · Consulte le XI publié sur Terrain{'\n'}
          · Suis ta forme et ton poste dans Moi
        </ProDayText>
      </ProDaySurface>

      <PressableSpring
        onPress={() => onOpenChapter('board')}
        scaleTo={0.96}
        haptic
        style={styles.link}
      >
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          Voir le terrain →
        </ProDayText>
      </PressableSpring>
    </SmartTacticsChapterScroll>
  );
}

/** Terrain joueur — XI publié en lecture seule. */
export function SmartPlayerBoardChapter({
  profile,
  members,
  events,
  wellnessByUid,
}: SmartTacticsChapterProps) {
  const next = useMemo(() => pickNextMatch(events), [events]);
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );

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
    return {
      formation: '4-3-3',
      starters: [] as TacticalBoardSlot[],
      bench: [] as TacticalBoardSlot[],
      pool: members.map((m) => ({
        uid: m.uid,
        display_name: m.display_name,
        role: 'sub' as const,
        position_label: m.profile.position,
      })),
    };
  }, [next, members]);

  const [formation, setFormation] = useState(board.formation);
  const [starters, setStarters] = useState(board.starters);
  const [bench, setBench] = useState(board.bench);
  const [pool, setPool] = useState(board.pool);

  useEffect(() => {
    setFormation(board.formation);
    setStarters(board.starters);
    setBench(board.bench);
    setPool(board.pool);
  }, [board]);

  const mySlot =
    starters.find((s) => s.uid === profile.uid) ??
    bench.find((s) => s.uid === profile.uid);

  if (!next?.lineup || next.lineup.slots.length === 0) {
    return (
      <SmartTacticsChapterScroll>
        <ProDayText variant="section">Terrain</ProDayText>
        <SmartTacticsEmpty
          title="Pas encore de XI publié"
          body="Ton coach compose la composition. Tu la verras ici dès qu’elle est synchronisée sur un match."
        />
      </SmartTacticsChapterScroll>
    );
  }

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Terrain</ProDayText>
      <ProDayText variant="caption" muted>
        {next.title} · lecture seule
      </ProDayText>
      {mySlot ? (
        <ProDaySurface variant="module" style={styles.hint}>
          <ProDayText variant="caption" style={{ fontWeight: '800', color: SMART_PITCH.ready }}>
            Tu es {mySlot.role === 'starter' ? 'titulaire' : 'sur le banc'}
            {mySlot.position_label ? ` · ${mySlot.position_label}` : ''}
          </ProDayText>
        </ProDaySurface>
      ) : (
        <ProDaySurface variant="module" style={styles.hint}>
          <ProDayText variant="caption" muted>
            Tu n’es pas dans le XI publié pour ce match.
          </ProDayText>
        </ProDaySurface>
      )}

      <SmartTacticsBoard
        formation={formation}
        starters={starters}
        bench={bench}
        pool={pool}
        cards={cards}
        readOnly
        highlightUid={profile.uid}
        seedKey={`player|${next.id}|${starters.map((s) => s.uid).join(',')}`}
        onChangeFormation={setFormation}
        onStartersChange={setStarters}
        onBenchChange={setBench}
        onPoolChange={setPool}
      />
    </SmartTacticsChapterScroll>
  );
}

/** Fiche perso — forme & carte, pas l’effectif coach. */
export function SmartPlayerMeChapter({
  profile,
  members,
  wellnessByUid,
  onOpenChapter,
}: SmartTacticsChapterProps) {
  const cards = useMemo(
    () => smartTacticsService.buildCards(members, wellnessByUid),
    [members, wellnessByUid],
  );
  const me = cards.find((c) => c.uid === profile.uid) ?? cards[0];

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Moi</ProDayText>
      <ProDayText variant="caption" muted>
        Ta carte, ta forme — pas la gestion d’effectif.
      </ProDayText>

      {me ? (
        <View style={styles.meCard}>
          <SmartPlayerCard card={me} fut />
        </View>
      ) : (
        <SmartTacticsEmpty
          title="Profil incomplet"
          body="Complète ton profil pour voir ta carte Tactique IA."
        />
      )}

      {me ? (
        <View style={styles.stats}>
          <ProDaySurface variant="module" style={styles.stat}>
            <ProDayText variant="caption" muted>
              Overall
            </ProDayText>
            <ProDayText variant="title" style={{ fontWeight: '900' }}>
              {me.overall}
            </ProDayText>
          </ProDaySurface>
          <ProDaySurface variant="module" style={styles.stat}>
            <ProDayText variant="caption" muted>
              Forme
            </ProDayText>
            <ProDayText variant="title" style={{ fontWeight: '900', color: SMART_PITCH.ready }}>
              {me.readiness_pct}%
            </ProDayText>
          </ProDaySurface>
        </View>
      ) : null}

      <PressableSpring
        onPress={() => onOpenChapter('dashboard')}
        scaleTo={0.96}
        haptic
        style={styles.link}
      >
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          Prochain match →
        </ProDayText>
      </PressableSpring>
    </SmartTacticsChapterScroll>
  );
}

/** Match joueur — info prochain match, sans compose. */
export function SmartPlayerMatchChapter({
  profile,
  events,
  onOpenChapter,
}: SmartTacticsChapterProps) {
  const nav = useTabNavigationActions();
  const next = useMemo(() => pickNextMatch(events), [events]);
  const inLineup = Boolean(
    next?.lineup?.slots.some((s) => s.uid === profile.uid),
  );

  return (
    <SmartTacticsChapterScroll>
      <ProDayText variant="section">Match</ProDayText>
      <ProDayText variant="caption" muted>
        Ton prochain rendez-vous — sans outils coach.
      </ProDayText>

      {!next ? (
        <SmartTacticsEmpty
          title="Aucun match à venir"
          body="Dès qu’un match est planifié, tu verras le détail et ton statut ici."
        />
      ) : (
        <ProDaySurface variant="module" style={styles.matchCard}>
          <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
            PROCHAIN MATCH
          </ProDayText>
          <ProDayText variant="section" style={{ fontWeight: '900' }}>
            {next.title}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {formatCalendarDate(next.starts_at)}
            {next.location_label || next.city
              ? ` · ${next.location_label || next.city}`
              : ''}
          </ProDayText>
          <ProDayText
            variant="caption"
            style={{
              fontWeight: '800',
              color: inLineup ? SMART_PITCH.ready : SMART_PITCH.warm,
              marginTop: spacing.xs,
            }}
          >
            {next.lineup && next.lineup.slots.length > 0
              ? inLineup
                ? 'Tu figures dans le XI / banc publié'
                : 'XI publié — tu n’y figures pas'
              : 'Composition pas encore publiée'}
          </ProDayText>
        </ProDaySurface>
      )}

      <PressableSpring
        onPress={() => onOpenChapter('board')}
        scaleTo={0.96}
        haptic
        style={styles.link}
      >
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          Voir le terrain →
        </ProDayText>
      </PressableSpring>
      <PressableSpring
        onPress={() => nav.openMatchs()}
        scaleTo={0.96}
        haptic
        style={styles.link}
      >
        <ProDayText variant="caption" style={{ color: SMART_PITCH.warm, fontWeight: '800' }}>
          Ouvrir Matchs →
        </ProDayText>
      </PressableSpring>
    </SmartTacticsChapterScroll>
  );
}

const styles = StyleSheet.create({
  hint: { padding: spacing.md, gap: spacing.xs },
  link: { paddingVertical: spacing.sm },
  meCard: { alignItems: 'center', marginVertical: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, gap: 4 },
  matchCard: { padding: spacing.md, gap: 4 },
});
