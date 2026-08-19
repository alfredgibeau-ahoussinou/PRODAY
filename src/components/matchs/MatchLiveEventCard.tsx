import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion/PressableSpring';
import { LivePulseDot } from '../motion/LivePulseDot';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, countRsvpYes, getPendingInviteeUids } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { resolveLiveState, isInMatchWindow, MATCH_LIVE_STATUS_LABELS } from '../../utils/matchLive';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useMatchSkinTokens } from './matchCenterUi';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';

interface MatchLiveEventCardProps {
  event: TeamEvent;
  onPress: () => void;
}

/** Carte match pour le Centre — ticket live / à venir. */
export const MatchLiveEventCard: React.FC<MatchLiveEventCardProps> = ({ event, onPress }) => {
  const { colors } = useAppTheme();
  const skin = useMatchSkinTokens();
  const accent = skin.joueurSkin ? skin.accent : colors.accent;
  const liveColor = skin.live;
  const live = resolveLiveState(event);
  const isLive = isInMatchWindow(event);
  const isFinished = live.status === 'finished';
  const confirmed = countRsvpYes(event);
  const pending = getPendingInviteeUids(event).length;
  const aura = useSharedValue(0);

  useEffect(() => {
    if (isLive) {
      aura.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
    } else {
      aura.value = 0;
    }
  }, [isLive, aura]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: isLive ? 0.12 + aura.value * 0.28 : 0,
  }));

  const barColor = isLive ? liveColor : isFinished ? skin.muted : accent;
  const statusColor = isLive ? liveColor : isFinished ? skin.muted : accent;

  return (
    <View style={styles.cardWrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.liveAura, { backgroundColor: liveColor }, auraStyle]}
      />
      <PressableSpring
        style={[styles.card, { borderColor: skin.border }]}
        onPress={onPress}
        scaleTo={0.98}
        haptic
      >
        <View style={[styles.bar, { backgroundColor: barColor }]} />
        <View style={styles.body}>
          <View style={styles.head}>
            <View style={styles.statusRow}>
              {isLive ? <LivePulseDot active size={6} color={liveColor} /> : null}
              <ProDayText variant="caption" style={[styles.statusText, { color: statusColor }]}>
                {isLive
                  ? `${MATCH_LIVE_STATUS_LABELS[live.status]}${live.minute != null ? ` · ${live.minute}'` : ''}`
                  : isFinished
                    ? MATCH_LIVE_STATUS_LABELS.finished
                    : EVENT_TYPE_LABELS[event.event_type]}
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
              {formatCalendarDate(event.starts_at)}
            </ProDayText>
          </View>

          <ProDayText
            variant="section"
            style={[styles.title, { color: MATCH_SITE.foreground }]}
            numberOfLines={2}
          >
            {event.title}
          </ProDayText>

          <View style={styles.scoreRow}>
            <ProDayText variant="caption" style={[styles.team, { color: MATCH_SITE.muted }]} numberOfLines={1}>
              {live.home_label ?? 'Domicile'}
            </ProDayText>
            <ProDayText variant="section" style={[styles.score, { color: MATCH_SITE.foreground }]}>
              {live.home_score}
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
                {' — '}
              </ProDayText>
              {live.away_score}
            </ProDayText>
            <ProDayText
              variant="caption"
              style={[styles.team, styles.teamAway, { color: MATCH_SITE.muted }]}
              numberOfLines={1}
            >
              {live.opponent_name ?? 'Adversaire'}
            </ProDayText>
          </View>

          <View style={styles.metaRow}>
            {event.lineup ? (
              <ProDayText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                {event.lineup.formation}
              </ProDayText>
            ) : (
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
                Sans compo
              </ProDayText>
            )}
            <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
              {confirmed} confirmés · {pending} attente
            </ProDayText>
            {(event.live_actions?.length ?? 0) > 0 ? (
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
                {event.live_actions!.length} actions
              </ProDayText>
            ) : null}
          </View>

          <ProDayText variant="caption" style={[styles.cta, { color: colors.accent }]}>
            Ouvrir le hub →
          </ProDayText>
        </View>
      </PressableSpring>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  liveAura: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: MATCH_SITE.surface,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: { fontWeight: '800', letterSpacing: -0.3 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  team: { flex: 1 },
  teamAway: { textAlign: 'right' },
  score: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  cta: { fontWeight: '800', marginTop: 2 },
});
