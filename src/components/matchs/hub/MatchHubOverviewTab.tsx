import React from 'react';
import { View, StyleSheet, Share } from 'react-native';
import type { TeamEvent, RsvpStatus } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
  userRsvp,
} from '../../../models/TeamEvent';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { resolveLiveState } from '../../../utils/matchLive';
import { EventCarpoolPanel } from '../../team/EventCarpoolPanel';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { ProDayGradient } from '../../ui/ProDayGradient';
import { Icon } from '../../ui/Icon';
import { PressableSpring, StaggerReveal } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';
import { OpponentMatchDaySheet } from '../OpponentMatchDaySheet';
import { matchDayPdfService } from '../../../services/matchDayPdf.service';

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: 'yes', label: 'Présent' },
  { status: 'maybe', label: 'Peut-être' },
  { status: 'no', label: 'Absent' },
];

const QUICK_NAV = [
  { id: 'live', label: 'Direct', icon: 'time' as const, action: 'live' as const },
  { id: 'lineup', label: 'Compo', icon: 'football' as const, action: 'lineup' as const },
  { id: 'carpool', label: 'Trajet', icon: 'car' as const, action: 'carpool' as const },
];

interface MatchHubOverviewTabProps {
  event: TeamEvent;
  profile: User;
  isStaff: boolean;
  onUpdated: () => void;
  onOpenCarpool?: () => void;
  onRsvp: (status: RsvpStatus) => void;
  rsvpBusy?: boolean;
  onOpenLineup: () => void;
  onOpenLive: () => void;
  /** Staff : ouvre l'association d'une captation VEO rattachée à ce match. */
  onAssociateVeo?: () => void;
}

export const MatchHubOverviewTab: React.FC<MatchHubOverviewTabProps> = ({
  event,
  profile,
  isStaff,
  onUpdated,
  onOpenCarpool,
  onRsvp,
  rsvpBusy,
  onOpenLineup,
  onOpenLive,
  onAssociateVeo,
}) => {
  const { colors } = useAppTheme();
  const live = resolveLiveState(event);
  const myStatus = userRsvp(event, profile.uid);
  const canRespond =
    event.invitee_uids.includes(profile.uid) ||
    profile.uid === event.organizer_uid ||
    event.event_type === 'detection';
  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;

  const shareConvocation = async () => {
    const msg = `Match ProDay. ${event.title}\n${formatCalendarDate(event.starts_at)}\n${live.home_label} ${live.home_score}-${live.away_score} ${live.opponent_name}\n${event.city}`;
    await Share.share({ message: msg });
  };

  const quickItems = QUICK_NAV.filter(
    (item) => item.action !== 'carpool' || Boolean(onOpenCarpool)
  );

  const handleQuickNav = (action: (typeof QUICK_NAV)[number]['action']) => {
    if (action === 'live') onOpenLive();
    if (action === 'lineup') onOpenLineup();
    if (action === 'carpool') onOpenCarpool?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.quickNav}>
        {quickItems.map((item, index) => (
          <StaggerReveal key={item.id} index={index} delayStep={40}>
            <PressableSpring
              style={[styles.quickBtn, { borderColor: colors.border }]}
              onPress={() => handleQuickNav(item.action)}
              scaleTo={0.97}
              haptic
            >
              <Icon name={item.icon} size={18} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.quickText}>
                {item.label}
              </ProDayText>
            </PressableSpring>
          </StaggerReveal>
        ))}
      </View>

      <ProDaySurface variant="module" style={[styles.infoCard, { borderColor: colors.border }]}>
        <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
          <ProDayText variant="caption" accent style={styles.kindText}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </ProDayText>
        </View>
        <ProDayText variant="section">{event.title}</ProDayText>
        <ProDayText variant="body" muted>
          {formatCalendarDate(event.starts_at)}
        </ProDayText>
        <ProDayText variant="body" muted>
          {event.city}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {event.organizer_name}
          {event.club_name ? ` · ${event.club_name}` : ''}
        </ProDayText>
        {event.description ? (
          <ProDayText variant="body" style={styles.desc}>
            {event.description}
          </ProDayText>
        ) : null}
      </ProDaySurface>

      {isStaff ? <OpponentMatchDaySheet event={event} /> : null}

      {event.lineup ? (
        <ProDaySurface variant="module" style={[styles.infoCard, { borderColor: colors.border }]}>
          <ProDayText variant="section">Composition publiée</ProDayText>
          <ProDayText variant="caption" muted>
            {event.lineup.formation} · {event.lineup.slots.filter((s) => s.role === 'starter').length}{' '}
            titulaires · {event.lineup.slots.filter((s) => s.role === 'sub').length} remplaçants
          </ProDayText>
          <PressableSpring onPress={onOpenLineup} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              Voir le terrain →
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {isStaff ? (
        <ProDaySurface variant="module" style={[styles.infoCard, { borderColor: colors.border }]}>
          <ProDayText variant="section">Staff & Convocations</ProDayText>
          <ProDayText variant="caption" muted>
            {yesCount} présents confirmés · {pendingCount} en attente
          </ProDayText>
          <View style={styles.staffActionRow}>
            <PressableSpring onPress={() => void shareConvocation()} scaleTo={0.96} haptic style={styles.staffBtn}>
              <Icon name="share" size={14} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.link}>
                Partager convocation
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => void matchDayPdfService.printOrShareMatchSheet(event)}
              scaleTo={0.96}
              haptic
              style={styles.staffBtn}
            >
              <Icon name="document" size={14} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.link}>
                Feuille de match (PDF / Print)
              </ProDayText>
            </PressableSpring>
            {onAssociateVeo ? (
              <PressableSpring
                onPress={onAssociateVeo}
                scaleTo={0.96}
                haptic
                style={styles.staffBtn}
              >
                <Icon name="videocam" size={14} color={colors.accent} />
                <ProDayText variant="caption" accent style={styles.link}>
                  Associer une captation VEO
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        </ProDaySurface>
      ) : null}

      {canRespond ? (
        <View style={styles.rsvpBlock}>
          <ProDayText variant="eyebrow" accent>
            Votre réponse
          </ProDayText>
          <View style={styles.rsvpRow}>
            {RSVP_OPTIONS.map((opt, index) => {
              const active = myStatus === opt.status;
              return (
                <StaggerReveal key={opt.status} index={index} delayStep={45}>
                  <PressableSpring
                    onPress={() => onRsvp(opt.status)}
                    disabled={rsvpBusy}
                    scaleTo={0.97}
                    haptic
                  >
                    <ProDayGradient
                      kind={active ? 'cta' : 'card'}
                      style={[styles.rsvpBtn, !active && { borderColor: colors.border, borderWidth: 1 }]}
                    >
                      <ProDayText variant="caption" inverse={active} accent={!active} style={styles.rsvpText}>
                        {opt.label}
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                </StaggerReveal>
              );
            })}
          </View>
        </View>
      ) : null}

      {(isStaff ||
        event.invitee_uids.includes(profile.uid) ||
        profile.uid === event.organizer_uid) && (
        <EventCarpoolPanel
          event={event}
          profile={profile}
          isStaff={isStaff}
          onUpdated={onUpdated}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  quickNav: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  quickText: { fontWeight: '800' },
  infoCard: { borderWidth: 1, gap: spacing.xs },
  kindPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '800', fontSize: 10 },
  desc: { marginTop: spacing.xs, lineHeight: 22 },
  link: { fontWeight: '800' },
  staffActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  staffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  rsvpBlock: { gap: spacing.sm },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm },
  rsvpBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  rsvpText: { fontWeight: '800' },
});
