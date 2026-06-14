import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { MatchChapterId } from '../../content/matchChapters';
import { MatchTabRail } from './MatchTabRail';
import { PagerPage } from '../motion/PagerPage';
import { useAppTheme } from '../../context/ProductLineContext';

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
}

export const MatchPager: React.FC<MatchPagerProps> = ({
  pages,
  activeChapter,
  onChapterChange,
  amicauxBadge,
  convocationsBadge,
  centreBadge,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: pageWidth } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const suppressChapterSyncRef = useRef(false);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const activeChapterRef = useRef(activeChapter);
  activeChapterRef.current = activeChapter;

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
      <MatchTabRail
        active={activeChapter}
        onSelect={(id) => goToChapter(id, false)}
        amicauxBadge={amicauxBadge}
        convocationsBadge={convocationsBadge}
        centreBadge={centreBadge}
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

    </View>
  );
};

function createStyles(_c: { surfaceMuted: string; border: string }) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    pager: { flex: 1, minHeight: 0 },
  });
}
