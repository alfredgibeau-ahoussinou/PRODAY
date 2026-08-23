import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedReaction,
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
import { useReducedMotion } from '../../../motion';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { UniverseChoicePage } from './UniverseChoicePage';
import { UniversePageChrome } from './UniversePageChrome';
import { useUniverseIntroTour } from './useUniverseIntroTour';
import { UNIVERSE_CHOICE_ORDER } from './universeChoiceShared';
import { filterAccessibleUniversePoles } from './filterAccessibleUniversePoles';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import {
  shouldSnapOnDragEnd,
  snapIndexFromOffset,
  UNIVERSE_AMBIENT_BASE,
  UNIVERSE_AMBIENT_FALLBACK,
} from './universePagerSnap';

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
  if (cinematic) return Math.min(screenWidth * 0.44, 420);
  return Math.min(screenWidth * 0.74, screenWidth - 56);
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
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const cinematic = width >= TABLET_BREAKPOINT;
  const itemWidth = resolveItemWidth(width, cinematic);
  const sidePad = Math.max(0, (width - itemWidth) / 2);
  const linesCount = useMemo(() => {
    const filtered = filterAccessibleUniversePoles({
      role: accessRole,
      email: accessEmail,
      isAdmin: accessIsAdmin,
    });
    return filtered;
  }, [accessEmail, accessIsAdmin, accessRole]);

  const lines = linesCount;

  const scrollX = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<CarouselPoleId>>();
  const programmaticScroll = useRef(false);
  const dragSnapHandledRef = useRef(false);
  const lastSnapIndexRef = useRef(0);
  const activeLineRef = useRef<CarouselPoleId>(lines[0] ?? UNIVERSE_CHOICE_ORDER[0]);
  const introTourOnMountRef = useRef(introTour);
  const initialScrollDoneRef = useRef(false);
  const [listReady, setListReady] = useState(false);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const [interactionUnlocked, setInteractionUnlocked] = useState(!introTour);
  const touring = introTour && !interactionUnlocked;

  const snapOffsets = useMemo(
    () => lines.map((_, index) => index * itemWidth),
    [itemWidth, lines],
  );

  const syncLiveIndex = useCallback((index: number) => {
    setLiveIndex(index);
  }, []);

  // Nombre primitif capturé — jamais `lines` / `lines.length` dans le worklet.
  const maxIndex = Math.max(0, lines.length - 1);

  useAnimatedReaction(
    () => {
      if (itemWidth <= 0) return 0;
      const page = scrollX.value / itemWidth;
      return Math.max(0, Math.min(maxIndex, Math.round(page)));
    },
    (index, prev) => {
      if (index !== prev) {
        runOnJS(syncLiveIndex)(index);
      }
    },
    [itemWidth, maxIndex, syncLiveIndex],
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
      const targetX = clamped * itemWidth;
      programmaticScroll.current = true;
      if (haptic) prodayHaptics.tabSwitch();
      lastSnapIndexRef.current = clamped;
      activeLineRef.current = lines[clamped];
      setLiveIndex(clamped);
      runOnUI(() => {
        'worklet';
        scrollTo(listRef, targetX, 0, animated);
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
      if (index >= 0) {
        lastSnapIndexRef.current = index;
        setLiveIndex(index);
      }
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
      const index = snapIndexFromOffset(offsetX, itemWidth, lines.length);
      if (programmaticScroll.current) {
        programmaticScroll.current = false;
        activeLineRef.current = lines[index];
        lastSnapIndexRef.current = index;
        setLiveIndex(index);
        return;
      }
      if (index !== lastSnapIndexRef.current) {
        prodayHaptics.tabSwitch();
        lastSnapIndexRef.current = index;
      }
      activeLineRef.current = lines[index];
      setLiveIndex(index);
      if (touring) dismissTour();
    },
    [dismissTour, itemWidth, lines, touring],
  );

  const handleScrollEndDrag = useCallback(
    (offsetX: number, velocityX: number | undefined) => {
      if (shouldSnapOnDragEnd(velocityX)) {
        dragSnapHandledRef.current = true;
        onSnap(offsetX);
        return;
      }
      dragSnapHandledRef.current = false;
    },
    [onSnap],
  );

  const handleMomentumScrollEnd = useCallback(
    (offsetX: number) => {
      if (dragSnapHandledRef.current) {
        dragSnapHandledRef.current = false;
        return;
      }
      onSnap(offsetX);
    },
    [onSnap],
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
      if (index === liveIndex) {
        handleChoose(lines[index]);
        return;
      }
      scrollToPage(index, true, true);
    },
    [
      dismissTour,
      handleChoose,
      interactionLocked,
      lines,
      liveIndex,
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
          reducedMotion={reducedMotion}
        />
      </Pressable>
    ),
    [
      cinematic,
      handleTapNeighbor,
      interactionLocked,
      itemWidth,
      layoutHeight,
      reducedMotion,
      scrollX,
      width,
    ],
  );

  const linesLen = lines.length;
  // Couleur ambient via React state (liveIndex) — pas d'interpolateColor worklet.
  const ambientAccent =
    linesLen > 0
      ? UNIVERSE_ACCENT[lines[Math.max(0, Math.min(maxIndex, liveIndex))] ?? lines[0]]
      : UNIVERSE_AMBIENT_FALLBACK;

  const ambientStyle = useAnimatedStyle(() => {
    if (itemWidth <= 0 || linesLen === 0) return { opacity: 0.12 };
    const page = scrollX.value / itemWidth;
    const distToSnap = Math.abs(page - Math.round(page));
    const opacity = interpolate(
      distToSnap,
      [0, 0.45, 1],
      [0.28, 0.18, 0.1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  }, [itemWidth, linesLen]);

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
      <View style={[styles.ambientBase, { backgroundColor: UNIVERSE_AMBIENT_BASE }]} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientAccent,
          { backgroundColor: ambientAccent },
          ambientStyle,
        ]}
      />

      <Animated.FlatList
        ref={listRef}
        data={lines}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={lines.length > 1}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        disableIntervalMomentum
        scrollEnabled={!interactionLocked && lines.length > 1}
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          ...(layoutHeight > 0 ? { minHeight: layoutHeight } : null),
        }}
        onLayout={() => setListReady(true)}
        onScrollBeginDrag={() => {
          dragSnapHandledRef.current = false;
          if (interactionLocked) return;
          if (touring) dismissTour();
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) =>
          handleScrollEndDrag(e.nativeEvent.contentOffset.x, e.nativeEvent.velocity?.x)
        }
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        style={styles.list}
      />

      <UniversePageChrome
        lines={lines}
        activeIndex={liveIndex}
        scrollX={scrollX}
        itemWidth={itemWidth}
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
      backgroundColor: UNIVERSE_AMBIENT_BASE,
    },
    ambientBase: {
      ...StyleSheet.absoluteFillObject,
    },
    ambientAccent: {
      position: 'absolute',
      top: cinematic ? '16%' : '20%',
      alignSelf: 'center',
      width: cinematic ? '52%' : '88%',
      aspectRatio: 1,
      borderRadius: 9999,
    },
    list: {
      flex: 1,
    },
  });
}
