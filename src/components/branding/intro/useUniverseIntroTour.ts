import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import {
  runOnUI,
  scrollTo,
  type AnimatedRef,
} from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { prodayHaptics } from '../../../utils/prodayHaptics';

const TOUR_HOLD_MS = 1200;
const TOUR_SCROLL_MS = 700;
const TOUR_START_MS = 500;

type AnimatedFlatList = Animated.FlatList<CarouselPoleId>;

interface UseUniverseIntroTourOptions {
  enabled: boolean;
  listReady: boolean;
  pageWidth: number;
  listRef: AnimatedRef<AnimatedFlatList>;
  lines: CarouselPoleId[];
  onActiveLine: (line: CarouselPoleId) => void;
  onTourEnd: () => void;
}

/** Tour Men → Women → Pro — transition native page par page. */
export function useUniverseIntroTour({
  enabled,
  listReady,
  pageWidth,
  listRef,
  lines,
  onActiveLine,
  onTourEnd,
}: UseUniverseIntroTourOptions) {
  const tourStartedRef = useRef(false);
  const tourRunId = useRef(0);

  const cancelTour = useCallback(() => {
    tourRunId.current += 1;
  }, []);

  const endTour = useCallback(() => {
    cancelTour();
    onTourEnd();
  }, [cancelTour, onTourEnd]);

  const goToPage = useCallback(
    (index: number, animated: boolean) => {
      if (pageWidth <= 0) return;
      const clamped = Math.max(0, Math.min(index, lines.length - 1));
      onActiveLine(lines[clamped]);
      runOnUI(() => {
        'worklet';
        scrollTo(listRef, clamped * pageWidth, 0, animated);
      })();
    },
    [lines, listRef, onActiveLine, pageWidth]
  );

  useEffect(() => {
    if (!enabled || tourStartedRef.current || !listReady || pageWidth <= 0) return undefined;

    tourStartedRef.current = true;
    const runId = tourRunId.current + 1;

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), ms);
      });

    const runTour = async () => {
      await wait(TOUR_START_MS);
      for (let i = 0; i < lines.length; i += 1) {
        if (cancelled || tourRunId.current !== runId) return;
        if (i > 0) prodayHaptics.tabSwitch();
        goToPage(i, true);
        await wait(i === 0 ? TOUR_HOLD_MS : TOUR_SCROLL_MS + TOUR_HOLD_MS);
      }
      if (!cancelled && tourRunId.current === runId) {
        await wait(400);
        onTourEnd();
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) void runTour();
    });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [enabled, goToPage, lines, listReady, onTourEnd, pageWidth]);

  return { endTour, cancelTour };
}
