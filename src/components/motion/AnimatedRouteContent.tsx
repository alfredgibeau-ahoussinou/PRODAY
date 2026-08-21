import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteSwitch } from '../../motion/primitives/RouteSwitch';
import { useReducedMotion } from '../../motion';

interface AnimatedRouteContentProps {
  routeKey: string;
  routeOrder: string[];
  children: React.ReactNode;
  /** Défaut `nav` (shells / segments). */
  context?: 'tab' | 'nav' | 'live';
  /** false = hauteur contenu (ScrollView / segments). */
  fill?: boolean;
}

/**
 * Transition directionnelle entre routes — RouteSwitch fiable.
 */
export const AnimatedRouteContent: React.FC<AnimatedRouteContentProps> = ({
  routeKey,
  routeOrder,
  children,
  context = 'nav',
  fill = true,
}) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <View key={routeKey} style={fill ? styles.fill : styles.auto}>
        {children}
      </View>
    );
  }

  return (
    <RouteSwitch
      routeKey={routeKey}
      routeOrder={routeOrder}
      context={context}
      fill={fill}
    >
      {children}
    </RouteSwitch>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  auto: { alignSelf: 'stretch' },
});
