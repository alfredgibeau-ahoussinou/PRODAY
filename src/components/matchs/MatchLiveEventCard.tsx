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
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { resolveLiveState, isInMatchWindow } from '../../utils/matchLive';
import { MatchLiveScoreboard } from './hub/MatchLiveScoreboard';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface MatchLiveEventCardProps {
  event: TeamEvent;
  onPress: () => void;
}

export const MatchLiveEventCard: React.FC<MatchLiveEventCardProps> = ({ event, onPress }) => {
  const { colors } = useAppTheme();
  const live = resolveLiveState(event);
  const isLive = isInMatchWindow(event);
  const aura = useSharedValue(0);

  useEffect(() => {
    if (isLive) {
      aura.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
    } else {
      aura.value = 0;
    }
  }, [isLive, aura]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: isLive ? 0.25 + aura.value * 0.55 : 0,
  }));

  return (
    <View style={styles.cardWrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.liveAura,
          { borderColor: colors.accent },
          auraStyle,
        ]}
      />
      <PressableSpring
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
        onPress={onPress}
        scaleTo={0.98}
        haptic
      >
      <View style={styles.head}>
        <View style={[styles.kindPill, { backgroundColor: isLive ? colors.errorBg : colors.accentSoft }]}>
          {isLive ? <LivePulseDot active size={6} color={colors.error} /> : null}
          <ProDayText variant="caption" accent={!isLive} style={[styles.kindText, isLive && { color: colors.error }]}>
            {isLive ? 'EN DIRECT' : EVENT_TYPE_LABELS[event.event_type]}
          </ProDayText>
        </View>
        <ProDayText variant="caption" muted>
          {formatCalendarDate(event.starts_at)}
        </ProDayText>
      </View>
      <ProDayText variant="section" numberOfLines={2}>
        {event.title}
      </ProDayText>
      <MatchLiveScoreboard state={live} compact />
      <View style={styles.metaRow}>
        {event.lineup ? (
          <View style={styles.metaChip}>
            <Icon name="football-outline" size={12} color={colors.accent} />
            <ProDayText variant="caption" accent>
              {event.lineup.formation}
            </ProDayText>
          </View>
        ) : null}
        {(event.live_actions?.length ?? 0) > 0 ? (
          <ProDayText variant="caption" muted>
            {event.live_actions!.length} action(s)
          </ProDayText>
        ) : null}
      </View>
      <ProDaySurface variant="accent" style={styles.cta}>
        <ProDayText variant="caption" accent style={styles.ctaText}>
          Ouvrir le centre match →
        </ProDayText>
      </ProDaySurface>
      </PressableSpring>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  liveAura: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: 2,
    margin: -1,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '900', fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cta: { alignItems: 'center', paddingVertical: spacing.sm },
  ctaText: { fontWeight: '800' },
});
