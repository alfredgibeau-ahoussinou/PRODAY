import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MAIN_TAB_ITEMS, type MainTabId } from '../../navigation/mainTabConfig';
import { RouteSwitch } from '../../motion/primitives/RouteSwitch';
import { useReducedMotion } from '../../motion';

interface AnimatedTabContentProps {
  activeTab: MainTabId;
  tabOrder?: MainTabId[];
  children: React.ReactNode;
}

/**
 * Micro-transition entre onglets — RouteSwitch (slide réel, pas layout entering).
 */
export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  tabOrder,
  children,
}) => {
  const reduced = useReducedMotion();
  const order = tabOrder ?? MAIN_TAB_ITEMS.map((t) => t.id);

  if (reduced) {
    return (
      <View key={activeTab} style={styles.fill}>
        {children}
      </View>
    );
  }

  return (
    <RouteSwitch routeKey={activeTab} routeOrder={order} context="tab">
      {children}
    </RouteSwitch>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
