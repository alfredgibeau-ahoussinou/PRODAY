import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { MatchLiveState } from '../../../models/TeamEvent';
import { MATCH_LIVE_STATUS_LABELS } from '../../../utils/matchLive';
import { motion } from '../../../theme/motion';
import { LivePulseDot } from '../../motion/LivePulseDot';
import { ProDayGradient } from '../../ui/ProDayGradient';
import { ProDayText } from '../../ui/ProDayText';
import { spacing, radius } from '../../../theme/designTokens';

interface MatchLiveScoreboardProps {
  state: MatchLiveState;
  compact?: boolean;
}

function AnimatedScore({ value }: { value: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.14, motion.spring.bouncy),
      withSpring(1, motion.spring.snappy)
    );
  }, [value, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ProDayText variant="hero" inverse style={styles.score}>
        {value}
      </ProDayText>
    </Animated.View>
  );
}

export const MatchLiveScoreboard: React.FC<MatchLiveScoreboardProps> = ({
  state,
  compact = false,
}) => {
  const isLive = state.status === 'live' || state.status === 'halftime';
  const home = state.home_label ?? 'Domicile';
  const away = state.opponent_name ?? 'Adversaire';

  return (
    <ProDayGradient
      kind={isLive ? 'cta' : 'hero'}
      style={[styles.board, compact && styles.boardCompact]}
    >
      <View style={styles.statusRow}>
        <LivePulseDot active={isLive} />
        <ProDayText variant="caption" inverse muted>
          {MATCH_LIVE_STATUS_LABELS[state.status]}
          {state.minute != null && isLive ? ` · ${state.minute}'` : ''}
        </ProDayText>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.teamCol}>
          <ProDayText variant="caption" inverse muted numberOfLines={2} style={styles.teamName}>
            {home}
          </ProDayText>
          <AnimatedScore value={state.home_score} />
        </View>
        <ProDayText variant="section" inverse muted style={styles.sep}>
          —
        </ProDayText>
        <View style={styles.teamCol}>
          <ProDayText variant="caption" inverse muted numberOfLines={2} style={styles.teamName}>
            {away}
          </ProDayText>
          <AnimatedScore value={state.away_score} />
        </View>
      </View>
    </ProDayGradient>
  );
};

const styles = StyleSheet.create({
  board: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  boardCompact: { padding: spacing.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  teamCol: { flex: 1, alignItems: 'center', gap: 4 },
  teamName: { textAlign: 'center', fontWeight: '700' },
  score: { fontSize: 42, fontWeight: '900', lineHeight: 48 },
  sep: { opacity: 0.6 },
});
