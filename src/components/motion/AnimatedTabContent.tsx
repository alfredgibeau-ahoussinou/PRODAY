import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { getMotionPreset, useReducedMotion } from '../../motion';

interface AnimatedTabContentProps {
  activeTab: MainTabId;
  tabOrder?: MainTabId[];
  children: React.ReactNode;
}

/**
 * Micro-transition entre onglets (preset `tab`).
 */
export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  tabOrder,
  children,
}) => {
  const reduced = useReducedMotion();
  const preset = getMotionPreset('tab');
  const order = tabOrder ?? MAIN_TAB_ITEMS.map((t) => t.id);
  const prevIndex = useRef(order.indexOf(activeTab));
  const currentIndex = order.indexOf(activeTab);
  const direction = currentIndex >= prevIndex.current ? 1 : -1;

  useEffect(() => {
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  if (reduced) {
    return (
      <View key={activeTab} style={styles.fill}>
        {children}
      </View>
    );
  }

  const entering =
    direction > 0
      ? SlideInRight.springify()
          .damping(preset.spring.damping)
          .stiffness(preset.spring.stiffness)
          .mass(preset.spring.mass)
          .duration(preset.enterMs)
      : SlideInLeft.springify()
          .damping(preset.spring.damping)
          .stiffness(preset.spring.stiffness)
          .mass(preset.spring.mass)
          .duration(preset.enterMs);

  const exiting =
    direction > 0
      ? SlideOutLeft.duration(preset.exitMs)
      : SlideOutRight.duration(preset.exitMs);

  return (
    <Animated.View key={activeTab} style={styles.fill} entering={entering} exiting={exiting}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
