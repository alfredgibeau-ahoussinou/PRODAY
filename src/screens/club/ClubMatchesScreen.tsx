/**
 * Pôle Club — Centralisateur des Matchs, Amicaux & Compétitions
 * Intégration complète : Championnats FFF, Calendrier, Buteurs & Match Hub direct.
 * Design System Apple Obsidian Glass · Zéro émoji unicode.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubLoading,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubMatchesCenter, type FixtureItem } from '../../features/club/ui/ClubMatchesCenter';
import { buildTopScorers } from '../../utils/clubHubRealData';
import { PushScreenTransition } from '../../components/motion';
import { MatchEventHubScreen } from '../MatchEventHubScreen';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

export function ClubMatchesScreen() {
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [hubEventId, setHubEventId] = useState<string | null>(null);
  const [hubChapter, setHubChapter] = useState<MatchHubChapterId>('apercu');
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const fixtures = useMemo<FixtureItem[] | undefined>(() => {
    const matchEvents = ws.events.filter((e) => e.event_type === 'competition');
    if (matchEvents.length === 0) return []; // état vide honnête (aucune donnée de démonstration)

    return matchEvents.map((e) => {
      const d = e.starts_at ? new Date(e.starts_at) : new Date();
      const dateStr = d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const timeStr = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const team =
        ws.teamRows.find((t) => t.teamId === e.team_id)?.name ||
        e.club_name ||
        'ProDay FC';
      const isHome = !e.location_label?.toLowerCase().includes('ext');

      return {
        id: e.id,
        type: (e.title?.toLowerCase().includes('amical')
          ? 'friendly'
          : e.title?.toLowerCase().includes('coupe')
          ? 'cup'
          : e.title?.toLowerCase().includes('plateau')
          ? 'plateau'
          : 'fff') as FixtureItem['type'],
        typeLabel: e.title?.toLowerCase().includes('amical')
          ? 'Match Amical'
          : e.title?.toLowerCase().includes('plateau')
          ? 'Plateau'
          : 'Championnat FFF',
        homeTeam: isHome ? team : e.title?.split('vs')?.[0]?.trim() || 'Club Adverse',
        awayTeam: !isHome
          ? team
          : e.title?.split('vs')?.[1]?.trim() || e.location_label || 'Club Adverse',
        dateStr,
        timeStr,
        venue:
          e.location_label ||
          (isHome ? 'Stade Municipal · Terrain d’Honneur' : 'Stade Extérieur'),
        isHome,
        status: (d.getTime() < Date.now() - 2 * 3600_000
          ? 'finished'
          : d.getTime() <= Date.now() + 2 * 3600_000
          ? 'live'
          : 'upcoming') as FixtureItem['status'],
        competition: e.description?.slice(0, 30) || 'Championnat Régional FFF',
        refereeAssigned: true,
        convocationsSent: (e.invitee_uids?.length ?? 0) > 0,
      };
    });
  }, [ws.events, ws.teamRows]);

  // Buteurs réels : agrégation des player_match_stats persistés (aucune stat inventée).
  const topScorers = useMemo(
    () =>
      buildTopScorers(
        ws.events,
        new Map(ws.members.map((m) => [m.uid, m.display_name])),
        new Map(ws.teamRows.map((t) => [t.teamId, t.name])),
      ),
    [ws.events, ws.members, ws.teamRows],
  );

  const openHub = (fixtureId: string) => {
    setHubChapter('apercu');
    setHubEventId(fixtureId);
  };

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Matchs & Compétitions"
          subtitle="Centralisateur officiel · Championnats FFF, amicaux & rassemblements"
        />

        <ClubMatchesCenter
          fixtures={fixtures}
          topScorers={topScorers}
          onSelectFixture={openHub}
        />
      </ClubChapterScroll>

      {/* Hub Match Détail / Feuilles de match / Direct */}
      <PushScreenTransition active={hubEventId != null} backgroundColor={tokens.bg}>
        {hubEventId ? (
          <MatchEventHubScreen
            eventId={hubEventId}
            initialChapter={hubChapter}
            onBack={() => {
              setHubEventId(null);
              void ws.refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
  });
