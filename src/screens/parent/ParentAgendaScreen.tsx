import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, RSVP_STATUS_LABELS, type RsvpStatus } from '../../models/TeamEvent';
import { LateReportControl } from '../../components/team/LateReportControl';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';

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

  const rsvpLabel = (status: RsvpStatus): string => {
    return RSVP_STATUS_LABELS[status] ?? status;
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

  const visible = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    if (filter === 'all') return sorted;
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    return sorted.filter((e) => e.starts_at.getTime() >= cutoff);
  }, [events, filter]);

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
          <ParentSectionCard title={t('parent.agenda.empty')}>
            <ProDayText variant="caption" muted>
              Tirez pour actualiser · les retards coach apparaissent dès qu’une séance est planifiée.
            </ProDayText>
          </ParentSectionCard>
        ) : (
          visible.map((event) => {
            const rsvp = event.rsvps?.[selected.uid];
            const open = expandedId === event.id;
            return (
              <ParentSectionCard
                key={event.id}
                title={event.title}
                subtitle={`${EVENT_TYPE_LABELS[event.event_type] ?? event.event_type} · ${event.starts_at.toLocaleString(
                  'fr-FR',
                  {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}${event.city ? ` · ${event.city}` : ''}`}
              >
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
                <View style={styles.row}>
                  <ParentActionButton
                    label={open ? 'Masquer actions' : 'Prévenir le coach'}
                    tone={open ? 'ghost' : 'primary'}
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
          })
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
