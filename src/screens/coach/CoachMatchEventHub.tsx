import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import { COACH_MATCH_HUB_CHAPTERS } from '../../content/coachMatchHubChapters';
import {
  countRsvpYes,
  EVENT_TYPE_LABELS,
  getPendingInviteeUids,
} from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { useAuth } from '../../context/AuthContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { canViewTeamEvent } from '../../utils/teamEventAccess';
import { resolveLiveState } from '../../utils/matchLive';
import { EventLineupScreen } from '../EventLineupScreen';
import { MatchHubLineupTab } from '../../components/matchs/hub/MatchHubLineupTab';
import { MatchHubLiveTab } from '../../components/matchs/hub/MatchHubLiveTab';
import { MatchHubStatsTab } from '../../components/matchs/hub/MatchHubStatsTab';
import { CoachMatchSkinProvider } from '../../components/matchs/matchCenterUi';
import { CoachEventAttendanceList } from '../../components/coach/match/CoachEventAttendanceList';
import { CoachMatchSummaryTab } from '../../components/coach/match/CoachMatchSummaryTab';
import { CoachKpiRow, CoachText } from '../../components/coach/coachPortalUi';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { Icon } from '../../components/ui/Icon';
import { PushScreenTransition } from '../../components/motion';
import { spacing, radius } from '../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { VeoMatchAssociateModal } from '../../components/video/VeoMatchAssociateModal';
import { Ionicons } from '@expo/vector-icons';
import { CoachShareConvocationModal } from '../../components/coach/convocation/CoachShareConvocationModal';

type SubView = 'hub' | 'lineup_edit';

export type CoachMatchEventHubProps = {
  eventId: string;
  onBack: () => void;
  initialChapter?: MatchHubChapterId;
  onOpenCarpool?: () => void;
};

