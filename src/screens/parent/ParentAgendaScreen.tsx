import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { TeamEvent } from '../../models/TeamEvent';
import { LateReportControl } from '../../components/team/LateReportControl';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import {
  ParentRsvpChoiceRow,
  ParentRsvpEmptyCard,
  ParentRsvpEventHero,
} from '../../features/parent/ui/ParentRsvpChrome';
import {
  formatParentEventType,
  formatParentEventWhen,
  needsParentRsvpResponse,
  parentAgendaSubtitle,
  parentRsvpStatusLabel,
  pickNextChildEvent,
  resolveChildRsvp,
  type ParentRsvpChoice,
} from '../../features/parent/ui/parentRsvpModel';

type Filter = 'upcoming' | 'all';

export const ParentAgendaScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { t } = useTranslation();
  const { selected } = useParentShell();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);

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

  const visible = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    if (filter === 'all') return sorted;
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    return sorted.filter((e) => e.starts_at.getTime() >= cutoff);
  }, [events, filter]);

  const nextEvent = useMemo(() => pickNextChildEvent(events), [events]);

  const agendaSub = useMemo(() => {
    if (!selected) return '';
    const pending = visible.filter((e) =>
      needsParentRsvpResponse(resolveChildRsvp(e, selected.uid)),
    ).length;
    return parentAgendaSubtitle({
      upcomingCount: visible.length,
      pendingRsvpCount: pending,
    });
  }, [visible, selected]);

  const onRsvp = useCallback(
    async (eventId: string, choice: ParentRsvpChoice) => {
      if (!selected) return;
      setRsvpBusyId(eventId);
      try {
        await parentPortalService.updateChildRsvp(selected.uid, eventId, choice, {
          childName: selected.display_name,
        });
        await load();
      } catch (e) {
        Alert.alert(
          'Présence',
          e instanceof Error ? e.message : 'Impossible d’enregistrer la réponse.',
        );
      } finally {
        setRsvpBusyId(null);
      }
    },
    [selected, load],
  );

  if (!selected) {
    return (
      <ParentPageFrame identity={PARENT_PAGES.agenda}>
        <View style={styles.center}>
          <ProDayText variant="body" muted>
            {t('parent.selectChild')}
          </ProDayText>
        </View>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame identity={PARENT_PAGES.agenda}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={c.brand}
          />
        }
      >
        <ProDayText variant="caption" muted>
          {agendaSub}
        </ProDayText>

        <View style={styles.filters}>
          <ParentActionButton
            label="À venir"
            tone={filter === 'upcoming' ? 'primary' : 'ghost'}
            onPress={() => setFilter('upcoming')}
          />
          <ParentActionButton
            label="Tout"
            tone={filter === 'all' ? 'primary' : 'ghost'}
            onPress={() => setFilter('all')}
          />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color={c.brand} />
        ) : visible.length === 0 ? (
          <ParentRsvpEmptyCard childName={selected.display_name} />
        ) : (
          <>
            {filter === 'upcoming' && nextEvent ? (
              <ParentRsvpEventHero
                event={nextEvent}
                childName={selected.display_name}
                childUid={selected.uid}
                busy={rsvpBusyId === nextEvent.id}
                onChoose={(choice) => void onRsvp(nextEvent.id, choice)}
                footer={
                  <LateReportControl
                    eventId={nextEvent.id}
                    playerUid={selected.uid}
                    playerName={selected.display_name}
                    currentRsvp={resolveChildRsvp(nextEvent, selected.uid)}
                    reportedByParent
                    enablePickupLate
                    onReported={() => void load()}
                  />
                }
              />
            ) : null}

            {visible
              .filter((e) => !(filter === 'upcoming' && nextEvent && e.id === nextEvent.id))
              .map((event) => {
                const rsvp = resolveChildRsvp(event, selected.uid);
                const open = expandedId === event.id;
                return (
                  <ParentSectionCard
                    key={event.id}
                    title={event.title}
                    subtitle={`${formatParentEventType(event)} · ${formatParentEventWhen(
                      event.starts_at,
                    )}${event.city ? ` · ${event.city}` : ''}`}
                  >
                    {event.location_label ? (
                      <ProDayText variant="caption" muted>
                        {event.location_label}
                      </ProDayText>
                    ) : null}
                    <ProDayText variant="caption">
                      {t('parent.agenda.rsvp', { status: parentRsvpStatusLabel(rsvp) })}
                    </ProDayText>

                    <ParentRsvpChoiceRow
                      current={rsvp}
                      busy={rsvpBusyId === event.id}
                      onChoose={(choice) => void onRsvp(event.id, choice)}
                    />

                    <View style={styles.row}>
                      <ParentActionButton
                        label={open ? 'Masquer retard' : 'Signaler un retard'}
                        tone={open ? 'ghost' : 'ghost'}
                        icon="warning"
                        onPress={() => setExpandedId(open ? null : event.id)}
                      />
                      {event.location_label || event.city ? (
                        <ParentActionButton
                          label="Ouvrir Maps"
                          tone="ghost"
                          icon="location"
                          onPress={() => {
                            const q = encodeURIComponent(
                              [event.location_label, event.city].filter(Boolean).join(', '),
                            );
                            void Linking.openURL(`https://maps.apple.com/?q=${q}`);
                          }}
                        />
                      ) : null}
                    </View>
                    {open ? (
                      <LateReportControl
                        eventId={event.id}
                        playerUid={selected.uid}
                        playerName={selected.display_name}
                        currentRsvp={rsvp}
                        reportedByParent
                        enablePickupLate
                        onReported={() => void load()}
                      />
                    ) : null}
                  </ParentSectionCard>
                );
              })}
          </>
        )}
      </ScrollView>
    </ParentPageFrame>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
