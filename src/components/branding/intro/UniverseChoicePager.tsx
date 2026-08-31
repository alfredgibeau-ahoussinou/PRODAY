import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../../../models/CarouselPole';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';
import { prodayMotion, useReducedMotion } from '../../../motion';
import { spacing } from '../../../theme/designTokens';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { UniverseChoicePage } from './UniverseChoicePage';
import { UniverseChoiceSlide } from './UniverseChoiceSlide';
import { UniversePageChrome } from './UniversePageChrome';
import { useUniverseIntroTour } from './useUniverseIntroTour';
import { UNIVERSE_CHOICE_ORDER } from './universeChoiceShared';
import { filterAccessibleUniversePoles } from './filterAccessibleUniversePoles';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { universePoleDisplayName } from './universePoleBrand';
import {
  shouldSnapOnDragEnd,
  snapIndexFromOffset,
  UNIVERSE_AMBIENT_BASE,
  UNIVERSE_AMBIENT_FALLBACK,
  UNIVERSE_DECELERATION_RATE,
} from './universePagerSnap';

const TABLET_BREAKPOINT = 768;

interface UniverseChoicePagerProps {
  onChoose: (pole: CarouselPoleId) => void;
  introTour?: boolean;
  interactionLocked?: boolean;
  /** Pôle en cours de confirmation — feedback immédiat CTA / slide. */
  confirmingPole?: CarouselPoleId | null;
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
  if (cinematic) return Math.min(screenWidth * 0.42, 400);
  return Math.min(screenWidth * 0.78, screenWidth - 48);
}

