import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../ui/ProDayText';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

type ReelsEmptyStateProps = {
  loading?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
};

const INK_TOP = '#0B0D10';
const INK_BOTTOM = '#000000';

/** Rideau cinéma — un noir profond, un seul halo cyan, une trame de pellicule très discrète. */
const ReelBackdrop: React.FC<{ width: number; height: number; accent: string }> = ({
  width,
  height,
  accent,
}) => {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="reelInk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={INK_TOP} />
          <Stop offset="1" stopColor={INK_BOTTOM} />
        </SvgLinearGradient>
        <RadialGradient id="reelGlow" cx="0.5" cy="0.34" r="0.7">
          <Stop offset="0" stopColor={accent} stopOpacity="0.22" />
          <Stop offset="0.45" stopColor={accent} stopOpacity="0.05" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={h} fill="url(#reelInk)" />
      <Rect x="0" y="0" width={w} height={h} fill="url(#reelGlow)" />
    </Svg>
  );
};

export const ReelsEmptyState: React.FC<ReelsEmptyStateProps> = ({
  loading,
  canPublish,
  onPublish,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.7 + glow.value * 0.3 }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  if (loading) {
    return (
      <View style={styles.root} onLayout={onLayout} pointerEvents="none">
        {size.width > 0 ? (
          <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
            <ReelBackdrop width={size.width} height={size.height} accent={colors.accent} />
          </Animated.View>
        ) : null}
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.accent} size="small" />
          <ProDayText variant="caption" inverse muted style={styles.loaderText}>
            {t('reels.empty.loading')}
          </ProDayText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayout} pointerEvents="box-none">
      {size.width > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
          <ReelBackdrop width={size.width} height={size.height} accent={colors.accent} />
        </Animated.View>
      ) : null}

      <AnimatedEntrance kind="fadeDown">
        <View style={styles.stage}>
          <View style={styles.brandRow}>
            <ProDayText variant="brand" style={styles.brandWord}>
              ProDay
            </ProDayText>
            <View style={[styles.brandTick, { backgroundColor: colors.accent }]} />
          </View>

          <ProDayText variant="hero" style={styles.headline}>
            {canPublish ? t('reels.empty.title') : t('reels.guest.headline')}
          </ProDayText>
          <ProDayText variant="body" style={styles.support}>
            {canPublish ? t('reels.empty.subtitle') : t('reels.guest.body')}
          </ProDayText>

          {canPublish && onPublish ? (
            <PressableSpring
              onPress={onPublish}
              scaleTo={0.97}
              haptic
              style={[styles.cta, { backgroundColor: colors.accent }]}
            >
              <ProDayText variant="caption" style={styles.ctaText}>
                {t('reels.empty.cta')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </AnimatedEntrance>
    </View>
  );
};

function createStyles(topInset: number) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: INK_BOTTOM,
      paddingHorizontal: spacing.xl,
      paddingTop: topInset + spacing.xxl,
      paddingBottom: '22%',
    },
    stage: {
      width: '100%',
      maxWidth: 460,
      gap: spacing.md,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    brandWord: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    brandTick: {
      width: 22,
      height: 2,
      borderRadius: 1,
    },
    headline: {
      color: '#FFFFFF',
      fontSize: 34,
      lineHeight: 37,
      letterSpacing: -1,
    },
    support: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: 15,
      lineHeight: 22,
      maxWidth: 380,
    },
    cta: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: 15,
      borderRadius: 14,
    },
    ctaText: {
      color: '#04110F',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    loaderWrap: {
      position: 'absolute',
      alignSelf: 'center',
      top: '46%',
      alignItems: 'center',
      gap: spacing.sm,
    },
    loaderText: {
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.4,
    },
  });
}
