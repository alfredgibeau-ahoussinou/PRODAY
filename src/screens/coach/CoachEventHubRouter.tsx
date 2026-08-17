import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import {
  coachEventHubKind,
  isCoachEventHubReady,
  type TeamEvent,
} from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { CoachMatchEventHub } from './CoachMatchEventHub';
import { CoachTrainingEventHub } from './CoachTrainingEventHub';
import { CoachDetectionEventHub } from './CoachDetectionEventHub';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import { CoachText } from '../../components/coach/coachPortalUi';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';

export type CoachEventHubRouterProps = {
  eventId: string;
  onBack: () => void;
  initialChapter?: MatchHubChapterId;
  onOpenCarpool?: () => void;
};

export function CoachEventHubRouter({
  eventId,
  onBack,
  initialChapter = 'apercu',
  onOpenCarpool,
}: CoachEventHubRouterProps) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setEvent(await teamEventsService.getById(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        <ActivityIndicator color={tokens.accent} size="large" style={styles.loader} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: tokens.bg }]}>
        <CoachText variant="body" muted>
          {t('coach.portal.eventHub.notFound')}
        </CoachText>
      </View>
    );
  }

  const kind = coachEventHubKind(event);
  const ready = isCoachEventHubReady(event);

  if (!ready) {
    return (
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        <TeamEventDetailScreen eventId={eventId} onBack={onBack} />
      </View>
    );
  }

  switch (kind) {
    case 'match':
      return (
        <CoachMatchEventHub
          eventId={eventId}
          initialChapter={initialChapter}
          onBack={onBack}
          onOpenCarpool={onOpenCarpool}
        />
      );
    case 'training':
      return (
        <CoachTrainingEventHub
          eventId={eventId}
          onBack={onBack}
          onOpenCarpool={onOpenCarpool}
        />
      );
    case 'detection':
      return <CoachDetectionEventHub eventId={eventId} onBack={onBack} />;
    case 'meeting':
    default:
      return <TeamEventDetailScreen eventId={eventId} onBack={onBack} />;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loader: { marginTop: 48 },
});
