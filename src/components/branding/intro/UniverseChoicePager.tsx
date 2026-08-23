import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../../../models/CarouselPole';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { UniverseChoicePage } from './UniverseChoicePage';
import { UniversePageChrome } from './UniversePageChrome';
import { useUniverseIntroTour } from './useUniverseIntroTour';
import { UNIVERSE_CHOICE_ORDER } from './universeChoiceShared';
import { filterAccessibleUniversePoles } from './filterAccessibleUniversePoles';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { PRODAY_MASTER } from '../../../theme/prodayBrand';

const TABLET_BREAKPOINT = 768;

interface UniverseChoicePagerProps {
  onChoose: (pole: CarouselPoleId) => void;
  introTour?: boolean;
  interactionLocked?: boolean;
  initialLine?: ProductLineId;
  initialCarouselPole?: CarouselPoleId;
  /** Rôle session — filtre ACL des univers. */
  accessRole?: UserRole | null;
  accessEmail?: string | null;
  accessIsAdmin?: boolean;
  showDismiss?: boolean;
  onDismiss?: () => void;
}

function resolveItemWidth(screenWidth: number, cinematic: boolean): number {
  if (cinematic) return Math.min(screenWidth * 0.42, 440);
  return Math.min(screenWidth * 0.78, screenWidth - 48);
}

