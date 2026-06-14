import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { DISCOVER_CHAPTERS, type DiscoverChapterId } from '../../content/discoverChapters';
import { PressableSpring } from './PressableSpring';
import { SPRING_SNAPPY } from './animationConfig';
import { getDiscoverPalette, useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverMetrics } from './useDiscoverMetrics';

interface DiscoverChapterRailProps {
  active: DiscoverChapterId;
  onSelect: (id: DiscoverChapterId) => void;
  embedded?: boolean;
  variant?: 'default' | 'immersive' | 'light';
  /** Position horizontale du pager — souligné suit le swipe */
  scrollX?: SharedValue<number>;
  pageWidth?: number;
}

/** Onglets soulignés — accueil clair */
const LightChapterTabs: React.FC<{
  active: DiscoverChapterId;
  onSelect: (id: DiscoverChapterId) => void;
  pad: number;
  compact: boolean;
  scrollX?: SharedValue<number>;
  pageWidth: number;
}> = ({ active, onSelect, pad, compact, scrollX, pageWidth }) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createChapterRailStyles(c, palette), [c, palette]);
  const trackW = useSharedValue(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, DISCOVER_CHAPTERS.findIndex((c) => c.id === active));
  const chapterCount = DISCOVER_CHAPTERS.length;

  const moveLine = useCallback(
    (index: number) => {
      const w = trackW.value / chapterCount;
      if (w <= 0) return;
      lineX.value = withSpring(index * w, SPRING_SNAPPY);
    },
    [chapterCount, lineX, trackW]
  );

  const snap = Math.max(pageWidth, 1);
  const usePagerSync = scrollX != null && pageWidth > 0;

  useEffect(() => {
    if (usePagerSync) return;
    moveLine(activeIndex);
  }, [activeIndex, moveLine, usePagerSync]);

  const lineStyle = useAnimatedStyle(() => {
    const w = trackW.value / chapterCount;
    if (w <= 0) return { width: 0, opacity: 0, transform: [{ translateX: 0 }] };
    if (usePagerSync && scrollX) {
      return {
        width: w,
        opacity: 1,
        transform: [{ translateX: (scrollX.value / snap) * w }],
      };
    }
    return {
      width: w,
      opacity: 1,
      transform: [{ translateX: lineX.value }],
    };
  });

  return (
    <View style={[styles.lightWrap, { paddingHorizontal: pad }, compact && styles.lightWrapCompact]}>
      <View
        style={[styles.lightTrack, compact && styles.lightTrackCompact]}
        onLayout={(e: LayoutChangeEvent) => {
          trackW.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={[styles.lightLine, lineStyle]} />
        {DISCOVER_CHAPTERS.map((ch, index) => {
          return (
            <PressableSpring
              key={ch.id}
              style={styles.lightTab}
              onPress={() => {
                onSelect(ch.id);
                if (!usePagerSync) moveLine(index);
              }}
              scaleTo={0.98}
            >
              {usePagerSync && scrollX ? (
                <LightTabLabel
                  index={index}
                  scrollX={scrollX}
                  snap={snap}
                  label={ch.label}
                  compact={compact}
                />
              ) : (
                <Text
                  style={[
                    styles.lightTabLabel,
                    compact && styles.lightTabLabelCompact,
                    ch.id === active && styles.lightTabLabelOn,
                  ]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.1}
                >
                  {ch.label}
                </Text>
              )}
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

const LightTabLabel: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  snap: number;
  label: string;
  compact: boolean;
}> = ({ index, scrollX, snap, label, compact }) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createChapterRailStyles(c, palette), [c, palette]);
  const inactiveStyle = useAnimatedStyle(() => {
    const progress = scrollX.value / snap;
    const emphasis = interpolate(
      progress,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { opacity: 1 - emphasis };
  });

  const activeStyle = useAnimatedStyle(() => {
    const progress = scrollX.value / snap;
    const emphasis = interpolate(
      progress,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { opacity: emphasis };
  });

  return (
    <View style={styles.lightLabelStack}>
      <Animated.Text
        style={[
          styles.lightTabLabel,
          compact && styles.lightTabLabelCompact,
          styles.lightTabLabelMuted,
          inactiveStyle,
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.1}
      >
        {label}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.lightTabLabel,
          compact && styles.lightTabLabelCompact,
          styles.lightTabLabelOn,
          activeStyle,
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.1}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
    </View>
  );
};

export const DiscoverChapterRail: React.FC<DiscoverChapterRailProps> = ({
  active,
  onSelect,
  embedded = false,
  variant = 'default',
  scrollX,
  pageWidth: pageWidthProp,
}) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createChapterRailStyles(c, palette), [c, palette]);
  const immersive = variant === 'immersive';
  const light = variant === 'light';
  const { pad, compact, pageWidth } = useDiscoverMetrics();

  if (light) {
    return (
      <LightChapterTabs
        active={active}
        onSelect={onSelect}
        pad={pad}
        compact={compact}
        scrollX={scrollX}
        pageWidth={pageWidthProp ?? pageWidth}
      />
    );
  }

  const content = DISCOVER_CHAPTERS.map((ch) => {
    const on = ch.id === active;
    return (
      <PressableSpring
        key={ch.id}
        style={[styles.chip, on && styles.chipOn, immersive && on && styles.chipOnImmersive]}
        onPress={() => onSelect(ch.id)}
        scaleTo={0.98}
      >
        <Text style={[styles.chipNum, on && styles.chipNumOn]}>{ch.short}</Text>
        <Text
          style={[styles.chipLabel, on && styles.chipTextOn]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
        >
          {ch.label}
        </Text>
      </PressableSpring>
    );
  });

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded, immersive && styles.wrapImmersive]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {content}
      </ScrollView>
    </View>
  );
};

function createChapterRailStyles(c: AppColors, palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
  lightWrap: {
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    zIndex: 2,
  },
  lightWrapCompact: {
    marginTop: 0,
    marginBottom: spacing.xs,
  },
  lightTrack: {
    flexDirection: 'row',
    height: 48,
    position: 'relative',
  },
  lightTrackCompact: {
    height: 44,
  },
  lightLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    backgroundColor: palette.ink,
    borderRadius: 1,
  },
  lightTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: spacing.xs,
  },
  lightTabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.faint,
    letterSpacing: 0.15,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  lightTabLabelCompact: {
    fontSize: 13,
  },
  lightLabelStack: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 18,
  },
  lightTabLabelMuted: {
    color: palette.faint,
    fontWeight: '700',
  },
  lightTabLabelOn: {
    ...StyleSheet.absoluteFillObject,
    textAlign: 'center',
    color: palette.ink,
    fontWeight: '800',
  },
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: c.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: c.border,
  },
  wrapEmbedded: {
    marginTop: spacing.md,
  },
  wrapImmersive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rail: {
    gap: 4,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipOn: {
    backgroundColor: c.surface,
    ...Platform.select({
      ios: {
        shadowColor: c.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  chipNum: {
    fontSize: 10,
    fontWeight: '800',
    color: c.textMuted,
  },
  chipNumOn: { color: c.ink },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textAlign: 'center',
  },
  chipOnImmersive: {
    backgroundColor: '#262626',
  },
  chipTextOn: {
    color: c.text,
    fontWeight: '800',
  },
  });
}
