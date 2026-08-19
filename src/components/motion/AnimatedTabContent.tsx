import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { motion } from '../../theme/motion';

interface AnimatedTabContentProps {
  activeTab: MainTabId;
  tabOrder?: MainTabId[];
  children: React.ReactNode;
}

/**
 * Transition directionnelle entre onglets (slide + fondu).
 */
export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  tabOrder,
  children,
}) => {
  const order = tabOrder ?? MAIN_TAB_ITEMS.map((t) => t.id);
  const prevIndex = useRef(order.indexOf(activeTab));
  const currentIndex = order.indexOf(activeTab);
  const direction = currentIndex >= prevIndex.current ? 1 : -1;

  useEffect(() => {
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  const entering =
    direction > 0
      ? SlideInRight.springify()
          .damping(24)
          .stiffness(200)
          .mass(0.75)
          .duration(motion.duration.normal)
      : SlideInLeft.springify()
          .damping(24)
          .stiffness(200)
          .mass(0.75)
          .duration(motion.duration.normal);

  const exiting =
    direction > 0
      ? SlideOutLeft.duration(motion.duration.fast).easing(motion.easing.out)
      : SlideOutRight.duration(motion.duration.fast).easing(motion.easing.out);

  return (
    <Animated.View key={activeTab} style={styles.fill} entering={entering} exiting={exiting}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
