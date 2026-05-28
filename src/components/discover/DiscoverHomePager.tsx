import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { type DiscoverChapterId } from '../../content/discoverChapters';
import { DiscoverChapterRail } from './DiscoverChapterRail';
import { CarouselDot } from './CarouselDot';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

const { width: W } = Dimensions.get('window');

export interface DiscoverHomePage {
  id: DiscoverChapterId;
  render: () => React.ReactNode;
}

interface DiscoverHomePagerProps {
  pages: DiscoverHomePage[];
  activeChapter: DiscoverChapterId;
  onChapterChange: (id: DiscoverChapterId) => void;
}

/**
 * Accueil invité — navigation par pages horizontales (swipe entre chapitres).
 */
export const DiscoverHomePager: React.FC<DiscoverHomePagerProps> = ({
  pages,
  activeChapter,
  onChapterChange,
}) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, pages.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * W, animated: true });
      onChapterChange(pages[clamped].id);
    },
    [onChapterChange, pages]
  );

  const goToChapter = useCallback(
    (id: DiscoverChapterId) => {
      const index = pages.findIndex((p) => p.id === id);
      if (index >= 0) goToIndex(index);
    },
    [goToIndex, pages]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      const index = Math.round(e.contentOffset.x / W);
      if (pages[index]) {
        runOnJS(onChapterChange)(pages[index].id);
      }
    },
  });

  const pageNum = pages.findIndex((p) => p.id === activeChapter) + 1;

  useEffect(() => {
    const index = pages.findIndex((p) => p.id === activeChapter);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ x: index * W, animated: true });
    }
  }, [activeChapter, pages]);

  return (
    <View style={styles.root}>
      <DiscoverChapterRail active={activeChapter} onSelect={goToChapter} />

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.pager}
      >
        {pages.map((page) => (
          <View key={page.id} style={[styles.page, { width: W }]}>
            {page.render()}
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((p, i) => (
            <CarouselDot
              key={p.id}
              index={i}
              scrollX={scrollX}
              snap={W}
              onPress={() => goToIndex(i)}
            />
          ))}
        </View>
        <Text style={styles.hint}>
          Glissez · {pageNum}/{pages.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { flex: 1 },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  hint: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
