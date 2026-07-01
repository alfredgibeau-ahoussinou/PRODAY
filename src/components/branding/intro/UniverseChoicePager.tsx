import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { productLineToCarouselPole } from '../../../models/CarouselPole';
import type { ProductLineId } from '../../../models/ProductLine';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { UniverseChoicePage } from './UniverseChoicePage';
import { UniversePageChrome } from './UniversePageChrome';
import { useUniverseIntroTour } from './useUniverseIntroTour';
import { UNIVERSE_CHOICE_ORDER } from './universeChoiceShared';

// TODO(phase6-carousel): migrer vers la cible 6 pôles (incluant pro_player distinct).
const UNIVERSE_ORDER = UNIVERSE_CHOICE_ORDER;

interface UniverseChoicePagerProps {
  onChoose: (pole: CarouselPoleId) => void;
  introTour?: boolean;
  interactionLocked?: boolean;
  initialLine?: ProductLineId;
  initialCarouselPole?: CarouselPoleId;
  showDismiss?: boolean;
  onDismiss?: () => void;
}

export const UniverseChoicePager: React.FC<UniverseChoicePagerProps> = ({
  onChoose,
  introTour = false,
  interactionLocked = false,
  initialLine,
  initialCarouselPole,
  showDismiss = false,
  onDismiss,
}) => {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<CarouselPoleId>>();
  const programmaticScroll = useRef(false);
  const activeLineRef = useRef<CarouselPoleId>(UNIVERSE_ORDER[0]);
  const introTourOnMountRef = useRef(introTour);
  const initialScrollDoneRef = useRef(false);
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
      if (width <= 0) return;
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

  const onActiveLine = useCallback((line: CarouselPoleId) => {
    activeLineRef.current = line;
    const index = UNIVERSE_ORDER.indexOf(line);
    if (index >= 0) setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const pole = initialCarouselPole ?? (initialLine ? productLineToCarouselPole(initialLine) : null);
    if (!pole || !listReady || width <= 0 || initialScrollDoneRef.current) return;
    const index = UNIVERSE_ORDER.indexOf(pole);
    if (index < 0) return;
    initialScrollDoneRef.current = true;
    scrollToPage(index, false, false);
  }, [initialCarouselPole, initialLine, listReady, scrollToPage, width]);

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
    (line: CarouselPoleId) => {
      if (interactionLocked) return;
      if (touring) dismissTour();
      onChoose(line);
    },
    [dismissTour, interactionLocked, onChoose, touring]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselPoleId; index: number }) => (
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
        scrollEnabled={!interactionLocked}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onLayout={() => setListReady(true)}
        onScrollBeginDrag={() => {
          if (interactionLocked) return;
          if (touring) dismissTour();
        }}
        onScroll={onScroll}
        decelerationRate="fast"
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
        activeIndex={currentIndex}
        scrollX={scrollX}
        pageWidth={width}
        touring={touring}
        interactionLocked={interactionLocked}
        showDismiss={showDismiss}
        onDismiss={onDismiss}
        onSkip={dismissTour}
        onChoose={handleChoose}
        onJumpToIndex={(index) => scrollToPage(index, true, true)}
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
