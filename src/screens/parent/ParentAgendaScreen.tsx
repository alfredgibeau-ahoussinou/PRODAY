import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, type RsvpStatus } from '../../models/TeamEvent';

export const ParentAgendaScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { selected } = useParentShell();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const rsvpLabel = (status: RsvpStatus): string => {
    const key = `parent.rsvp.${status}` as const;
    return t(key as Parameters<typeof t>[0]) ?? status;
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          {t('parent.selectChild')}
        </ProDayText>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={c.brand} />
      }
    >
      <ProDayText variant="section">
        {t('parent.agenda.title', { name: selected.display_name })}
      </ProDayText>
      <ProDayText variant="caption" muted>
        {t('parent.agenda.subtitle')}
      </ProDayText>

      {loading && !refreshing ? (
        <ActivityIndicator color={c.brand} />
      ) : events.length === 0 ? (
        <ProDaySurface variant="module" style={styles.card}>
          <ProDayText variant="body" muted>
            {t('parent.agenda.empty')}
          </ProDayText>
        </ProDaySurface>
      ) : (
        events.map((event) => {
          const rsvp = event.rsvps?.[selected.uid];
          return (
            <ProDaySurface key={event.id} variant="module" style={styles.card}>
              <ProDayText variant="caption" accent>
                {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
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
              {rsvp ? (
                <ProDayText variant="caption">
                  {t('parent.agenda.rsvp', { status: rsvpLabel(rsvp) })}
                </ProDayText>
              ) : null}
            </ProDaySurface>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
});
