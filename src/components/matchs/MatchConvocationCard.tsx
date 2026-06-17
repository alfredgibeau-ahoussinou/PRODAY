import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { TeamEvent } from '../../models/TeamEvent';
import type { RsvpStatus } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { userRsvp } from '../../models/TeamEvent';
import { resolveLiveState, isInMatchWindow } from '../../utils/matchLive';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface MatchConvocationCardProps {
  event: TeamEvent;
  profileUid: string;
  pending?: boolean;
  onOpen: () => void;
  onRsvp?: (status: RsvpStatus) => void;
  rsvpBusy?: boolean;
  onOpenCarpool?: () => void;
}

const RSVP_LABEL: Record<RsvpStatus, string> = {
  pending: 'En attente',
  yes: 'Présent',
  no: 'Absent',
  maybe: 'Peut-être',
};

export const MatchConvocationCard: React.FC<MatchConvocationCardProps> = ({
  event,
  profileUid,
  pending,
  onOpen,
  onRsvp,
  rsvpBusy,
  onOpenCarpool,
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
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onOpen}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.kindText}>
              {EVENT_TYPE_LABELS[event.event_type]}
            </ProDayText>
          </View>
          <ProDayText variant="caption" muted>
            {dateLabel}
          </ProDayText>
        </View>

        <ProDayText variant="section" numberOfLines={2}>
          {event.title}
        </ProDayText>
        <ProDayText variant="body" muted numberOfLines={1}>
          {event.organizer_name} · {event.city}
        </ProDayText>

        {showScore ? (
          <View style={[styles.scoreRow, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.scoreText}>
              {live.home_label} {live.home_score} - {live.away_score} {live.opponent_name}
              {isInMatchWindow(event) && live.minute != null ? ` · ${live.minute}'` : ''}
            </ProDayText>
          </View>
        ) : null}

        {event.lineup ? (
          <ProDayText variant="caption" muted>
            Compo {event.lineup.formation} · {event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires
          </ProDayText>
        ) : null}

        {!pending ? (
          <View style={[styles.statusPill, { backgroundColor: colors.surfaceMuted }]}>
            <ProDayText variant="caption" accent>
              {RSVP_LABEL[status]}
            </ProDayText>
          </View>
        ) : null}

        {onOpenCarpool ? (
          <PressableSpring
            style={[styles.carpoolBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            onPress={onOpenCarpool}
            scaleTo={0.98}
            haptic
          >
            <Icon name="car" size={14} color={colors.accent} />
            <ProDayText variant="caption" accent style={styles.carpoolText}>
              Trajet / covoiturage
            </ProDayText>
          </PressableSpring>
        ) : null}

        {pending && onRsvp ? (
          <View style={styles.rsvpRow}>
            <PressableSpring
              disabled={rsvpBusy}
              scaleTo={0.96}
              onPress={() => {
                prodayHaptics.confirm();
                onRsvp('yes');
              }}
            >
              <ProDayGradient kind="cta" style={styles.rsvpBtn}>
                <Icon name="checkmark-circle" size={14} color="#FFFFFF" />
                <ProDayText variant="caption" inverse style={styles.rsvpText}>
                  Oui
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>
            <PressableSpring
              style={[
                styles.rsvpGhost,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
              ]}
              disabled={rsvpBusy}
              scaleTo={0.97}
              onPress={() => onRsvp('maybe')}
            >
              <ProDayText variant="caption" accent style={styles.rsvpText}>
                Peut-être
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              style={[
                styles.rsvpGhost,
                { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
              ]}
              disabled={rsvpBusy}
              scaleTo={0.97}
              onPress={() => onRsvp('no')}
            >
              <ProDayText variant="caption" accent style={styles.rsvpText}>
                Non
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  body: { padding: spacing.md },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  kindPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '800', fontSize: 10 },
  scoreRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  scoreText: { fontWeight: '800' },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  carpoolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  carpoolText: { fontWeight: '800' },
  rsvpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  rsvpGhost: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  rsvpText: { fontWeight: '800' },
});
