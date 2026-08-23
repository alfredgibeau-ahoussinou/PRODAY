import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AUTH_XP } from './tokens';

type AuthProgressProps = {
  stepIndex: number;
  stepTotal: number;
};

/** Indicateur minimal ●─●─○ */
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
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <View style={[styles.line, i <= active && styles.lineOn]} />
          ) : null}
          <View
            style={[
              styles.dot,
              i < active && styles.dotDone,
              i === active && styles.dotActive,
            ]}
          />
        </React.Fragment>
      ))}
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      paddingVertical: 8,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: AUTH_XP.border,
    },
    dotDone: {
      backgroundColor: AUTH_XP.goldDeep,
    },
    dotActive: {
      backgroundColor: AUTH_XP.gold,
      width: 8,
      height: 8,
    },
    line: {
      width: 18,
      height: StyleSheet.hairlineWidth,
      backgroundColor: AUTH_XP.border,
      marginHorizontal: 4,
    },
    lineOn: {
      backgroundColor: AUTH_XP.goldDeep,
    },
  });
}