export const UniverseChoicePager: React.FC<UniverseChoicePagerProps> = ({
  onChoose,
  introTour = false,
  interactionLocked = false,
  confirmingPole = null,
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
  const ambientOpacity = useSharedValue(0.1);
  const listRef = useAnimatedRef<Animated.FlatList<CarouselPoleId>>();
  const programmaticScroll = useRef(false);
  const dragSnapHandledRef = useRef(false);
  const lastSnapIndexRef = useRef(0);
  const liveIndexRef = useRef(0);
  const activeLineRef = useRef<CarouselPoleId>(lines[0] ?? UNIVERSE_CHOICE_ORDER[0]);
  const introTourOnMountRef = useRef(introTour);
  const initialScrollDoneRef = useRef(false);
  const [listReady, setListReady] = useState(cinematic);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const [interactionUnlocked, setInteractionUnlocked] = useState(!introTour);
  const touring = introTour && !interactionUnlocked;

  const snapOffsets = useMemo(
    () => lines.map((_, index) => index * itemWidth),
    [itemWidth, lines],
  );

  const syncLiveIndex = useCallback((index: number) => {
    liveIndexRef.current = index;
    setLiveIndex(index);
  }, []);

  // Nombre primitif capturé — jamais `lines` / `lines.length` dans le worklet.
  const maxIndex = Math.max(0, lines.length - 1);
  const liveLine = lines[liveIndex] ?? lines[0];
  const activeAccent =
    (liveLine ? UNIVERSE_ACCENT[liveLine] : undefined) ?? UNIVERSE_AMBIENT_FALLBACK;

  useEffect(() => {
    if (reducedMotion) {
      ambientOpacity.value = 0.06;
      return;
    }
    ambientOpacity.value = 0.06;
    ambientOpacity.value = withTiming(0.1, {
      duration: prodayMotion.duration.slow,
      easing: prodayMotion.easing.out,
    });
  }, [activeAccent, ambientOpacity, reducedMotion]);

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: ambientOpacity.value,
  }));

  useAnimatedReaction(
    () => {
      if (cinematic || itemWidth <= 0) return 0;
      const page = scrollX.value / itemWidth;
      return Math.max(0, Math.min(maxIndex, Math.round(page)));
    },
    (index, prev) => {
      if (cinematic) return;
      if (index !== prev) {
        runOnJS(syncLiveIndex)(index);
      }
    },
    [cinematic, itemWidth, maxIndex, syncLiveIndex],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const scrollToPage = useCallback(
    (index: number, animated: boolean, haptic: boolean) => {
      if (lines.length === 0) return;
      const clamped = Math.max(0, Math.min(lines.length - 1, index));
      lastSnapIndexRef.current = clamped;
      liveIndexRef.current = clamped;
      activeLineRef.current = lines[clamped];
      setLiveIndex(clamped);

      if (cinematic) {
        if (haptic) prodayHaptics.tabSwitch();
        return;
      }
      if (itemWidth <= 0) return;
      const targetX = clamped * itemWidth;
      programmaticScroll.current = true;
      if (haptic) prodayHaptics.tabSwitch();
      runOnUI(() => {
        'worklet';
        scrollTo(listRef, targetX, 0, animated);
      })();
    },
    [cinematic, itemWidth, lines, listRef],
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
        liveIndexRef.current = index;
        setLiveIndex(index);
      }
    },
    [lines],
  );

  useEffect(() => {
    const poleRaw =
      initialCarouselPole ?? (initialLine ? productLineToCarouselPole(initialLine) : null);
    if (!poleRaw || initialScrollDoneRef.current) return;
    if (!cinematic && (!listReady || itemWidth <= 0)) return;
    const pole = normalizeCarouselPole(poleRaw);
    const index = lines.indexOf(pole);
    if (index < 0) return;
    initialScrollDoneRef.current = true;
    scrollToPage(index, false, false);
  }, [
    cinematic,
    initialCarouselPole,
    initialLine,
    itemWidth,
    lines,
    listReady,
    scrollToPage,
  ]);

  const linesKey = lines.join('|');
  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [linesKey]);

  const { endTour: cancelIntroTour } = useUniverseIntroTour({
    enabled: introTourOnMountRef.current && lines.length > 1 && !cinematic,
    listReady,
    pageWidth: itemWidth,
    listRef,
    lines,
    onActiveLine,
    onTourEnd: endTour,
  });

  // Tour tablette : avance l’index sans FlatList.
  useEffect(() => {
    if (!introTourOnMountRef.current || !cinematic || lines.length <= 1) return undefined;
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => setTimeout(r, 500));
      for (let i = 0; i < lines.length; i += 1) {
        if (cancelled) return;
        if (i > 0) prodayHaptics.tabSwitch();
        onActiveLine(lines[i]);
        await new Promise((r) => setTimeout(r, i === 0 ? 1200 : 1900));
      }
      if (!cancelled) endTour();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [cinematic, endTour, lines, onActiveLine]);

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
        liveIndexRef.current = index;
        setLiveIndex(index);
        return;
      }
      if (index !== lastSnapIndexRef.current) {
        prodayHaptics.tabSwitch();
        lastSnapIndexRef.current = index;
      }
      activeLineRef.current = lines[index];
      liveIndexRef.current = index;
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
      if (index === liveIndexRef.current) {
        handleChoose(lines[index]);
        return;
      }
      scrollToPage(index, true, true);
    },
    [dismissTour, handleChoose, interactionLocked, lines, scrollToPage, touring],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CarouselPoleId; index: number }) => (
      <UniverseChoiceSlide
        item={item}
        index={index}
        itemWidth={itemWidth}
        layoutHeight={layoutHeight}
        pageWidth={width}
        scrollX={scrollX}
        reducedMotion={reducedMotion}
        selected={index === liveIndexRef.current}
        confirming={confirmingPole != null && item === confirmingPole}
        interactionLocked={interactionLocked}
        onPress={handleTapNeighbor}
      />
    ),
    [
      confirmingPole,
      handleTapNeighbor,
      interactionLocked,
      itemWidth,
      layoutHeight,
      reducedMotion,
      scrollX,
      width,
    ],
  );

  const styles = useMemo(() => createStyles(), []);

  const sideRail = cinematic ? (
    <View style={styles.rail} accessibilityRole="list">
      {lines.map((line, index) => {
        const selected = index === liveIndex;
        const label = universePoleDisplayName(line);
        return (
          <Pressable
            key={line}
            onPress={() => handleTapNeighbor(index)}
            disabled={interactionLocked}
            style={[styles.railItem, selected && styles.railItemSelected]}
            accessibilityRole="button"
            accessibilityLabel={`Univers ${label}`}
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.railMark,
                { backgroundColor: selected ? activeAccent : 'rgba(255,255,255,0.2)' },
              ]}
            />
            <Text
              style={[
                styles.railLabel,
                selected && { color: activeAccent, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  ) : null;

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
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent']}
        style={styles.vignetteTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.vignetteBottom}
        pointerEvents="none"
      />

      {/* Halo ambient — accent unique de l’univers actif (JS, pas worklet). */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          { backgroundColor: activeAccent },
          ambientStyle,
        ]}
      />

      {cinematic ? (
        <View style={styles.cinematicStage} pointerEvents="none">
          <UniverseChoicePage
            line={lines[liveIndex] ?? lines[0]}
            index={liveIndex}
            pageWidth={width}
            pageHeight={layoutHeight}
            itemWidth={Math.min(width * 0.5, 480)}
            scrollX={scrollX}
            cinematic
            reducedMotion={reducedMotion}
            staticFocus
            focused
          />
        </View>
      ) : (
        <Animated.FlatList
          ref={listRef}
          data={lines}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          extraData={liveIndex}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={lines.length > 1}
          decelerationRate={UNIVERSE_DECELERATION_RATE}
          snapToOffsets={snapOffsets}
          snapToAlignment="center"
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
          removeClippedSubviews={false}
          windowSize={5}
          initialNumToRender={Math.min(lines.length, 4)}
          maxToRenderPerBatch={3}
          style={styles.list}
        />
      )}

      <UniversePageChrome
        lines={lines}
        activeIndex={liveIndex}
        touring={touring}
        interactionLocked={interactionLocked}
        confirming={confirmingPole != null}
        showDismiss={showDismiss}
        cinematic={cinematic}
        onDismiss={onDismiss}
        onSkip={dismissTour}
        onChoose={handleChoose}
        onJumpToIndex={(index) => scrollToPage(index, true, true)}
        hidePagerDots={cinematic}
        sideRail={sideRail}
      />
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: UNIVERSE_AMBIENT_BASE,
    },
    list: {
      flex: 1,
    },
    cinematicStage: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: '28%',
      paddingBottom: '12%',
    },
    ambientGlow: {
      position: 'absolute',
      width: '70%',
      height: '42%',
      borderRadius: 999,
      top: '22%',
      alignSelf: 'center',
      left: '15%',
    },
    vignetteTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '20%',
      zIndex: 1,
    },
    vignetteBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '32%',
      zIndex: 1,
    },
    rail: {
      gap: spacing.xs,
    },
    railItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
    },
    railItemSelected: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    railMark: {
      width: 3,
      height: 18,
      borderRadius: 2,
    },
    railLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: -0.2,
      color: 'rgba(255,255,255,0.48)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
