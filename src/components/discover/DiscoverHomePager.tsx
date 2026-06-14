import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { type DiscoverChapterId } from '../../content/discoverChapters';
import { DiscoverChapterRail } from './DiscoverChapterRail';
import { DiscoverTabRail } from './DiscoverTabRail';
import { CarouselDot } from './CarouselDot';
import { getDiscoverPalette, useDiscoverStyles } from './discoverStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export interface DiscoverHomePage {
  id: DiscoverChapterId;
  render: () => React.ReactNode;
}

interface DiscoverHomePagerProps {
  pages: DiscoverHomePage[];
  activeChapter: DiscoverChapterId;
  onChapterChange: (id: DiscoverChapterId) => void;
  /** Tap sur un onglet (ex. remonter le scroll vertical de la page) */
  onChapterSelect?: (id: DiscoverChapterId) => void;
  /** Dans la feuille blanche (accueil) — fond transparent, footer compact */
  embedded?: boolean;
  /** Style accueil éditorial (onglets soulignés, fond crème) */
  ui?: 'default' | 'editorial' | 'immersive' | 'light';
}

/**
 * Accueil invité — navigation par pages horizontales (swipe entre chapitres).
 */
export const DiscoverHomePager: React.FC<DiscoverHomePagerProps> = ({
  pages,
  activeChapter,
  onChapterChange,
  onChapterSelect,
  embedded = false,
  ui = 'default',
}) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createPagerStyles(c, palette), [c, palette]);
  const editorial = ui === 'editorial';
  const immersive = ui === 'immersive';
  const light = ui === 'light';
  const { width: pageWidth } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  /** Évite que onScrollEndDrag annule un tap onglet (offset encore à 0 pendant le scroll programmé). */
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
      if (!animated) {
        suppressChapterSyncRef.current = false;
      }
    },
    [onChapterChange, pageWidth, scrollX]
  );

  const goToChapter = useCallback(
    (id: DiscoverChapterId, animated = false) => {
      const index = pages.findIndex((p) => p.id === id);
      if (index >= 0) goToIndex(index, animated);
    },
    [goToIndex, pages]
  );

  /** Sync chapitre uniquement après swipe utilisateur. */
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

  /** Sync pager quand le parent change de chapitre (ex. CTA intro « Voir le live »). */
  useEffect(() => {
    const index = pagesRef.current.findIndex((p) => p.id === activeChapter);
    if (index < 0 || pageWidth <= 0) return;
    const x = index * pageWidth;
    suppressChapterSyncRef.current = true;
    scrollX.value = x;
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [activeChapter, pageWidth, scrollX]);

  return (
    <View
      style={[
        styles.root,
        embedded && styles.rootEmbedded,
        editorial && styles.rootEditorial,
        immersive && styles.rootImmersive,
        light && styles.rootLight,
      ]}
    >
      {editorial ? (
        <DiscoverTabRail active={activeChapter} onSelect={(id) => goToChapter(id, false)} />
      ) : (
        <DiscoverChapterRail
          active={activeChapter}
          onSelect={(id) => {
            goToChapter(id, false);
            onChapterSelect?.(id);
          }}
          embedded={embedded}
          variant={immersive ? 'immersive' : light ? 'light' : 'default'}
          scrollX={light ? scrollX : undefined}
          pageWidth={light ? pageWidth : undefined}
        />
      )}

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
        {pages.map((page) => (
          <View key={page.id} style={[styles.page, { width: pageWidth }]}>
            {page.render()}
          </View>
        ))}
      </Animated.ScrollView>

      {!immersive && !light ? (
        <View
          style={[
            styles.footer,
            embedded && styles.footerEmbedded,
            editorial && styles.footerEditorial,
          ]}
        >
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
          <Text style={[styles.hint, immersive && styles.hintImmersive]}>
            Glissez · {pageNum}/{pages.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

function createPagerStyles(c: AppColors, palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    rootEmbedded: { backgroundColor: 'transparent' },
    rootEditorial: { backgroundColor: palette.canvas },
    rootImmersive: { backgroundColor: palette.canvas },
    rootLight: { backgroundColor: palette.canvas },
    pager: { flex: 1, minHeight: 0 },
    page: { flex: 1, minHeight: 0 },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: 4,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.soft,
    },
    footerEmbedded: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      paddingVertical: spacing.xs + 2,
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    footerEditorial: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    footerLight: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    hint: {
      fontSize: 9,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    hintImmersive: { color: palette.faint },
  });
}