export function CoachMatchEventHub({
  eventId,
  onBack,
  initialChapter = 'effectif',
  onOpenCarpool,
}: CoachMatchEventHubProps) {
  const profile = useSessionProfile();
  const { isAdmin } = useAuth();
  const [subView, setSubView] = useState<SubView>('hub');
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<MatchHubChapterId>(initialChapter);
  const [associateVeoOpen, setAssociateVeoOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setEvent(await teamEventsService.getById(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);

  const isStaff =
    Boolean(isAdmin) ||
    profile?.role === 'coach' ||
    profile?.role === 'organizer' ||
    profile?.role === 'agent' ||
    profile?.role === 'club';

  const hasAccess = Boolean(
    event &&
      profile &&
      canViewTeamEvent(event, profile, { isAdmin }),
  );
  const canManageLive = Boolean(isStaff || profile?.uid === event?.organizer_uid);
  const reportLocked = Boolean(event?.match_report_finalized_at) && !canManageLive;

  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  const pointedCount = useMemo(() => {
    if (!event?.attendance_marks) return 0;
    return Object.keys(event.attendance_marks).length;
  }, [event?.attendance_marks]);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={tokens.accent} size="large" />
      </View>
    );
  }

  if (!event || !profile) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={tokens.foreground} />
          <CoachText variant="body" accent>
            Matchs
          </CoachText>
        </Pressable>
        <CoachText variant="body" muted>
          Événement introuvable.
        </CoachText>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.root}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={tokens.foreground} />
          <CoachText variant="body" accent>
            Matchs
          </CoachText>
        </Pressable>
        <View style={styles.denied}>
          <Icon name="lock" size={28} color={tokens.muted} />
          <CoachText variant="section">Accès restreint</CoachText>
          <CoachText variant="body" muted style={styles.deniedBody}>
            Réservé au staff ou aux personnes convoquées.
          </CoachText>
        </View>
      </View>
    );
  }

  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;
  const live = resolveLiveState(event);

  const tabContent = (() => {
    switch (chapter) {
      case 'apercu':
        return (
          <CoachMatchSummaryTab
            event={event}
            profile={profile}
            onOpenChapter={setChapter}
            onOpenCarpool={onOpenCarpool}
            onOpenVeoAssociate={event.club_id ? () => setAssociateVeoOpen(true) : undefined}
          />
        );
      case 'effectif':
        return (
          <CoachEventAttendanceList event={event} profile={profile} onUpdated={load} />
        );
      case 'composition':
        return (
          <MatchHubLineupTab
            event={event}
            canEdit={canManageLive && !reportLocked}
            onEditLineup={() => setSubView('lineup_edit')}
          />
        );
      case 'live':
        return (
          <MatchHubLiveTab
            event={event}
            profile={profile}
            canManage={canManageLive}
            reportLocked={reportLocked}
            onUpdated={load}
          />
        );
      case 'stats':
        return (
          <MatchHubStatsTab event={event} profile={profile} onUpdated={load} />
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <View style={styles.root}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
            <Icon name="arrow-back" size={22} color={tokens.foreground} />
            <CoachText variant="body" accent>
              Matchs
            </CoachText>
          </Pressable>
          <Pressable
            onPress={() => setShareModalOpen(true)}
            style={[styles.shareBtn, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
            accessibilityRole="button"
            accessibilityLabel="Partager la convocation"
          >
            <Ionicons name="share-social-outline" size={15} color={tokens.accent} />
            <CoachText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
              Partager convocation
            </CoachText>
          </Pressable>
        </View>

        <View style={styles.meta}>
          <CoachText variant="caption" muted style={styles.type}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </CoachText>
          <CoachText variant="title" style={styles.title} numberOfLines={2}>
            {event.title}
          </CoachText>
          <CoachText variant="body" muted>
            {formatCalendarDate(event.starts_at)}
          </CoachText>
          <CoachText variant="caption" muted numberOfLines={2}>
            {event.city}
            {event.location_label ? ` · ${event.location_label}` : ''}
          </CoachText>
          {(live.status === 'live' || live.status === 'halftime') && (
            <CoachText variant="caption" accent style={styles.liveBadge}>
              En direct · {live.home_score}-{live.away_score}
            </CoachText>
          )}
        </View>

        <View style={styles.kpiWrap}>
          <CoachKpiRow
            items={[
              { label: 'Confirmés', value: String(yesCount) },
              { label: 'En attente', value: String(pendingCount) },
              { label: 'Pointés', value: String(pointedCount) },
            ]}
          />
        </View>

        <View style={styles.segmentTrack}>
          {COACH_MATCH_HUB_CHAPTERS.map((tab) => {
            const on = chapter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setChapter(tab.id)}
                style={[styles.segmentBtn, on && styles.segmentBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <CoachText
                  variant="caption"
                  style={[styles.segmentLabel, on && styles.segmentLabelOn]}
                >
                  {tab.label}
                </CoachText>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CoachMatchSkinProvider enabled>{tabContent}</CoachMatchSkinProvider>
        </ScrollView>
      </View>

      <PushScreenTransition active={subView === 'lineup_edit'} backgroundColor={tokens.bg}>
        {subView === 'lineup_edit' ? (
          <EventLineupScreen
            eventId={eventId}
            onBack={() => {
              setSubView('hub');
              void load();
            }}
          />
        ) : null}
      </PushScreenTransition>
      {associateVeoOpen && event.club_id ? (
        <VeoMatchAssociateModal
          visible
          clubId={event.club_id}
          createdByUid={profile.uid}
          eventId={event.id}
          eventTitle={event.title}
          scheduledAt={event.starts_at}
          onClose={() => setAssociateVeoOpen(false)}
          onSuccess={() => void load()}
        />
      ) : null}
      <CoachShareConvocationModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        event={event}
      />
    </>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: tokens.bg,
    },
    centered: { justifyContent: 'center', alignItems: 'center' },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.lg,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    meta: {
      paddingHorizontal: spacing.lg,
      gap: 4,
      paddingBottom: spacing.sm,
    },
    type: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: '600',
      fontSize: 11,
    },
    title: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 26,
      letterSpacing: -0.5,
      lineHeight: 30,
    },
    liveBadge: { fontWeight: '700', marginTop: 4 },
    kpiWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    segmentTrack: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: 3,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      gap: 2,
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 0,
    },
    segmentBtnOn: { backgroundColor: tokens.elevated },
    segmentLabel: { fontWeight: '600', color: tokens.muted, fontSize: 11 },
    segmentLabelOn: { color: tokens.foreground, fontWeight: '700' },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    denied: {
      margin: spacing.lg,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: tokens.surface,
      borderRadius: 18,
    },
    deniedBody: { textAlign: 'center', lineHeight: 22 },
  });
}
