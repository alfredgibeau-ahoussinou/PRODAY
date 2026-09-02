import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
  CoachSettingsGroup,
  CoachSettingsRow,
  CoachText,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import {
  getPendingInviteeUids,
  isCoachDetectionEvent,
  isCoachEventHubReady,
  isCoachMatchEvent,
  isCoachMeetingEvent,
  isCoachPlanningRelevant,
  isCoachTrainingEvent,
  resolveEventSessionStatus,
  type EventSessionStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import {
  executeBulkRsvpReminders,
  getPendingConvocationsSummary,
} from '../../utils/coachRsvpReminders';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { teamEventsService } from '../../services/teamEvents.service';
import { membershipsService } from '../../services/memberships.service';
import type { Membership } from '../../models/Membership';
import { userCanManageConvocations, resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  filterMembersForTeam,
  filterTrainingsForTeam,
  teamPlayerUids,
} from '../../utils/coachTeamTheme';
import { FederationSyncDrawer } from "./FederationSyncDrawer";
import { federationService } from "../../services/federation.service";
import { ActivityIndicator } from "react-native";
import { CoachTeamSwitcher } from './CoachTeamSwitcher';
import { TrainingRosterPreview } from './CoachTrainingTeamRoster';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { radius, spacing } from '../../theme/designTokens';

function isPlanningVisible(event: TeamEvent): boolean {
  if (!isCoachPlanningRelevant(event)) return false;
  const status = resolveEventSessionStatus(event);
  if (status === 'in_progress') return true;
  if (status === 'finished') return false;
  return event.starts_at.getTime() > Date.now() - 6 * 3600_000;
}

function statusLabel(status: EventSessionStatus, t: (key: string) => string): string {
  if (status === 'in_progress') return t('coach.portal.planning.statusInProgress');
  if (status === 'finished') return t('coach.portal.planning.statusFinished');
  return t('coach.portal.planning.statusScheduled');
}

function statusTone(status: EventSessionStatus, tokens: CoachThemeTokens): string {
  if (status === 'in_progress') return tokens.accent;
  if (status === 'finished') return tokens.muted;
  return tokens.foreground;
}

type CardVariant = 'training' | 'match' | 'detection' | 'meeting';

export const CoachPlanningChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const { tokens, teamId: activeTeamId } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [remindingRsvp, setRemindingRsvp] = useState(false);
  const [syncDrawerVisible, setSyncDrawerVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [syncedTeamName, setSyncedTeamName] = useState("");

  const clubId = profile.profile.club_id;

  const pendingSummary = useMemo(() => getPendingConvocationsSummary(events), [events]);

  const handleBulkReminder = async () => {
    if (pendingSummary.totalPendingCount === 0) {
      Alert.alert('Convocations', 'Toutes les convocations sont à jour.');
      return;
    }
    setRemindingRsvp(true);
    try {
      const res = await executeBulkRsvpReminders(events, { user: profile });
      Alert.alert(
        'Relance groupée envoyée',
        `${res.remindedCount} relance(s) envoyée(s) pour ${res.eventCount} convocation(s) en attente.`,
      );
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingRsvp(false);
    }
  };

  const handleEventReminder = async (event: TeamEvent) => {
    const pendingUids = getPendingInviteeUids(event);
    if (pendingUids.length === 0) {
      Alert.alert('Convocation', 'Tous les joueurs convoqués ont répondu.');
      return;
    }
    try {
      const res = await teamEventsService.sendRsvpReminders(event.id, { user: profile });
      Alert.alert(
        'Relance envoyée',
        `${res.remindedCount} relance(s) envoyée(s) pour « ${event.title} ».`,
      );
      onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    }
  };

  useEffect(() => {
    if (!clubId) return;
    void membershipsService.listByClub(clubId).then(setMemberships).catch(() => setMemberships([]));
  }, [clubId, members.length]);

  const teamMembers = useMemo(
    () => filterMembersForTeam(members, memberships, activeTeamId),
    [members, memberships, activeTeamId],
  );
  const teamUids = useMemo(
    () => teamPlayerUids(memberships, activeTeamId),
    [memberships, activeTeamId],
  );

  const { trainings, matches, detections, meetings } = useMemo(() => {
    const visible = [...events].filter(isPlanningVisible);
    const sortByStart = (a: TeamEvent, b: TeamEvent) =>
      a.starts_at.getTime() - b.starts_at.getTime();
    const visibleTrainings = visible.filter(isCoachTrainingEvent);
    return {
      trainings: filterTrainingsForTeam(visibleTrainings, activeTeamId, teamUids).sort(sortByStart),
      matches: visible.filter(isCoachMatchEvent).sort(sortByStart),
      detections: visible.filter(isCoachDetectionEvent).sort(sortByStart),
      meetings: visible.filter(isCoachMeetingEvent).sort(sortByStart),
    };
  }, [events, activeTeamId, teamUids]);

  const hasAny =
    trainings.length > 0 ||
    matches.length > 0 ||
    detections.length > 0 ||
    meetings.length > 0;

  const openCreate = () => {
    if (!canManage) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    if (shellNav) shellNav.requestNav('gestion');
    else nav.openDashboard('gestion');
  };

  const openEventHub = (event: TeamEvent) => {
    if (!isCoachEventHubReady(event)) return;
    tabNav.openMatchs({
      eventId: event.id,
      hubChapter: isCoachMatchEvent(event) ? 'apercu' : undefined,
    });
  };

  const confirmDelete = (event: TeamEvent) => {
    const isMatch = isCoachMatchEvent(event);
    const isDetection = isCoachDetectionEvent(event);
    Alert.alert(
      t('coach.portal.planning.confirmDeleteTitle'),
      isMatch
        ? t('coach.portal.planning.confirmDeleteMatch')
        : isDetection
          ? t('coach.portal.planning.confirmDeleteDetection')
          : t('coach.portal.planning.confirmDeleteTraining'),
      [
        { text: t('coach.portal.planning.cancel'), style: 'cancel' },
        {
          text: t('coach.portal.planning.delete'),
          style: 'destructive',
          onPress: () => void deleteEvent(event),
        },
      ],
    );
  };

  const deleteEvent = async (event: TeamEvent) => {
    try {
      await teamEventsService.deleteEvent(event.id, { user: profile });
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const renderStatusBadge = (event: TeamEvent, variant: CardVariant) => {
    const status = resolveEventSessionStatus(event);
    const borderColor =
      variant === 'match'
        ? 'rgba(255, 180, 50, 0.55)'
        : variant === 'detection'
          ? 'rgba(120, 200, 255, 0.55)'
          : tokens.accent;
    const bgColor =
      variant === 'match'
        ? 'rgba(255, 180, 50, 0.12)'
        : variant === 'detection'
          ? 'rgba(120, 200, 255, 0.12)'
          : tokens.soft;

    return (
      <View style={[styles.statusBadge, { borderColor, backgroundColor: bgColor }]}>
        <CoachText variant="caption" style={{ color: statusTone(status, tokens), fontWeight: '700' }}>
          {statusLabel(status, t)}
        </CoachText>
      </View>
    );
  };

  const cardIcon = (variant: CardVariant) => {
    if (variant === 'match') return { name: 'trophy' as const, color: 'rgba(255, 180, 50, 0.95)' };
    if (variant === 'detection') return { name: 'search' as const, color: 'rgba(120, 200, 255, 0.95)' };
    if (variant === 'meeting') return { name: 'mail' as const, color: tokens.muted };
    return { name: 'calendar' as const, color: tokens.accent };
  };

  const cardBorder = (variant: CardVariant) => {
    if (variant === 'match') return 'rgba(255, 180, 50, 0.45)';
    if (variant === 'detection') return 'rgba(120, 200, 255, 0.45)';
    return tokens.accent;
  };

  const openHubLabel = (variant: CardVariant) => {
    if (variant === 'match') return t('coach.portal.planning.openMatchHub');
    if (variant === 'detection') return t('coach.portal.planning.openDetectionHub');
    if (variant === 'meeting') return t('coach.portal.planning.openMeetingHub');
    return t('coach.portal.planning.openTrainingHub');
  };

  const renderEventCard = (event: TeamEvent, variant: CardVariant) => {
    const ready = isCoachEventHubReady(event);
    const icon = cardIcon(variant);
    const pendingUids = getPendingInviteeUids(event);

    return (
      <View
        key={event.id}
        style={[styles.eventCard, { backgroundColor: tokens.surface, borderColor: cardBorder(variant) }]}
      >
        <PressableSpring
          onPress={() => (ready ? openEventHub(event) : undefined)}
          scaleTo={0.98}
          haptic={ready}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Icon name={icon.name} size={16} color={icon.color} />
              <CoachText variant="section" style={styles.cardTitle}>
                {event.title}
              </CoachText>
            </View>
            {renderStatusBadge(event, variant)}
          </View>
          <CoachText variant="caption" muted>
            {formatCalendarDate(event.starts_at)}
            {event.city ? ` · ${event.city}` : ''}
            {variant === 'training' && event.session_plan?.duration_min
              ? ` · ${event.session_plan.duration_min} min`
              : ''}
            {variant === 'detection' && event.max_participants
              ? ` · ${event.max_participants} places`
              : ''}
          </CoachText>
          {event.session_plan?.focus ? (
            <CoachText variant="caption" accent>
              {event.session_plan.focus}
            </CoachText>
          ) : null}
          {variant === 'detection' && (event.categories?.length ?? 0) > 0 ? (
            <CoachText variant="caption" muted>
              {(event.categories ?? []).join(' · ')}
            </CoachText>
          ) : null}
          {variant === 'training' ? (
            <TrainingRosterPreview event={event} teamMembers={teamMembers} />
          ) : null}
          {!ready ? (
            <CoachText variant="caption" muted style={styles.incompleteHint}>
              {t('coach.portal.planning.hubIncompleteHint')}
            </CoachText>
          ) : null}
        </PressableSpring>

        {pendingUids.length > 0 ? (
          <PressableSpring
            onPress={() => void handleEventReminder(event)}
            scaleTo={0.96}
            haptic
            style={styles.cardReminderBtn}
          >
            <Icon name="mail" size={13} color={tokens.accent} />
            <CoachText variant="caption" accent style={styles.cardReminderBtnText}>
              Relancer ({pendingUids.length} sans réponse)
            </CoachText>
          </PressableSpring>
        ) : null}

        {ready ? (
          <PressableSpring onPress={() => openEventHub(event)} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              {openHubLabel(variant)}
            </CoachText>
          </PressableSpring>
        ) : (
          <PressableSpring onPress={openCreate} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              {t('coach.portal.planning.hubIncompleteCta')}
            </CoachText>
          </PressableSpring>
        )}

        {canManage ? (
          <CoachSettingsGroup>
            <CoachSettingsRow
              icon="close"
              label={
                variant === 'match'
                  ? t('coach.portal.planning.deleteMatch')
                  : variant === 'detection'
                    ? t('coach.portal.planning.deleteDetection')
                    : t('coach.portal.planning.deleteTraining')
              }
              onPress={() => confirmDelete(event)}
              destructive
              last
            />
          </CoachSettingsGroup>
        ) : null}
      </View>
    );
  };

  return (
    <CoachPane
      title={getCoachPageIdentity('planning').title}
      actions={[
        {
          icon: 'add',
          onPress: openCreate,
          accessibilityLabel: t('coach.portal.planning.create'),
        },
      ]}
    >
      <CoachChapterScroll>
        <View style={styles.teamSwitcherWrap}>
          <CoachTeamSwitcher />

        {isSyncing ? (
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.accent }]}>
            <View style={styles.bulkReminderInfo}>
              <ActivityIndicator size="small" color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchronisation en cours...
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupération des données officielles
                </CoachText>
              </View>
            </View>
          </View>
        ) : hasSynced ? (
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
            <View style={styles.bulkReminderInfo}>
              <Icon name="checkmark-circle" size={18} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  {syncedTeamName || "Championnat lié"}
                </CoachText>
                <CoachText variant="caption" muted>
                  Mise à jour auto. activée
                </CoachText>
              </View>
            </View>
            <PressableSpring
              onPress={async () => {
                setIsSyncing(true);
                await federationService.triggerSync("fed-club-torcy", "c2", "Équipe 1", () => {});
                setIsSyncing(false);
              }}
              scaleTo={0.96}
              haptic
              style={[styles.bulkReminderBtn, { backgroundColor: tokens.border }]}
            >
              <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: "600" }}>
                Actualiser
              </CoachText>
            </PressableSpring>
          </View>
        ) : (
          <PressableSpring
            onPress={() => setSyncDrawerVisible(true)}
            scaleTo={0.96}
            haptic
            style={styles.syncBtnBanner}
          >
            <View style={styles.bulkReminderInfo}>
              <Icon name="calendar" size={18} color={tokens.foreground} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchroniser les rencontres
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupérez vos matchs officiels (FFF, etc.)
                </CoachText>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.muted} />
          </PressableSpring>
        )}

        </View>

        {/* Bannière Relance Groupée en 1 clic */}
        {pendingSummary.totalPendingCount > 0 ? (
          <View style={styles.bulkReminderBanner}>
            <View style={styles.bulkReminderInfo}>
              <Icon name="mail" size={18} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  {pendingSummary.totalPendingCount} convocation{pendingSummary.totalPendingCount > 1 ? 's' : ''} en attente
                </CoachText>
                <CoachText variant="caption" muted>
                  {pendingSummary.eventsWithPending.length} événement{pendingSummary.eventsWithPending.length > 1 ? 's' : ''} à confirmer
                </CoachText>
              </View>
            </View>
            <PressableSpring
              onPress={() => void handleBulkReminder()}
              scaleTo={0.96}
              haptic
              style={styles.bulkReminderBtn}
            >
              <CoachText variant="caption" inverse style={styles.bulkReminderBtnText}>
                {remindingRsvp ? 'Envoi…' : '⚡ Relance groupée'}
              </CoachText>
            </PressableSpring>
          </View>
        ) : null}
        {!hasAny ? (
          <CoachEmptyState
            title={t('coach.portal.planning.empty')}
            body={t('coach.portal.planning.emptyBody')}
            cta={t('coach.portal.planning.create')}
            onPress={openCreate}
          />
        ) : (
          <>
            <CoachSectionCard
              kicker={t('coach.portal.planning.sectionTrainings')}
              title={t('coach.portal.planning.sectionTrainings')}
            >
              {trainings.length === 0 ? (
                <CoachText variant="caption" muted>
                  {t('coach.portal.planning.sectionTrainingsEmpty')}
                </CoachText>
              ) : (
                trainings.map((event) => renderEventCard(event, 'training'))
              )}
            </CoachSectionCard>

            <CoachSectionCard
              kicker={t('coach.portal.planning.sectionDetections')}
              title={t('coach.portal.planning.sectionDetections')}
            >
              {detections.length === 0 ? (
                <CoachText variant="caption" muted>
                  {t('coach.portal.planning.sectionDetectionsEmpty')}
                </CoachText>
              ) : (
                detections.map((event) => renderEventCard(event, 'detection'))
              )}
            </CoachSectionCard>

            <CoachSectionCard
              kicker={t('coach.portal.planning.sectionMatches')}
              title={t('coach.portal.planning.sectionMatches')}
            >
              {matches.length === 0 ? (
                <CoachText variant="caption" muted>
                  {t('coach.portal.planning.sectionMatchesEmpty')}
                </CoachText>
              ) : (
                matches.map((event) => renderEventCard(event, 'match'))
              )}
            </CoachSectionCard>

            {meetings.length > 0 ? (
              <CoachSectionCard
                kicker={t('coach.portal.planning.sectionMeetings')}
                title={t('coach.portal.planning.sectionMeetings')}
              >
                {meetings.map((event) => renderEventCard(event, 'meeting'))}
              </CoachSectionCard>
            ) : null}
          </>
        )}

      <FederationSyncDrawer
        visible={syncDrawerVisible}
        onClose={() => setSyncDrawerVisible(false)}
        onSyncComplete={(clubName) => {
          setSyncedTeamName(clubName);
          setHasSynced(true);
        }}
      />

      </CoachChapterScroll>
    </CoachPane>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    teamSwitcherWrap: {
      marginBottom: spacing.sm,
    },
    eventCard: {
      borderRadius: 14,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.sm,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    cardTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    cardTitle: { flex: 1 },
    statusBadge: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    link: { fontWeight: '800', marginTop: spacing.xs },
    incompleteHint: { marginTop: spacing.xs, fontStyle: 'italic' },
    cardReminderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
      paddingVertical: 4,
      paddingHorizontal: spacing.xs,
      alignSelf: 'flex-start',
    },
    cardReminderBtnText: {
      fontWeight: '700',
      fontSize: 12,
    },
    syncBtnBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
    },

    bulkReminderBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      gap: spacing.sm,
    },
    bulkReminderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bulkReminderTitle: {
      fontWeight: '800',
      color: tokens.foreground,
    },
    bulkReminderBtn: {
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      backgroundColor: tokens.accent,
    },
    bulkReminderBtnText: {
      fontWeight: '700',
      color: tokens.onAccent,
      fontSize: 12,
    },
  });
