import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring, PagerPage, AnimatedTabLabel } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { motion } from '../../theme/motion';
import { CarouselDot } from '../discover/CarouselDot';
import { ProDayText } from './ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { fontFamily } from '../../theme/typography';
import { spacing, radius } from '../../theme/designTokens';

export type ProDayChapterDef<T extends string> = { id: T; label: string };

export interface ProDayTabPage<T extends string> {
  id: T;
  render: () => React.ReactNode;
}

interface ProDayTabPagerProps<T extends string> {
  chapters: ProDayChapterDef<T>[];
  pages: ProDayTabPage<T>[];
  activeChapter: T;
  onChapterChange: (id: T) => void;
  badges?: Partial<Record<T, number>>;
  /** Masque le bandeau points / « Glissez » en bas (profil, écrans denses). */
  showFooter?: boolean;
  /** Rail d’onglets plus bas (40 px). */
  compact?: boolean;
  /** Rail souligné (défaut) ou pills scrollables. */
  variant?: 'rail' | 'pills';
}

export function ProDayTabPager<T extends string>({
  chapters,
  pages,
  activeChapter,
  onChapterChange,
  badges,
  showFooter = false,
  compact = false,
  variant = 'rail',
}: ProDayTabPagerProps<T>) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, compact, variant), [colors, compact, variant]);
  const { width: windowWidth } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const lineX = useSharedValue(0);
  const tabW = trackW > 0 ? trackW / chapters.length : 0;
  const pageWidth = layoutWidth > 0 ? layoutWidth : windowWidth;
  const scrollRef = useRef<Animated.ScrollView>(null);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const activeChapterRef = useRef(activeChapter);
  activeChapterRef.current = activeChapter;

  const onRootLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w <= 0) return;
    setLayoutWidth((prev) => (prev !== w ? w : prev));
  }, []);
  const scrollX = useSharedValue(0);
  const suppressChapterSyncRef = useRef(false);

  const activeIndex = Math.max(0, chapters.findIndex((c) => c.id === activeChapter));

  const moveLine = useCallback(
    (index: number) => {
      if (tabW <= 0) return;
      lineX.value = withSpring(index * tabW, motion.spring.snappy);
    },
    [lineX, tabW]
  );

  useEffect(() => {
    moveLine(activeIndex);
  }, [activeIndex, moveLine]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lineX.value }],
    width: tabW,
  }));

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      if (pageWidth <= 0) return;
      const clamped = Math.max(0, Math.min(index, pagesRef.current.length - 1));
      const x = clamped * pageWidth;
      const chapterId = pagesRef.current[clamped].id;
      suppressChapterSyncRef.current = true;
      scrollX.value = x;
      if (chapterId !== activeChapterRef.current) {
        onChapterChange(chapterId);
      }
      scrollRef.current?.scrollTo({ x, animated });
      if (!animated) suppressChapterSyncRef.current = false;
    },
    [onChapterChange, pageWidth, scrollX]
  );

  const goToChapter = useCallback(
    (id: T, animated = false) => {
      const index = pagesRef.current.findIndex((p) => p.id === id);
      if (index >= 0) goToIndex(index, animated);
    },
    [goToIndex]
  );

  const syncChapterFromOffset = useCallback(
    (offsetX: number) => {
      if (suppressChapterSyncRef.current) return;
      const snap = Math.max(pageWidth, 1);
      const index = Math.round(offsetX / snap);
      const page = pagesRef.current[index];
      if (page && page.id !== activeChapterRef.current) {
        onChapterChange(page.id);
      }
    },
    [onChapterChange, pageWidth]
  );

  const onPagerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (suppressChapterSyncRef.current) {
        suppressChapterSyncRef.current = false;
        return;
      }
      syncChapterFromOffset(e.nativeEvent.contentOffset.x);
    },
    [syncChapterFromOffset]
  );

  const onPagerScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (suppressChapterSyncRef.current) return;
      const vx = e.nativeEvent.velocity?.x ?? 0;
      if (Math.abs(vx) < 0.05) {
        syncChapterFromOffset(e.nativeEvent.contentOffset.x);
      }
    },
    [syncChapterFromOffset]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const pageNum = activeIndex + 1;

  useEffect(() => {
    const index = pagesRef.current.findIndex((p) => p.id === activeChapter);
    if (index < 0 || pageWidth <= 0) return;
    const x = index * pageWidth;
    suppressChapterSyncRef.current = true;
    scrollX.value = x;
    scrollRef.current?.scrollTo({ x, animated: layoutWidth > 0 });
    if (!layoutWidth) suppressChapterSyncRef.current = false;
  }, [activeChapter, pageWidth, layoutWidth, scrollX]);

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      <View style={styles.railWrap}>
        {variant === 'pills' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {chapters.map((ch) => {
              const on = ch.id === activeChapter;
              const badge = badges?.[ch.id];
              return (
                <PressableSpring
                  key={ch.id}
                  onPress={() => {
                    prodayHaptics.tabSwitch();
                    goToChapter(ch.id, false);
                  }}
                  scaleTo={0.96}
                  haptic
                >
                  <View
                    style={[
                      styles.pill,
                      on
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <ProDayText
                      variant="caption"
                      inverse={on}
                      accent={!on}
                      style={[styles.pillLabel, on && styles.pillLabelOn]}
                    >
                      {ch.label}
                    </ProDayText>
                    {badge && badge > 0 ? (
                      <View
                        style={[
                          styles.pillBadge,
                          { backgroundColor: on ? 'rgba(255,255,255,0.92)' : colors.accent },
                        ]}
                      >
                        <ProDayText
                          variant="caption"
                          accent={!on}
                          inverse={on}
                          style={styles.pillBadgeText}
                        >
                          {badge > 9 ? '9+' : badge}
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>
                </PressableSpring>
              );
            })}
          </ScrollView>
        ) : (
        <View
          style={styles.track}
          onLayout={(e) => {
            const w = Math.round(e.nativeEvent.layout.width);
            setTrackW((prev) => (prev !== w ? w : prev));
          }}
        >
          <Animated.View style={[styles.line, lineStyle]} pointerEvents="none">
            <View style={[styles.lineInner, { backgroundColor: colors.accent }]} />
          </Animated.View>
          {chapters.map((ch, index) => {
            const on = ch.id === activeChapter;
            const badge = badges?.[ch.id];
            return (
              <PressableSpring
                key={ch.id}
                style={[styles.tab, { zIndex: 1 }]}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  goToChapter(ch.id, false);
                }}
                scaleTo={0.96}
              >
                <AnimatedTabLabel active={on}>
                  <View style={styles.tabInner}>
                    <ProDayText
                      variant="caption"
                      accent={on}
                      style={[styles.tabLabel, on && styles.tabLabelOn]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {ch.label}
                    </ProDayText>
                    {badge && badge > 0 ? (
                      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                        <ProDayText variant="caption" inverse style={styles.badgeText}>
                          {badge > 9 ? '9+' : badge}
                        </ProDayText>
                      </View>
                    ) : null}
                  </View>
                </AnimatedTabLabel>
              </PressableSpring>
            );
          })}
        </View>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onPagerScrollEnd}
        onScrollEndDrag={onPagerScrollEndDrag}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.pager}
        nestedScrollEnabled
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
      >
        {pages.map((page, index) => (
          <PagerPage key={page.id} index={index} scrollX={scrollX} pageWidth={pageWidth}>
            {page.render()}
          </PagerPage>
        ))}
      </Animated.ScrollView>

      {showFooter ? (
        <View style={styles.footer}>
          <View style={styles.dots}>
            {pages.map((p, i) => (
              <CarouselDot
                key={p.id}
                index={i}
                scrollX={scrollX}
                snap={pageWidth}
                onPress={() => goToIndex(i)}
              />
            ))}
          </View>
          <ProDayText variant="caption" muted style={styles.hint}>
            Glissez · {pageNum}/{pages.length}
          </ProDayText>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  c: { surface: string; border: string; text: string; textMuted: string; surfaceMuted: string; accent: string },
  compact: boolean,
  variant: 'rail' | 'pills',
) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    railWrap: {
      backgroundColor: c.surface,
      borderBottomWidth: variant === 'pills' ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      paddingBottom: variant === 'pills' ? spacing.xs : 0,
    },
    pillsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    pillLabel: { fontWeight: '700', fontSize: 13 },
    pillLabelOn: { fontWeight: '800', color: '#fff' },
    pillBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    pillBadgeText: { fontSize: 11, fontWeight: '900', lineHeight: 13 },
    track: {
      flexDirection: 'row',
      height: compact ? 40 : 44,
      position: 'relative',
    },
    line: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 3,
    },
    lineInner: {
      flex: 1,
      marginHorizontal: spacing.sm,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    tabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      maxWidth: '100%',
    },
    tabLabel: {
      fontFamily: fontFamily.semibold,
      fontWeight: '600',
      color: c.textMuted,
      fontSize: compact && Platform.OS !== 'web' ? 12 : 11,
      textAlign: 'center',
    },
    tabLabelOn: { fontWeight: '800', fontFamily: fontFamily.extrabold },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: { fontSize: 10, fontWeight: '900', lineHeight: 12 },
    pager: { flex: 1, minHeight: 0 },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: 4,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    hint: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  });
}
