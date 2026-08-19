import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { MatchChapterId } from '../../content/matchChapters';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { MatchChapterRail } from './MatchChapterRail';
import { CarouselDot } from '../discover/CarouselDot';
import { ProDayText } from '../ui/ProDayText';
import { PagerPage } from '../motion/PagerPage';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';
import { useMatchSkinTokens } from './matchCenterUi';

export interface MatchPage {
  id: MatchChapterId;
  render: () => React.ReactNode;
}

interface MatchPagerProps {
  pages: MatchPage[];
  activeChapter: MatchChapterId;
  onChapterChange: (id: MatchChapterId) => void;
  amicauxBadge?: number;
  convocationsBadge?: number;
  centreBadge?: number | string;
  gameMode?: boolean;
  coachSkin?: boolean;
}

export const MatchPager: React.FC<MatchPagerProps> = ({
  pages,
  activeChapter,
  onChapterChange,
  amicauxBadge,
  convocationsBadge,
  centreBadge,
  gameMode = false,
  coachSkin = false,
}) => {
  const { colors } = useAppTheme();
  const skin = useMatchSkinTokens();
  const accent = gameMode && skin.joueurSkin ? skin.accent : colors.accent;
  const styles = useMemo(() => createStyles(accent, skin), [accent, skin]);
  const { width: pageWidth } = useWindowDimensions();
  const [pagerHeight, setPagerHeight] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const suppressChapterSyncRef = useRef(false);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const activeChapterRef = useRef(activeChapter);
  activeChapterRef.current = activeChapter;

  const onPagerLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h <= 0) return;
    setPagerHeight((prev) => (prev !== h ? h : prev));
  }, []);

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
    (id: MatchChapterId, animated = false) => {
      const index = pages.findIndex((p) => p.id === id);
      if (index >= 0) goToIndex(index, animated);
    },
    [goToIndex, pages]
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

  const pageNum = pages.findIndex((p) => p.id === activeChapter) + 1;

  useEffect(() => {
    const index = pagesRef.current.findIndex((p) => p.id === activeChapter);
    if (index < 0 || pageWidth <= 0) return;
    suppressChapterSyncRef.current = true;
    scrollX.value = index * pageWidth;
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  }, [activeChapter, pageWidth, scrollX]);

  return (
    <View style={styles.root}>
      <MatchChapterRail
        active={activeChapter}
        onSelect={(id) => goToChapter(id, false)}
        amicauxBadge={amicauxBadge}
        convocationsBadge={convocationsBadge}
        centreBadge={centreBadge}
        gameMode={gameMode}
        coachSkin={coachSkin}
      />

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
        onLayout={onPagerLayout}
        contentContainerStyle={
          pagerHeight > 0 ? { height: pagerHeight } : undefined
        }
        nestedScrollEnabled
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
      >
        {pages.map((page, index) => (
          <PagerPage
            key={page.id}
            index={index}
            scrollX={scrollX}
            pageWidth={pageWidth}
            pageHeight={pagerHeight}
          >
            {page.render()}
          </PagerPage>
        ))}
      </Animated.ScrollView>

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
        <ProDayText variant="caption" style={styles.hint}>
          Glissez · {pageNum}/{pages.length}
        </ProDayText>
      </View>
    </View>
  );
};

function createStyles(accent: string, skin: ReturnType<typeof useMatchSkinTokens>) {
  const border = skin.joueurSkin ? skin.border : MATCH_SITE.border;
  const muted = skin.joueurSkin ? skin.muted : MATCH_SITE.muted;
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    pager: { flex: 1, minHeight: 0 },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: 2,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    hint: {
      fontSize: 10,
      fontWeight: '600',
      color: muted,
      letterSpacing: 0.4,
    },
  });
}
