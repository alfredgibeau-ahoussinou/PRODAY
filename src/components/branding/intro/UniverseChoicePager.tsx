import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import type { ProductLineId } from '../../../models/ProductLine';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { UniverseChoicePage } from './UniverseChoicePage';
import { UniversePageChrome } from './UniversePageChrome';
import { useUniverseIntroTour } from './useUniverseIntroTour';

const UNIVERSE_ORDER: ProductLineId[] = ['homme', 'woman', 'pro', 'sante'];

interface UniverseChoicePagerProps {
  onChoose: (line: ProductLineId) => void;
  introTour?: boolean;
}

export const UniverseChoicePager: React.FC<UniverseChoicePagerProps> = ({
  onChoose,
  introTour = false,
}) => {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<ProductLineId>>();
  const programmaticScroll = useRef(false);
  const activeLineRef = useRef<ProductLineId>(UNIVERSE_ORDER[0]);
  const introTourOnMountRef = useRef(introTour);
  const [listReady, setListReady] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionUnlocked, setInteractionUnlocked] = useState(!introTour);
  const touring = introTour && !interactionUnlocked;

  const indexFromOffset = useCallback(
    (offsetX: number) =>
      Math.max(0, Math.min(UNIVERSE_ORDER.length - 1, Math.round(offsetX / width))),
    [width]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const scrollToPage = useCallback(
    (index: number, animated: boolean, haptic: boolean) => {
      const clamped = Math.max(0, Math.min(UNIVERSE_ORDER.length - 1, index));
      programmaticScroll.current = true;
      if (haptic) prodayHaptics.tabSwitch();
      setCurrentIndex(clamped);
      activeLineRef.current = UNIVERSE_ORDER[clamped];
      runOnUI(() => {
        'worklet';
        scrollTo(listRef, clamped * width, 0, animated);
      })();
    },
    [listRef, width]
  );

  const endTour = useCallback(() => {
    setInteractionUnlocked(true);
  }, []);

  const onActiveLine = useCallback((line: ProductLineId) => {
    activeLineRef.current = line;
    const index = UNIVERSE_ORDER.indexOf(line);
    if (index >= 0) setCurrentIndex(index);
  }, []);

  const { endTour: cancelIntroTour } = useUniverseIntroTour({
    enabled: introTourOnMountRef.current,
    listReady,
    pageWidth: width,
    listRef,
    lines: UNIVERSE_ORDER,
    onActiveLine,
    onTourEnd: endTour,
  });

  const dismissTour = useCallback(() => {
    cancelIntroTour();
    endTour();
  }, [cancelIntroTour, endTour]);

  const onSnap = useCallback(
    (offsetX: number) => {
      const index = indexFromOffset(offsetX);
      if (programmaticScroll.current) {
        programmaticScroll.current = false;
        activeLineRef.current = UNIVERSE_ORDER[index];
        setCurrentIndex(index);
        return;
      }
      if (index !== currentIndex) {
        prodayHaptics.tabSwitch();
        activeLineRef.current = UNIVERSE_ORDER[index];
        setCurrentIndex(index);
      }
      if (touring) dismissTour();
    },
    [currentIndex, dismissTour, indexFromOffset, touring]
  );

  const handleChoose = useCallback(
    (line: ProductLineId) => {
      if (touring) dismissTour();
      onChoose(line);
    },
    [dismissTour, onChoose, touring]
  );

  const handleNext = useCallback(() => {
    if (touring) dismissTour();
    const next = Math.min(UNIVERSE_ORDER.length - 1, currentIndex + 1);
    scrollToPage(next, true, true);
  }, [currentIndex, dismissTour, scrollToPage, touring]);

  const canGoNext = currentIndex < UNIVERSE_ORDER.length - 1;

  const renderItem = useCallback(
    ({ item, index }: { item: ProductLineId; index: number }) => (
      <UniverseChoicePage
        line={item}
        index={index}
        pageWidth={width}
        pageHeight={layoutHeight}
        scrollX={scrollX}
      />
    ),
    [layoutHeight, scrollX, width]
  );

  const styles = useMemo(() => createStyles(), []);

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== layoutHeight) setLayoutHeight(h);
      }}
    >
      <Animated.FlatList
        ref={listRef}
        data={UNIVERSE_ORDER}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onLayout={() => setListReady(true)}
        onScrollBeginDrag={() => {
          if (touring) dismissTour();
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => onSnap(e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) => onSnap(e.nativeEvent.contentOffset.x)}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        style={styles.list}
      />

      <UniversePageChrome
        lines={UNIVERSE_ORDER}
        scrollX={scrollX}
        pageWidth={width}
        touring={touring}
        onSkip={dismissTour}
        onChoose={handleChoose}
        getActiveLine={() => activeLineRef.current}
        onNext={handleNext}
        canGoNext={canGoNext}
      />
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#0A0A0A',
    },
    list: {
      flex: 1,
    },
  });
}
