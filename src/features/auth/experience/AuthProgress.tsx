import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AUTH_XP } from './tokens';

type AuthProgressProps = {
  stepIndex: number;
  stepTotal: number;
};

/** Indicateur de progression moderne avec barres segmentées */
export const AuthProgress: React.FC<AuthProgressProps> = ({
  stepIndex,
  stepTotal,
}) => {
  const styles = useMemo(() => createStyles(), []);
  const total = Math.max(stepTotal, 1);
  const active = Math.min(Math.max(stepIndex, 0), total - 1);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: active + 1 }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < active;
        const isActive = i === active;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              isDone && styles.segmentDone,
              isActive && styles.segmentActive,
            ]}
          />
        );
      })}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    segment: {
      width: 22,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    segmentDone: {
      backgroundColor: '#C5A059',
    },
    segmentActive: {
      backgroundColor: '#F5D04A',
      width: 32,
      shadowColor: '#F5D04A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
    },
  });
}
