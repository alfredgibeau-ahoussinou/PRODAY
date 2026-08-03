import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { TeamEvent } from '../../models/TeamEvent';

const EVENT_LABELS: Record<string, string> = {
  training: 'Entraînement',
  detection: 'Détection',
  meeting: 'Réunion',
  friendly: 'Match amical',
  tournament: 'Tournoi',
  other: 'Événement',
};

export const ParentAgendaScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { selected } = useParentShell();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selected) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      setEvents(await parentPortalService.listChildEvents(selected.uid));
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          Sélectionnez un enfant.
        </ProDayText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDayText variant="section">Agenda de {selected.display_name}</ProDayText>
      <ProDayText variant="caption" muted>
        Matchs, entraînements et convocations.
      </ProDayText>

      {loading ? (
        <ActivityIndicator color={c.brand} />
      ) : events.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            Aucun événement à venir.
          </ProDayText>
        </ProDaySurface>
      ) : (
        events.map((event) => (
          <ProDaySurface key={event.id} variant="module" style={styles.card}>
            <ProDayText variant="caption" accent>
              {EVENT_LABELS[event.event_type] ?? event.event_type}
            </ProDayText>
            <ProDayText variant="section">{event.title}</ProDayText>
            <ProDayText variant="caption" muted>
              {event.starts_at.toLocaleString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {event.city ? ` · ${event.city}` : ''}
            </ProDayText>
            {event.location_label ? (
              <ProDayText variant="caption" muted>
                {event.location_label}
              </ProDayText>
            ) : null}
            {event.rsvps?.[selected.uid] ? (
              <ProDayText variant="caption">
                RSVP : {event.rsvps[selected.uid]}
              </ProDayText>
            ) : null}
          </ProDaySurface>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
});
