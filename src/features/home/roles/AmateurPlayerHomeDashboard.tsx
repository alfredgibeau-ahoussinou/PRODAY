import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffStatRow,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { useAppTheme } from '../../../context/ProductLineContext';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import {
  countRsvpYes,
  EVENT_TYPE_LABELS,
  userRsvp,
  type RsvpStatus,
} from '../../../models/TeamEvent';
import { teamEventsService } from '../../../services/teamEvents.service';
import { membershipsService } from '../../../services/memberships.service';
import type { Membership } from '../../../models/Membership';
import {
  countRemainingCarpoolSeats,
  getNextMatchEvent,
  getNextTeamEvent,
  isAmateurPlayerWithoutClub,
} from '../../../utils/amateurPlayerHome';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { ProDayGradient } from '../../../components/ui/ProDayGradient';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { PressableSpring, StaggerReveal } from '../../../components/motion';
import { spacing, radius } from '../../../theme/designTokens';

const RSVP_OPTIONS: { status: RsvpStatus; labelKey: string }[] = [
  { status: 'yes', labelKey: 'roleHome.amateurPlayer.rsvpYes' },
  { status: 'no', labelKey: 'roleHome.amateurPlayer.rsvpNo' },
  { status: 'maybe', labelKey: 'roleHome.amateurPlayer.rsvpMaybe' },
];

type QuickActionId = 'carpool' | 'messages' | 'health';

const QUICK_ACTIONS: { id: QuickActionId; icon: IconName; titleKey: string; subKey: string }[] = [
  {
    id: 'carpool',
    icon: 'car',
    titleKey: 'roleHome.amateurPlayer.action.carpool',
    subKey: 'roleHome.amateurPlayer.action.carpoolSub',
  },
  {
    id: 'messages',
    icon: 'chat',
    titleKey: 'roleHome.amateurPlayer.action.messages',
    subKey: 'roleHome.amateurPlayer.action.messagesSub',
  },
  {
    id: 'health',
    icon: 'heart',
    titleKey: 'roleHome.amateurPlayer.action.health',
    subKey: 'roleHome.amateurPlayer.action.healthSub',
  },
];