export const UniverseChoicePager: React.FC<UniverseChoicePagerProps> = ({
  onChoose,
  introTour = false,
  interactionLocked = false,
  initialLine,
  initialCarouselPole,
  accessRole = null,
  accessEmail = null,
  accessIsAdmin = false,
  showDismiss = false,
  onDismiss,
}) => {
  const { width } = useWindowDimensions();
  const cinematic = width >= TABLET_BREAKPOINT;
  const itemWidth = resolveItemWidth(width, cinematic);
  const sidePad = Math.max(0, (width - itemWidth) / 2);

  const lines = useMemo(
    () =>
      filterAccessibleUniversePoles({
        role: accessRole,
        email: accessEmail,
        isAdmin: accessIsAdmin,
      }),
    [accessEmail, accessIsAdmin, accessRole],
  );

  const scrollX = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<CarouselPoleId>>();
  const programmaticScroll = useRef(false);
  const activeLineRef = useRef<CarouselPoleId>(lines[0] ?? UNIVERSE_CHOICE_ORDER[0]);
  const introTourOnMountRef = useRef(introTour);
  const initialScrollDoneRef = useRef(false);
  const [listReady, setListReady] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactionUnlocked, setInteractionUnlocked] = useState(!introTour);
  const touring = introTour && !interactionUnlocked;

  const indexFromOffset = useCallback(
    (offsetX: number) =>
      Math.max(0, Math.min(lines.length - 1, Math.round(offsetX / itemWidth))),
    [itemWidth, lines.length],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const scrollToPage = useCallback(
    (index: number, animated: boolean, haptic: boolean) => {
      if (itemWidth <= 0 || lines.length === 0) return;
      const clamped = Math.max(0, Math.min(lines.length - 1, index));
      programmaticScroll.current = true;
      if (haptic) prodayHaptics.tabSwitch();
      setCurrentIndex(clamped);
      activeLineRef.current = lines[clamped];
      runOnUI(() => {
        'worklet';
        scrollTo(listRef, clamped * itemWidth, 0, animated);
      })();
    },
    [itemWidth, lines, listRef],
  );

  const endTour = useCallback(() => {
    setInteractionUnlocked(true);
  }, []);

  const onActiveLine = useCallback(
    (line: CarouselPoleId) => {
      activeLineRef.current = line;
      const index = lines.indexOf(line);
      if (index >= 0) setCurrentIndex(index);
    },
    [lines],
  );

  useEffect(() => {
    const poleRaw =
      initialCarouselPole ?? (initialLine ? productLineToCarouselPole(initialLine) : null);
    if (!poleRaw || !listReady || itemWidth <= 0 || initialScrollDoneRef.current) return;
    const pole = normalizeCarouselPole(poleRaw);
    const index = lines.indexOf(pole);
    if (index < 0) return;
    initialScrollDoneRef.current = true;
    scrollToPage(index, false, false);
  }, [initialCarouselPole, initialLine, itemWidth, lines, listReady, scrollToPage]);

  // Reset initial scroll when the accessible set changes (ex. auth).
  const linesKey = lines.join('|');
  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [linesKey]);

  const { endTour: cancelIntroTour } = useUniverseIntroTour({
    enabled: introTourOnMountRef.current && lines.length > 1,
    listReady,
    pageWidth: itemWidth,
    listRef,
    lines,
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
        activeLineRef.current = lines[index];
        setCurrentIndex(index);
        return;
      }
      if (index !== currentIndex) {
        prodayHaptics.tabSwitch();
        activeLineRef.current = lines[index];
        setCurrentIndex(index);
      }
      if (touring) dismissTour();
    },
    [currentIndex, dismissTour, indexFromOffset, lines, touring],
  );

  const handleChoose = useCallback(
    (line: CarouselPoleId) => {
      if (interactionLocked) return;
      if (touring) dismissTour();
      onChoose(line);
    },
    [dismissTour, interactionLocked, onChoose, touring],
  );

  const handleTapNeighbor = useCallback(
    (index: number) => {
      if (interactionLocked) return;
      if (touring) dismissTour();
      if (index === currentIndex) {
        handleChoose(lines[index]);
        return;
      }
      scrollToPage(index, true, true);
    },
    [
      currentIndex,
      dismissTour,
      handleChoose,
      interactionLocked,
      lines,
      scrollToPage,
      touring,
    ],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselPoleId; index: number }) => (
      <Pressable
        style={{ width: itemWidth, height: layoutHeight || undefined }}
        onPress={() => handleTapNeighbor(index)}
        disabled={interactionLocked}
        accessibilityRole="button"
        accessibilityLabel={`Univers ${item}`}
      >
        <UniverseChoicePage
          line={item}
          index={index}
          pageWidth={width}
          pageHeight={layoutHeight}
          itemWidth={itemWidth}
          scrollX={scrollX}
          cinematic={cinematic}
        />
      </Pressable>
    ),
    [
      cinematic,
      handleTapNeighbor,
      interactionLocked,
      itemWidth,
      layoutHeight,
      scrollX,
      width,
    ],
  );

  const activeAccent = UNIVERSE_ACCENT[lines[currentIndex] ?? lines[0]];

  const ambientStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0) return { opacity: 0.14 };
    const page = scrollX.value / itemWidth;
    const i = Math.max(0, Math.min(Math.max(lines.length - 1, 0), Math.round(page)));
    const dist = Math.abs(page - i);
    const opacity = 0.1 + (1 - Math.min(1, dist)) * 0.18;
    return { opacity };
  });

  const styles = useMemo(() => createStyles(cinematic), [cinematic]);

  if (lines.length === 0) {
    return <View style={styles.root} />;
  }

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== layoutHeight) setLayoutHeight(h);
      }}
    >
      <View style={[styles.ambientBase, { backgroundColor: PRODAY_MASTER.black }]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.ambientAccent, { backgroundColor: activeAccent }, ambientStyle]}
      />

      <Animated.FlatList
        ref={listRef}
        data={lines}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={itemWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        scrollEnabled={!interactionLocked && lines.length > 1}
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          ...(layoutHeight > 0 ? { minHeight: layoutHeight } : null),
        }}
        onLayout={() => setListReady(true)}
        onScrollBeginDrag={() => {
          if (interactionLocked) return;
          if (touring) dismissTour();
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => onSnap(e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) => onSnap(e.nativeEvent.contentOffset.x)}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        style={styles.list}
      />

      <UniversePageChrome
        lines={lines}
        activeIndex={currentIndex}
        touring={touring}
        interactionLocked={interactionLocked}
        showDismiss={showDismiss}
        cinematic={cinematic}
        onDismiss={onDismiss}
        onSkip={dismissTour}
        onChoose={handleChoose}
        onJumpToIndex={(index) => scrollToPage(index, true, true)}
      />
    </View>
  );
};

function createStyles(cinematic: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: PRODAY_MASTER.black,
    },
    ambientBase: {
      ...StyleSheet.absoluteFillObject,
    },
    ambientAccent: {
      position: 'absolute',
      top: cinematic ? '18%' : '22%',
      alignSelf: 'center',
      width: cinematic ? '55%' : '90%',
      aspectRatio: 1,
      borderRadius: 9999,
    },
    list: {
      flex: 1,
    },
  });
}
