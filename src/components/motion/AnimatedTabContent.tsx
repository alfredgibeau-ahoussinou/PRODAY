import React, { useRef } from 'react';
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
 * Micro-transition entre onglets — RouteSwitch (slide réel).
 * Garde l’onglet précédent monté (max 2) pour éviter le remount lourd
 * (chrome joueur, listes) au retour arrière immédiat.
 */
export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  activeTab,
  tabOrder,
  children,
}) => {
  const reduced = useReducedMotion();
  const order = tabOrder ?? MAIN_TAB_ITEMS.map((t) => t.id);
  const cacheRef = useRef(new Map<MainTabId, React.ReactNode>());

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

  const paneTree = (
    <View style={styles.fill}>
      {[...cacheRef.current.entries()].map(([id, node]) => {
        const on = id === activeTab;
        return (
          <View
            key={id}
            style={[styles.layer, !on && styles.inactive]}
            pointerEvents={on ? 'auto' : 'none'}
            accessibilityElementsHidden={!on}
            importantForAccessibility={on ? 'yes' : 'no-hide-descendants'}
            collapsable={false}
          >
            {node}
          </View>
        );
      })}
    </View>
  );

  if (reduced) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <RouteSwitch routeKey={activeTab} routeOrder={order} context="tab">
      {paneTree}
    </RouteSwitch>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  inactive: {
    opacity: 0,
  },
});
