import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const { width: W, height: H } = Dimensions.get('window');

interface DiscoverMotionLabScreenProps {
  onBack: () => void;
}

type Bubble = { id: string; x: number; y: number; size: number; delay: number };

export const DiscoverMotionLabScreen: React.FC<DiscoverMotionLabScreenProps> = ({ onBack }) => {
  const t = useSharedValue(0);
  const burst = useSharedValue(0);

  const bubbles: Bubble[] = useMemo(() => {
    const list: Bubble[] = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        id: `b${i}`,
        x: 18 + ((i * 37) % (W - 36)),
        y: 120 + ((i * 71) % (Math.max(320, H - 220))),
        size: 18 + ((i * 11) % 26),
        delay: (i * 70) % 600,
      });
    }
    return list;
  }, []);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);

  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.96, 1]) }],
  }));

  return (
    <View style={styles.root}>
      <ScreenHeader title="Expérience" subtitle="Motion lab" onBack={onBack} />

      <View style={styles.stage}>
        {bubbles.map((b) => (
          <FloatingBubble key={b.id} bubble={b} t={t} burst={burst} />
        ))}

        <Animated.View style={[styles.centerCard, shadows.card, burstStyle]}>
          <View style={styles.centerBadge}>
            <Icon name="star-four-points" size={18} color={colors.accent} />
            <Text style={styles.centerBadgeText}>INTERACTIF</Text>
          </View>
          <Text style={styles.centerTitle}>Tap pour déclencher un “burst”</Text>
          <Text style={styles.centerBody}>
            Tout ici est animé sans dépendance externe : juste Reanimated, du rythme et des micro‑interactions.
          </Text>
          <Pressable
            onPress={() => {
              burst.value = 0;
              burst.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
              burst.value = withTiming(0, { duration: 650, easing: Easing.in(Easing.quad) });
            }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Déclencher</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const FloatingBubble: React.FC<{
  bubble: Bubble;
  t: SharedValue<number>;
  burst: SharedValue<number>;
}> = ({ bubble, t, burst }) => {
  const style = useAnimatedStyle(() => {
    const drift = Math.sin((t.value * Math.PI * 2) + bubble.delay / 120) * 14;
    const drift2 = Math.cos((t.value * Math.PI * 2) + bubble.delay / 180) * 10;
    const pop = interpolate(burst.value, [0, 1], [0, 1]);
    return {
      transform: [
        { translateX: drift + pop * (bubble.x - W / 2) * 0.06 },
        { translateY: drift2 + pop * (bubble.y - H / 2) * 0.06 },
        { scale: 1 + pop * 0.08 },
      ],
      opacity: 0.22 + (1 - pop) * 0.18,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        style,
        {
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.size / 2,
          left: bubble.x,
          top: bubble.y,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  stage: { flex: 1, padding: spacing.lg },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  centerCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: spacing.lg,
  },
  centerBadgeText: { fontSize: 10, fontWeight: '900', color: colors.accent, letterSpacing: 2 },
  centerTitle: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.4 },
  centerBody: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21, color: colors.textSecondary, fontWeight: '600' },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  ctaText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
});

