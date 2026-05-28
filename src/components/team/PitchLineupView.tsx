import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EventLineupSlot } from '../../models/TeamEvent';
import { assignStartersToPitch } from '../../utils/formationPitch';
import { colors, radius, spacing } from '../../theme/designTokens';

interface PitchLineupViewProps {
  formation: string;
  starters: EventLineupSlot[];
}

export const PitchLineupView: React.FC<PitchLineupViewProps> = ({
  formation,
  starters,
}) => {
  const placements = assignStartersToPitch(starters, formation);
  const lineIndices = [...new Set(placements.map((p) => p.lineIndex))].sort((a, b) => b - a);

  return (
    <View style={styles.wrap}>
      <View style={styles.pitch}>
        <View style={styles.centerLine} />
        <View style={styles.centerCircle} />
        {lineIndices.map((lineIndex) => {
          const row = placements.filter((p) => p.lineIndex === lineIndex);
          return (
            <View key={lineIndex} style={styles.lineRow}>
              {row.map((p) => (
                <View key={p.slot.uid} style={styles.playerChip}>
                  <Text style={styles.playerNum} numberOfLines={1}>
                    {p.slot.display_name.split(' ')[0]}
                  </Text>
                  {p.slot.position_label ? (
                    <Text style={styles.playerPos} numberOfLines={1}>
                      {p.slot.position_label}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          );
        })}
        {starters.length === 0 ? (
          <Text style={styles.emptyPitch}>Ajoutez des titulaires pour voir le terrain</Text>
        ) : null}
      </View>
      <Text style={styles.caption}>Vue tactique · {formation}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.md },
  pitch: {
    aspectRatio: 0.68,
    backgroundColor: '#1B5E20',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: spacing.sm,
    right: spacing.sm,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 56,
    height: 56,
    marginLeft: -28,
    marginTop: -28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 1,
  },
  playerChip: {
    minWidth: 52,
    maxWidth: 72,
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerNum: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  playerPos: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    textAlign: 'center',
  },
  emptyPitch: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: '40%',
  },
  caption: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
