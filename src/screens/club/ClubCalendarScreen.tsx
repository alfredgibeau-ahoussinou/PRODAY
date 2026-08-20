import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { isCoachMatchEvent, isCoachTrainingEvent } from '../../models/TeamEvent';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

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

/** Calendrier global club — filtres jour / semaine / mois. */
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
        <ClubScreenHeader title="Calendrier" subtitle="Matchs, séances, événements" />

        <View style={styles.filters}>
          {(
            [
              ['day', 'Jour'],
              ['week', 'Semaine'],
              ['month', 'Mois'],
            ] as const
          ).map(([id, label]) => (
            <ClubActionRow
              key={id}
              label={label}
              trailing={
                range === id ? (
                  <ClubText variant="caption" style={{ color: tokens.accent }}>
                    ●
                  </ClubText>
                ) : undefined
              }
              onPress={() => setRange(id)}
            />
          ))}
        </View>

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
              const kind = isCoachMatchEvent(e)
                ? 'Match'
                : isCoachTrainingEvent(e)
                  ? 'Entraînement'
                  : 'Événement';
              return (
                <ClubActionRow
                  key={e.id}
                  icon={isCoachMatchEvent(e) ? 'trophy' : isCoachTrainingEvent(e) ? 'football' : 'flag'}
                  label={e.title || kind}
                  hint={`${kind} · ${e.starts_at.toLocaleString('fr-FR')}`}
                  onPress={() =>
                    shellNav?.requestNav(
                      isCoachMatchEvent(e)
                        ? 'matches'
                        : isCoachTrainingEvent(e)
                          ? 'trainings'
                          : 'events',
                    )
                  }
                />
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
    root: { flex: 1, backgroundColor: tokens.bg },
    filters: { gap: spacing.xs },
  });
