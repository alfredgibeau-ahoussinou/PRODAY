import React, { useCallback, useEffect, useState } from 'react';
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
import { discoverPalette } from './discoverStyles';
import { colors, spacing, radius } from '../../theme/designTokens';
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
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const activeIndex = Math.max(0, DISCOVER_CHAPTERS.findIndex((c) => c.id === active));
  const tabW = trackW > 0 ? trackW / DISCOVER_CHAPTERS.length : 0;

  const moveLine = useCallback(
    (index: number) => {
      if (tabW <= 0) return;
      lineX.value = withSpring(index * tabW, SPRING_SNAPPY);
    },
    [lineX, tabW]
  );

  useEffect(() => {
    moveLine(activeIndex);
  }, [activeIndex, moveLine]);

  const snap = Math.max(pageWidth, 1);
  const usePagerSync = scrollX != null && pageWidth > 0;

  const lineStyle = useAnimatedStyle(() => {
    const w = tabW;
    if (w <= 0) return { width: 0, transform: [{ translateX: 0 }] };
    if (usePagerSync && scrollX) {
      return {
        width: w,
        transform: [{ translateX: (scrollX.value / snap) * w }],
      };
    }
    return {
      width: w,
      transform: [{ translateX: lineX.value }],
    };
  });

  return (
    <View style={[styles.lightWrap, { paddingHorizontal: pad }, compact && styles.lightWrapCompact]}>
      <View
        style={[styles.lightTrack, compact && styles.lightTrackCompact]}
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      >
        {tabW > 0 ? <Animated.View style={[styles.lightLine, lineStyle]} /> : null}
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
  const labelStyle = useAnimatedStyle(() => {
    const progress = scrollX.value / snap;
    const emphasis = interpolate(
      progress,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const inactive = discoverPalette.faint;
    const active = discoverPalette.ink;
    return {
      opacity: 0.5 + emphasis * 0.5,
      color: emphasis > 0.5 ? active : inactive,
    };
  });

  return (
    <Animated.Text
      style={[
        styles.lightTabLabel,
        compact && styles.lightTabLabelCompact,
        labelStyle,
      ]}
      numberOfLines={1}
      maxFontSizeMultiplier={1.1}
    >
      {label}
    </Animated.Text>
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

const styles = StyleSheet.create({
  lightWrap: {
    backgroundColor: discoverPalette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: discoverPalette.border,
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
    backgroundColor: discoverPalette.ink,
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
    color: discoverPalette.faint,
    letterSpacing: 0.15,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  lightTabLabelCompact: {
    fontSize: 13,
  },
  lightTabLabelOn: {
    color: discoverPalette.ink,
    fontWeight: '800',
  },
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: colors.ink,
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
    color: colors.textMuted,
  },
  chipNumOn: { color: colors.ink },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  chipOnImmersive: {
    backgroundColor: '#262626',
  },
  chipTextOn: {
    color: colors.text,
    fontWeight: '800',
  },
});