export const AmateurPlayerHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { data, refresh } = useDashboardData(profile);
  const nav = useTabNavigationActions();

  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  const loadMembership = useCallback(async () => {
    setMembershipLoading(true);
    try {
      const active = await membershipsService.getActiveForPlayer(profile.uid);
      setMembership(active);
    } finally {
      setMembershipLoading(false);
    }
  }, [profile.uid]);

  useEffect(() => {
    void loadMembership();
  }, [loadMembership]);

  const nextEvent = useMemo(() => getNextTeamEvent(data.teamEvents), [data.teamEvents]);
  const nextMatch = useMemo(() => getNextMatchEvent(data.teamEvents), [data.teamEvents]);
  const matchCarpoolSeats = useMemo(
    () => (nextMatch ? countRemainingCarpoolSeats(nextMatch) : null),
    [nextMatch],
  );

  const withoutClub = isAmateurPlayerWithoutClub(profile, membership);
  const myRsvp = nextEvent ? userRsvp(nextEvent, profile.uid) : 'pending';
  const canRespond =
    nextEvent &&
    (nextEvent.invitee_uids.includes(profile.uid) ||
      profile.uid === nextEvent.organizer_uid ||
      nextEvent.event_type === 'detection');

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadMembership()]);
    await onRefresh?.();
  }, [refresh, loadMembership, onRefresh]);

  const handleRsvp = async (status: RsvpStatus) => {
    if (!nextEvent) return;
    setRsvpBusy(true);
    try {
      await teamEventsService.updateRsvp(nextEvent.id, profile.uid, status);
      await refresh();
    } finally {
      setRsvpBusy(false);
    }
  };

  const openEvent = (eventId: string) => {
    nav.openTeamEvent(eventId);
  };

  const handleQuickAction = (id: QuickActionId) => {
    if (id === 'carpool') nav.setActiveTab('covoiturage');
    if (id === 'messages') nav.setActiveTab('messages');
    if (id === 'health') nav.setActiveTab('sante');
  };

  const attendanceStats = nextEvent
    ? [
        {
          label: t('roleHome.amateurPlayer.present'),
          value: `${countRsvpYes(nextEvent)}/${nextEvent.invitee_uids.length || '—'}`,
          highlight: true,
        },
        {
          label: t('roleHome.amateurPlayer.pending'),
          value: String(
            nextEvent.invitee_uids.filter(
              (uid) => userRsvp(nextEvent, uid) === 'pending',
            ).length,
          ),
        },
      ]
    : [];

  return (
    <StaffRoleHomeShell
      profile={profile}
      role="player"
      unreadMessages={unreadMessages}
      globalScore={data.pulse.score}
      loading={data.loading || membershipLoading}
      onRefresh={() => void handleRefresh()}
      refreshing={refreshing}
    >
      {withoutClub ? (
        <GlassCard variant="accent" style={styles.joinCta}>
          <ProDayText variant="section">{t('roleHome.amateurPlayer.noClubTitle')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('roleHome.amateurPlayer.noClubSub')}
          </ProDayText>
          <PressableSpring
            style={[styles.joinBtn, { backgroundColor: colors.accent }]}
            onPress={() => nav.setActiveTab('recrutement')}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="body" inverse>
              {t('roleHome.amateurPlayer.joinClub')}
            </ProDayText>
          </PressableSpring>
        </GlassCard>
      ) : null}

      <StaffSectionTitle
        title={t('roleHome.amateurPlayer.nextEventTitle')}
        subtitle={
          nextEvent
            ? `${EVENT_TYPE_LABELS[nextEvent.event_type]} · ${formatCalendarDate(nextEvent.starts_at)}`
            : t('roleHome.amateurPlayer.noEvent')
        }
      />

      {nextEvent ? (
        <GlassCard style={styles.eventCard}>
          <ProDayText variant="section">{nextEvent.title}</ProDayText>
          <ProDayText variant="body" muted>
            {nextEvent.location_label ?? nextEvent.city}
          </ProDayText>

          {canRespond ? (
            <View style={styles.rsvpBlock}>
              <ProDayText variant="eyebrow" accent>
                {t('roleHome.amateurPlayer.rsvpPrompt')}
              </ProDayText>
              <View style={styles.rsvpRow}>
                {RSVP_OPTIONS.map((opt, index) => {
                  const active = myRsvp === opt.status;
                  return (
                    <StaggerReveal key={opt.status} index={index} delayStep={45}>
                      <PressableSpring
                        onPress={() => void handleRsvp(opt.status)}
                        disabled={rsvpBusy}
                        scaleTo={0.94}
                        haptic
                      >
                        <ProDayGradient
                          kind={active ? 'cta' : 'card'}
                          style={[
                            styles.rsvpBtn,
                            !active && { borderColor: colors.border, borderWidth: 1 },
                          ]}
                        >
                          <ProDayText
                            variant="caption"
                            inverse={active}
                            accent={!active}
                            style={styles.rsvpText}
                          >
                            {t(opt.labelKey)}
                          </ProDayText>
                        </ProDayGradient>
                      </PressableSpring>
                    </StaggerReveal>
                  );
                })}
              </View>
            </View>
          ) : null}

          {attendanceStats.length > 0 ? <StaffStatRow items={attendanceStats} /> : null}
        </GlassCard>
      ) : (
        <StaffEmptyCard message={t('roleHome.amateurPlayer.noEvent')} />
      )}

      <StaffSectionTitle
        title={t('roleHome.amateurPlayer.nextMatchTitle')}
        subtitle={t('roleHome.amateurPlayer.nextMatchSub')}
      />

      {nextMatch ? (
        <StaffListCard
          index={1}
          title={nextMatch.title}
          subtitle={`${formatCalendarDate(nextMatch.starts_at)} · ${nextMatch.city}`}
          meta={
            matchCarpoolSeats !== null
              ? t('roleHome.amateurPlayer.carpoolSeats', { n: matchCarpoolSeats })
              : undefined
          }
          onPress={() => openEvent(nextMatch.id)}
        />
      ) : (
        <StaffEmptyCard message={t('roleHome.amateurPlayer.noMatch')} />
      )}

      <StaffSectionTitle
        title={t('roleHome.amateurPlayer.coachFeedTitle')}
        subtitle={t('roleHome.amateurPlayer.coachFeedSub')}
      />
      <GlassCard style={styles.coachCard}>
        <ProDayText variant="body" muted>
          {t('roleHome.amateurPlayer.coachFeedPlaceholder')}
        </ProDayText>
      </GlassCard>

      <StaffSectionTitle title={t('roleHome.quickActions')} />
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action, index) => (
          <StaggerReveal key={action.id} index={index + 2} delayStep={40}>
            <PressableSpring
              style={[styles.quickTile, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => handleQuickAction(action.id)}
              scaleTo={0.97}
              haptic
            >
              <Icon name={action.icon} size={20} color={colors.accent} />
              <ProDayText variant="body" style={styles.quickTitle}>
                {t(action.titleKey)}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={2}>
                {t(action.subKey)}
              </ProDayText>
            </PressableSpring>
          </StaggerReveal>
        ))}
      </View>
    </StaffRoleHomeShell>
  );
};

const styles = StyleSheet.create({
  joinCta: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  eventCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rsvpBlock: { marginTop: spacing.sm, gap: spacing.sm },
  rsvpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rsvpBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 88,
    alignItems: 'center',
  },
  rsvpText: { fontWeight: '700' },
  coachCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  quickTitle: { fontWeight: '600' },
});
