import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { HealthChapterId } from '../../content/healthChapters';
import { HealthChapterRail } from './HealthChapterRail';
import { PagerPage } from '../motion';

export interface HealthTabPage {
  id: HealthChapterId;
  render: () => React.ReactNode;
}

interface HealthTabPagerProps {
  pages: HealthTabPage[];
  activeChapter: HealthChapterId;
  onChapterChange: (id: HealthChapterId) => void;
}

export const HealthTabPager: React.FC<HealthTabPagerProps> = ({
  pages,
  activeChapter,
  onChapterChange,
}) => {
  const styles = useMemo(() => createStyles(), []);
  const { width: windowWidth } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const pageWidth = layoutWidth > 0 ? layoutWidth : windowWidth;
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const suppressChapterSyncRef = useRef(false);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const activeChapterRef = useRef(activeChapter);
  activeChapterRef.current = activeChapter;

  const onRootLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w <= 0) return;
    setLayoutWidth((prev) => (prev !== w ? w : prev));
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
    (id: HealthChapterId, animated = false) => {
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
      <HealthChapterRail active={activeChapter} onSelect={(id) => goToChapter(id, false)} />

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

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    pager: { flex: 1, minHeight: 0 },
  });
}
