import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaneTransition } from './PaneTransition';
import type { NavDirection } from '../types';

type Props = {
  routeKey: string;
  routeOrder: readonly string[];
  children: React.ReactNode;
  /** `tab` = micro ; `nav` = panes shell. */
  context?: 'tab' | 'nav' | 'live';
  /** Voir PaneTransition.fill — false dans ScrollView. */
  fill?: boolean;
};

/**
 * Switch de route directionnel fiable (shared values, pas layout entering).
 * Garde l’ancien contenu pendant l’exit — visible à l’œil.
 */
export function RouteSwitch({
  routeKey,
  routeOrder,
  children,
  context = 'tab',
  fill = true,
}: Props) {
  const prevIndex = useRef(routeOrder.indexOf(routeKey));
  const currentIndex = routeOrder.indexOf(routeKey);
  const direction: NavDirection = currentIndex >= prevIndex.current ? 1 : -1;

  useEffect(() => {
    prevIndex.current = currentIndex >= 0 ? currentIndex : prevIndex.current;
  }, [currentIndex]);

  return (
    <View style={fill ? styles.fill : styles.auto}>
      <PaneTransition
        sectionKey={routeKey}
        direction={direction}
        context={context}
        fill={fill}
      >
        {children}
      </PaneTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  auto: { alignSelf: 'stretch' },
});
