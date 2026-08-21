import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { adminMotion, type AdminNavDirection } from './adminMotion';
import { useAdminMotion } from './AdminMotionProvider';

type Props = {
  sectionKey: string;
  direction: AdminNavDirection;
  children: React.ReactNode;
};

/**
 * Transition entre panes admin — slide léger + opacity.
 * Dock / sidebar restent stables ; seul le contenu bouge.
 * Skip si navigation rapide (évite empilement).
 */
export function AdminPaneTransition({ sectionKey, direction, children }: Props) {
  const reduced = useReducedMotion();
  const { setPaneBusy } = useAdminMotion();
  const [displayed, setDisplayed] = useState(children);
  const currentKey = useRef(sectionKey);
  const pending = useRef(children);
  const busy = useRef(false);
  pending.current = children;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const finishEnter = useCallback(
    (nextKey: string, dir: AdminNavDirection) => {
      currentKey.current = nextKey;
      setDisplayed(pending.current);
      opacity.value = 0;
      translateX.value = dir * adminMotion.paneShift;
      opacity.value = withTiming(1, {
        duration: adminMotion.duration.enter,
        easing: adminMotion.easing.out,
      });
      translateX.value = withTiming(
        0,
        {
          duration: adminMotion.duration.enter,
          easing: adminMotion.easing.out,
        },
        () => {
          busy.current = false;
          runOnJS(setPaneBusy)(false);
        },
      );
    },
    [opacity, translateX, setPaneBusy],
  );

  useEffect(() => {
    if (sectionKey === currentKey.current) {
      setDisplayed(pending.current);
      return;
    }

    if (reduced || busy.current) {
      currentKey.current = sectionKey;
      setDisplayed(pending.current);
      opacity.value = 1;
      translateX.value = 0;
      busy.current = false;
      setPaneBusy(false);
      return;
    }

    const nextKey = sectionKey;
    const dir = direction;
    busy.current = true;
    setPaneBusy(true);

    opacity.value = withTiming(0, {
      duration: adminMotion.duration.exit,
      easing: adminMotion.easing.in,
    });
    translateX.value = withTiming(
      -dir * (adminMotion.paneShift * 0.55),
      {
        duration: adminMotion.duration.exit,
        easing: adminMotion.easing.in,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishEnter)(nextKey, dir);
        } else {
          busy.current = false;
          runOnJS(setPaneBusy)(false);
        }
      },
    );
  }, [sectionKey, direction, reduced, opacity, translateX, finishEnter, setPaneBusy]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.host}>
      <Animated.View style={[styles.fill, style]}>{displayed}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1 },
});
