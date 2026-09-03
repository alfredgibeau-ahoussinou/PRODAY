import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import {
  getMotionPreset,
  PANE_ENTER_SAFETY_MS,
  prodayMotion,
  useReducedMotion,
} from '../../motion';

interface AnimatedTabContentProps {
  activeTab: MainTabId;
  tabOrder?: MainTabId[];
  children: React.ReactNode;
}

/**
 * Cross-fade entre onglets + keep-alive (max 2).
 *
 * Important : animer **chaque couche** (opacity), pas envelopper le stack dans un
 * switch de route — sinon double transition / flash, surtout Accueil ↔ Matchs.
 * Pas de glissement horizontal : fondu premium uniquement.
 */
export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  tabOrder,
  children,
}) => {
  const reduced = useReducedMotion();
  const order = tabOrder ?? MAIN_TAB_ITEMS.map((t) => t.id);
  const cacheRef = useRef(new Map<MainTabId, React.ReactNode>());
  const prevTabRef = useRef(activeTab);
  const tabSwitched = prevTabRef.current !== activeTab;

  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);

  cacheRef.current.set(activeTab, children);
  if (cacheRef.current.size > 2) {
    for (const key of cacheRef.current.keys()) {
      if (key === activeTab) continue;
      cacheRef.current.delete(key);
      if (cacheRef.current.size <= 2) break;
    }
  }
  for (const key of [...cacheRef.current.keys()]) {
    if (!order.includes(key)) cacheRef.current.delete(key);
  }

  if (reduced) {
    return <View style={styles.fill}>{children}</View>;
  }

  const preset = getMotionPreset('tab');

  return (
    <View style={styles.fill}>
      {[...cacheRef.current.entries()].map(([id, node]) => {
        const on = id === activeTab;
        return (
          <TabKeepAliveLayer
            key={id}
            active={on}
            animateOnMount={tabSwitched && on}
            enterMs={preset.enterMs}
            exitMs={preset.exitMs}
          >
            {node}
          </TabKeepAliveLayer>
        );
      })}
    </View>
  );
};

function TabKeepAliveLayer({
  active,
  animateOnMount,
  enterMs,
  exitMs,
  children,
}: {
  active: boolean;
  animateOnMount: boolean;
  enterMs: number;
  exitMs: number;
  children: React.ReactNode;
}) {
  const prevActive = useRef(animateOnMount ? false : active);
  const opacity = useSharedValue(animateOnMount ? 0 : active ? 1 : 0);
  const gen = useRef(0);

  useEffect(() => {
    const wasActive = prevActive.current;
    prevActive.current = active;
    if (active === wasActive) return;

    const token = ++gen.current;
    cancelAnimation(opacity);

    if (active) {
      opacity.value = 0;
      opacity.value = withTiming(
        1,
        {
          duration: enterMs,
          easing: prodayMotion.easing.out,
        },
        (finished) => {
          if (token !== gen.current) return;
          if (!finished) {
            cancelAnimation(opacity);
            opacity.value = 1;
          }
        },
      );

      const safety = setTimeout(() => {
        if (token !== gen.current) return;
        cancelAnimation(opacity);
        opacity.value = 1;
      }, enterMs + PANE_ENTER_SAFETY_MS);
      return () => clearTimeout(safety);
    }

    opacity.value = withTiming(0, {
      duration: exitMs,
      easing: prodayMotion.easing.in,
    });
  }, [active, enterMs, exitMs, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    zIndex: active ? 2 : 1,
  }));

  return (
    <Animated.View
      style={[styles.layer, style]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}
      collapsable={false}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
