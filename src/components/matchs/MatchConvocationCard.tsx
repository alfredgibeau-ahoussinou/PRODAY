import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import type { RsvpStatus } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, RSVP_STATUS_LABELS } from '../../models/TeamEvent';
import { userRsvp } from '../../models/TeamEvent';
import { resolveLiveState, isInMatchWindow } from '../../utils/matchLive';
import { ProDayText } from '../ui/ProDayText';
import { LateReportControl } from '../team/LateReportControl';
import { useAppTheme } from '../../context/ProductLineContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchConvocationCardProps {
  event: TeamEvent;
  profileUid: string;
  playerName?: string;
  pending?: boolean;
  onOpen: () => void;
  onRsvp?: (status: RsvpStatus) => void;
  rsvpBusy?: boolean;
  onOpenCarpool?: () => void;
  onLateReported?: () => void;
  reportedByParent?: boolean;
}

export const MatchConvocationCard: React.FC<MatchConvocationCardProps> = ({
  event,
  profileUid,
  playerName,
  pending,
  onOpen,
  onRsvp,
  rsvpBusy,
  onOpenCarpool,
  onLateReported,
  reportedByParent,
}) => {
  const { colors } = useAppTheme();
  const status = userRsvp(event, profileUid);
  const live = resolveLiveState(event);
  const showScore =
    isInMatchWindow(event) ||
    (event.live_actions?.length ?? 0) > 0 ||
    Boolean(event.live_state);
  const dateLabel = event.starts_at.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <PressableSpring style={styles.card} onPress={onOpen} scaleTo={0.98} haptic>
      <View style={[styles.bar, { backgroundColor: pending ? MATCH_SITE.warn : colors.accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText variant="caption" style={[styles.kind, { color: colors.accent }]}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </ProDayText>
          <ProDayText variant="caption" style={styles.muted}>
            {dateLabel}
          </ProDayText>
        </View>

        <ProDayText variant="section" numberOfLines={2} style={styles.title}>
          {event.title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted} numberOfLines={1}>
          {event.organizer_name} · {event.city}
        </ProDayText>

        {showScore ? (
          <ProDayText variant="caption" style={[styles.score, { color: colors.accent }]}>
            {live.home_label} {live.home_score} — {live.away_score} {live.opponent_name}
            {isInMatchWindow(event) && live.minute != null ? ` · ${live.minute}'` : ''}
          </ProDayText>
        ) : null}

        {event.lineup ? (
          <ProDayText variant="caption" style={styles.muted}>
            Compo {event.lineup.formation} ·{' '}
            {event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires
          </ProDayText>
        ) : null}

        {!pending ? (
          <ProDayText variant="caption" style={[styles.rsvpStatus, { color: colors.accent }]}>
            {RSVP_STATUS_LABELS[status]}
          </ProDayText>
        ) : null}

        {onOpenCarpool ? (
          <PressableSpring onPress={onOpenCarpool} scaleTo={0.98} haptic style={styles.linkBtn}>
            <ProDayText variant="caption" style={[styles.link, { color: colors.accent }]}>
              Trajet / covoiturage →
            </ProDayText>
          </PressableSpring>
        ) : null}

        {pending && onRsvp ? (
          <View style={styles.rsvpRow}>
            <PressableSpring
              disabled={rsvpBusy}
              scaleTo={0.96}
              style={[styles.rsvpPrimary, { backgroundColor: colors.accent }]}
              onPress={() => {
                prodayHaptics.confirm();
                onRsvp('yes');
              }}
            >
              <ProDayText variant="caption" style={styles.rsvpPrimaryText}>
                Oui
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={styles.rsvpGhost}
              disabled={rsvpBusy}
              scaleTo={0.97}
              onPress={() => onRsvp('maybe')}
            >
              <ProDayText variant="caption" style={[styles.link, { color: colors.accent }]}>
                Peut-être
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={styles.rsvpGhost}
              disabled={rsvpBusy}
              scaleTo={0.97}
              onPress={() => onRsvp('no')}
            >
              <ProDayText variant="caption" style={[styles.link, { color: colors.accent }]}>
                Non
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        <LateReportControl
          eventId={event.id}
          playerUid={profileUid}
          playerName={playerName}
          currentRsvp={status}
          reportedByParent={reportedByParent}
          compact
          onReported={onLateReported}
        />
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
    backgroundColor: MATCH_SITE.surface,
    marginBottom: 2,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kind: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontWeight: '800',
    color: MATCH_SITE.foreground,
    letterSpacing: -0.3,
  },
  muted: { color: MATCH_SITE.muted },
  score: { fontWeight: '800', marginTop: 2 },
  rsvpStatus: { fontWeight: '800', marginTop: 2 },
  linkBtn: { alignSelf: 'flex-start', marginTop: 4 },
  link: { fontWeight: '800' },
  rsvpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  rsvpPrimary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  rsvpPrimaryText: { color: '#fff', fontWeight: '800' },
  rsvpGhost: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
  },
});
