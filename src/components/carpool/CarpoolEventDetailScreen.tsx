import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { EventCarpoolPanel } from '../team/EventCarpoolPanel';
import { AppDetailHeader } from '../app';
import { ScreenHeader } from '../ui/ScreenHeader';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

interface CarpoolEventDetailScreenProps {
  eventId: string;
  profile: User;
  onBack: () => void;
}

export const CarpoolEventDetailScreen: React.FC<CarpoolEventDetailScreenProps> = ({
  eventId,
  profile,
  onBack,
}) => {
  const { colors } = useAppTheme();
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff =
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';

  const load = useCallback(async () => {
    setLoading(true);
    const e = await teamEventsService.getById(eventId);
    setEvent(e);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !event) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const location = [event.city, event.location_label].filter(Boolean).join(' · ');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Événement" onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppDetailHeader
          caption={EVENT_TYPE_LABELS[event.event_type]}
          title={event.title}
          subtitle={`${formatCalendarDate(event.starts_at)}${location ? ` · ${location}` : ''}`}
          footer={
            <ProDayText variant="caption" muted>
              {event.organizer_name}
            </ProDayText>
          }
        />

        <EventCarpoolPanel
          event={event}
          profile={profile}
          isStaff={isStaff}
          onUpdated={load}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
});
