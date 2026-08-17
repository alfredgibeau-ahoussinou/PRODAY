import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
  isCoachEventHubReady,
  RSVP_STATUS_LABELS,
  userRsvp,
} from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { canViewTeamEvent } from '../../utils/teamEventAccess';
import { useAuth } from '../../context/AuthContext';
import { CoachKpiRow, CoachText } from '../../components/coach/coachPortalUi';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { Icon } from '../../components/ui/Icon';
import { spacing } from '../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useTranslation } from '../../context/LocaleContext';

export type CoachDetectionEventHubProps = {
  eventId: string;
  onBack: () => void;
};

export function CoachDetectionEventHub({ eventId, onBack }: CoachDetectionEventHubProps) {
  const { t } = useTranslation();
  const profile = useSessionProfile();
  const { isAdmin } = useAuth();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
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

  const hasAccess = Boolean(event && profile && canViewTeamEvent(event, profile, { isAdmin }));
  const ready = Boolean(event && isCoachEventHubReady(event));

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
            {t('coach.portal.eventHub.backPlanning')}
          </CoachText>
        </Pressable>
        <CoachText variant="body" muted>
          {t('coach.portal.eventHub.notFound')}
        </CoachText>
      </View>
    );
  }

  if (!hasAccess || !ready) {
    return (
      <View style={styles.root}>
        <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
          <Icon name="arrow-back" size={22} color={tokens.foreground} />
          <CoachText variant="body" accent>
            {t('coach.portal.eventHub.backPlanning')}
          </CoachText>
        </Pressable>
        <View style={styles.denied}>
          <Icon name="alert-circle" size={28} color={tokens.muted} />
          <CoachText variant="section">{t('coach.portal.planning.hubIncompleteTitle')}</CoachText>
          <CoachText variant="body" muted style={styles.deniedBody}>
            {t('coach.portal.planning.hubIncompleteBody')}
          </CoachText>
        </View>
      </View>
    );
  }

  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;
  const max = event.max_participants ?? 0;

  return (
    <View style={styles.root}>
      <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Icon name="arrow-back" size={22} color={tokens.foreground} />
        <CoachText variant="body" accent>
          {t('coach.portal.eventHub.backPlanning')}
        </CoachText>
      </Pressable>

      <View style={styles.meta}>
        <CoachText variant="caption" muted style={styles.type}>
          {EVENT_TYPE_LABELS.detection}
        </CoachText>
        <CoachText variant="title" style={styles.title} numberOfLines={2}>
          {event.title}
        </CoachText>
        <CoachText variant="body" muted>
          {formatCalendarDate(event.starts_at)}
          {event.city ? ` · ${event.city}` : ''}
        </CoachText>
      </View>

      <View style={styles.kpiWrap}>
        <CoachKpiRow
          items={[
            { label: t('coach.portal.eventHub.confirmed'), value: String(yesCount) },
            { label: t('coach.portal.eventHub.pending'), value: String(pendingCount) },
            { label: t('coach.portal.eventHub.places'), value: `${yesCount}/${max}` },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CoachText variant="caption" accent style={styles.sectionLabel}>
          {t('coach.portal.eventHub.detectionCategories')}
        </CoachText>
        <View style={styles.chipRow}>
          {(event.categories ?? []).map((cat) => (
            <View key={cat} style={[styles.chip, { borderColor: tokens.accent }]}>
              <CoachText variant="caption" accent>
                {cat}
              </CoachText>
            </View>
          ))}
        </View>

        <CoachText variant="caption" accent style={styles.sectionLabel}>
          {t('coach.portal.eventHub.detectionRegistrations')}
        </CoachText>
        {event.invitee_uids.length === 0 ? (
          <CoachText variant="body" muted>
            {t('coach.portal.eventHub.detectionEmpty')}
          </CoachText>
        ) : (
          event.invitee_uids.map((uid) => {
            const status = userRsvp(event, uid);
            return (
              <View key={uid} style={[styles.row, { backgroundColor: tokens.surface }]}>
                <CoachText variant="body" style={styles.rowLabel}>
                  {uid.slice(0, 8)}…
                </CoachText>
                <CoachText variant="caption" muted>
                  {RSVP_STATUS_LABELS[status]}
                </CoachText>
              </View>
            );
          })
        )}

        {event.description ? (
          <>
            <CoachText variant="caption" accent style={styles.sectionLabel}>
              {t('coach.portal.eventHub.description')}
            </CoachText>
            <CoachText variant="body" muted>
              {event.description}
            </CoachText>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    centered: { justifyContent: 'center', alignItems: 'center' },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    meta: { paddingHorizontal: spacing.lg, gap: 4, paddingBottom: spacing.sm },
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
    kpiWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    scroll: { flex: 1, minHeight: 0 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    sectionLabel: { fontWeight: '700', marginTop: spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: 12,
      marginTop: spacing.xs,
    },
    rowLabel: { flex: 1 },
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
