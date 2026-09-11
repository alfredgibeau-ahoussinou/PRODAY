import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { motion } from '../../theme/motion';
import { radius, spacing } from '../../theme/designTokens';

type FootballScoreboardBannerProps = {
  eyebrow: string;
  name: string;
  subtitle: string;
  variant: 'welcome' | 'goodbye';
};

export const FootballScoreboardBanner: React.FC<FootballScoreboardBannerProps> = ({
  eyebrow,
  name,
  subtitle,
  variant,
}) => {
  const reveal = useSharedValue(0);
  const accent = '#10B981';

  const jerseyNumber = useMemo(() => 7 + (name.charCodeAt(0) % 9), [name]);

  useEffect(() => {
    reveal.value = withDelay(40, withTiming(1, { duration: 420, easing: motion.easing.out }));
  }, [reveal]);

  const boardStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { translateY: interpolate(reveal.value, [0, 1], [16, 0]) },
    ],
  }));

  return (
    <Animated.View style={[styles.wrap, boardStyle]}>
      <View style={[styles.board, { borderColor: `${accent}44` }]}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
            <Icon name="football" size={13} color="#FFFFFF" variant="filled" />
            <ProDayText variant="caption" inverse style={styles.badgeText}>
              ProDay
            </ProDayText>
          </View>
          <ProDayText variant="caption" inverse style={styles.eyebrow}>
            {eyebrow}
          </ProDayText>
        </View>

        <View style={styles.nameRow}>
          <View style={[styles.numberChip, { borderColor: `${accent}88` }]}>
            <ProDayText variant="caption" inverse style={styles.number}>
              {jerseyNumber}
            </ProDayText>
          </View>
          <ProDayText variant="hero" inverse style={styles.name} numberOfLines={1}>
            {name}
          </ProDayText>
        </View>

        <ProDayText variant="body" inverse muted style={styles.sub}>
          {subtitle}
        </ProDayText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  board: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(10, 14, 12, 0.78)',
    borderWidth: 1,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  numberChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  number: {
    fontWeight: '800',
    fontSize: 14,
  },
  name: {
    flex: 1,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  sub: {
    lineHeight: 22,
    color: 'rgba(255,255,255,0.86)',
  },
});
