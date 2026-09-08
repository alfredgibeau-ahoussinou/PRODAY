import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AUTH_XP } from './tokens';

type AuthProgressProps = {
  stepIndex: number;
  stepTotal: number;
  /** Accent pôle (sinon or master). */
  accent?: string;
};

/** Progression segmentée — accent pôle, pas de glow kitsch. */
export const AuthProgress: React.FC<AuthProgressProps> = ({
  stepIndex,
  stepTotal,
  accent = AUTH_XP.goldBright,
}) => {
  const styles = useMemo(() => createStyles(accent), [accent]);
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

function createStyles(accent: string) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 6,
    },
    segment: {
      flex: 1,
      maxWidth: 40,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    segmentDone: {
      backgroundColor: accent,
      opacity: 0.55,
    },
    segmentActive: {
      backgroundColor: accent,
      opacity: 1,
    },
  });
}
