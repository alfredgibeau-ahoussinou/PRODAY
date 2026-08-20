import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubEventBadge,
  ClubLoading,
  ClubSectionCard,
  ClubSegmentedControl,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace, type ClubEventKind } from '../../features/club/theme/clubDesignSystem';

type Range = 'day' | 'week' | 'month';

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inRange(date: Date, range: Range, now: Date): boolean {
  const t = date.getTime();
  if (range === 'day') {
    const a = new Date(now);
    a.setHours(0, 0, 0, 0);
    const b = new Date(now);
    b.setHours(23, 59, 59, 999);
    return t >= a.getTime() && t <= b.getTime();
  }
  if (range === 'week') {
    const a = startOfWeek(now);
    const b = new Date(a);
    b.setDate(b.getDate() + 7);
    return t >= a.getTime() && t < b.getTime();
  }
  const a = new Date(now.getFullYear(), now.getMonth(), 1);
  const b = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return t >= a.getTime() && t < b.getTime();
}

function eventKind(
  e: { title?: string | null; type?: string },
  match: boolean,
  training: boolean,
): ClubEventKind {
  if (match) return 'match';
  if (training) return 'training';
  const t = `${e.title ?? ''} ${e.type ?? ''}`.toLowerCase();
  if (t.includes('tournoi') || t.includes('tournament')) return 'tournament';
  if (t.includes('réunion') || t.includes('reunion') || t.includes('meeting')) return 'meeting';
  return 'event';
}

function clubLabel(kind: ClubEventKind): string {
  if (kind === 'match') return 'Match';
  if (kind === 'training') return 'Entraînement';
  if (kind === 'tournament') return 'Tournoi';
  if (kind === 'meeting') return 'Réunion';
  return 'Événement';
}

/** Calendrier global club — Jour / Semaine / Mois + codes visuels. */
export function ClubCalendarScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [range, setRange] = useState<Range>('week');
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const now = new Date();

  if (ws.loading) return <ClubLoading />;

  const items = ws.events
    .filter((e) => e.starts_at && inRange(new Date(e.starts_at), range, now))
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Calendrier" subtitle="Matchs, séances, événements" />

        <ClubSegmentedControl
          options={[
            { id: 'day' as const, label: 'Jour' },
            { id: 'week' as const, label: 'Semaine' },
            { id: 'month' as const, label: 'Mois' },
          ]}
          value={range}
          onChange={setRange}
        />

        {items.length === 0 ? (
          <ClubEmptyState
            title="Rien sur cette période"
            body="Créez un match, un entraînement ou un événement pour remplir le calendrier."
            actionLabel="+ Créer"
            onAction={() => shellNav?.openCreate?.()}
            icon="calendar"
          />
        ) : (
          <ClubSectionCard title={`${items.length} événement(s)`}>
            {items.map((e) => {
              const match = isCoachMatchEvent(e);
              const training = isCoachTrainingEvent(e);
              const kind = eventKind(e, match, training);
              return (
                <View key={e.id} style={styles.eventRow}>
                  <ClubEventBadge kind={kind} />
                  <ClubActionRow
                    icon={match ? 'trophy' : training ? 'football' : 'flag'}
                    label={e.title || clubLabel(kind)}
                    hint={e.starts_at.toLocaleString('fr-FR')}
                    onPress={() =>
                      shellNav?.requestNav(
                        match ? 'matches' : training ? 'trainings' : 'events',
                      )
                    }
                  />
                </View>
              );
            })}
          </ClubSectionCard>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    eventRow: { gap: clubSpace.xs, paddingBottom: clubSpace.xs },
  });
