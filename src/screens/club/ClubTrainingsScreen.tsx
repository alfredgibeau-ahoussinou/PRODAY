import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import { isCoachTrainingEvent } from '../../models/TeamEvent';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type AttendanceMark = 'present' | 'absent' | 'late_under_10' | 'late_over_10' | 'pending';

const ATTENDANCE_LABELS: Record<AttendanceMark, string> = {
  present: 'Présent',
  absent: 'Absent',
  late_under_10: 'Retard < 10 min',
  late_over_10: 'Retard ≥ 10 min',
  pending: 'En attente',
};

/** Entraînements + présences. */
export function ClubTrainingsScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (ws.loading) return <ClubLoading />;

  const trainings = ws.events
    .filter((e) => isCoachTrainingEvent(e))
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  const selected = trainings.find((t) => t.id === selectedId) ?? null;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader title="Entraînements" subtitle="Présences & retards" />

        {trainings.length === 0 ? (
          <ClubEmptyState
            title="Aucune séance"
            body="Planifiez un entraînement pour suivre les présences (Présent / Absent / Retard / En attente)."
            actionLabel="+ Créer une séance"
            onAction={() => shellNav?.openCreate?.('training')}
            icon="time"
          />
        ) : (
          <ClubSectionCard title="Séances">
            {trainings.map((e) => (
              <ClubActionRow
                key={e.id}
                icon="football"
                label={e.title || 'Entraînement'}
                hint={e.starts_at.toLocaleString('fr-FR')}
                onPress={() => setSelectedId(e.id)}
              />
            ))}
          </ClubSectionCard>
        )}

        {selected ? (
          <ClubSectionCard title={`Présences · ${selected.title || 'Séance'}`}>
            <ClubText variant="body" muted>
              Marquez chaque joueur. Retard &lt; 10 min ou ≥ 10 min.
            </ClubText>
            {(Object.keys(ATTENDANCE_LABELS) as AttendanceMark[]).map((mark) => (
              <ClubActionRow
                key={mark}
                label={ATTENDANCE_LABELS[mark]}
                hint="Statut de présence"
                onPress={() =>
                  Alert.alert(
                    ATTENDANCE_LABELS[mark],
                    'La feuille de présence complète (par joueur) sera branchée sur les RSVP / attendance existants.',
                  )
                }
              />
            ))}
          </ClubSectionCard>
        ) : null}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
  });
