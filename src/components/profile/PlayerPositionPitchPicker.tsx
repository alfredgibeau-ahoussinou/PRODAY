import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import {
  PLAYER_POSITIONS,
  type PlayerPosition,
} from '../../constants/playerProfile';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const POSITION_SHORT: Record<PlayerPosition, string> = {
  Attaquant: 'ATT',
  Milieu: 'MIL',
  Défenseur: 'DEF',
  Gardien: 'GB',
};

interface PlayerPositionPitchPickerProps {
  value: string;
  onChange: (position: PlayerPosition) => void;
  label?: string;
  hint?: string;
  saving?: boolean;
  compact?: boolean;
}

export const PlayerPositionPitchPicker: React.FC<PlayerPositionPitchPickerProps> = ({
  value,
  onChange,
  label = 'Votre poste',
  hint,
  saving,
  compact,
}) => {
  const { colors: c } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const accent = isPlayer ? joueurTheme.accent : c.accent;
  const accentInverse = isPlayer ? '#FFFFFF' : c.brandInverse;
  const styles = useMemo(() => createStyles(c, accent, accentInverse, compact), [c, accent, accentInverse, compact]);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="caption" muted style={styles.label}>
          {label}
        </ProDayText>
        {saving ? <ActivityIndicator size="small" color={accent} /> : null}
      </View>

      <View style={styles.pitch}>
        <View style={styles.centerLine} />
        <View style={styles.centerCircle} />
        <View style={styles.penaltyBox} />
        <View style={styles.goalLine} />

        {PLAYER_POSITIONS.map((position) => {
          const selected = value === position;
          return (
            <View key={position} style={styles.lineRow}>
              <PressableSpring
                onPress={() => onChange(position)}
                disabled={saving}
                scaleTo={0.97}
                haptic
              >
                <View style={[styles.slot, selected && styles.slotSelected]}>
                  {selected ? (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>Vous</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.slotShort, selected && styles.slotShortSelected]}>
                    {POSITION_SHORT[position]}
                  </Text>
                  <Text style={[styles.slotLabel, selected && styles.slotLabelSelected]} numberOfLines={1}>
                    {position}
                  </Text>
                  {selected ? (
                    <Icon name="checkmark-circle" size={14} color={accentInverse} variant="filled" />
                  ) : null}
                </View>
              </PressableSpring>
            </View>
          );
        })}
      </View>

      {value ? (
        <ProDayText variant="body" accent style={styles.selectedCopy}>
          Poste actuel : {value}
        </ProDayText>
      ) : (
        <ProDayText variant="caption" muted style={styles.selectedCopy}>
          {hint ?? 'Appuyez sur votre zone pour définir votre poste.'}
        </ProDayText>
      )}
    </View>
  );
};

function createStyles(c: AppColors, accent: string, accentInverse: string, compact?: boolean) {
  const pitchHeight = compact ? 220 : 260;

  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    pitch: {
      height: pitchHeight,
      backgroundColor: '#1B6B32',
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.32)',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    centerLine: {
      position: 'absolute',
      top: '50%',
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
    centerCircle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 52,
      height: 52,
      marginLeft: -26,
      marginTop: -26,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    penaltyBox: {
      position: 'absolute',
      bottom: spacing.sm,
      left: '22%',
      right: '22%',
      height: '22%',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      borderBottomWidth: 0,
    },
    goalLine: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.md,
      right: spacing.md,
      height: 2,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    lineRow: {
      alignItems: 'center',
      zIndex: 1,
    },
    slot: {
      minWidth: 108,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: 'rgba(8, 12, 10, 0.72)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      gap: 2,
    },
    slotSelected: {
      backgroundColor: accent,
      borderColor: accent,
      borderWidth: 2,
      shadowColor: accent,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    youBadge: {
      position: 'absolute',
      top: -9,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.pill,
      backgroundColor: accent,
    },
    youBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: accentInverse,
      letterSpacing: 0.4,
    },
    slotShort: {
      fontSize: 11,
      fontWeight: '900',
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: 1,
    },
    slotShortSelected: {
      color: accent,
    },
    slotLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.88)',
    },
    slotLabelSelected: {
      color: accentInverse,
      fontWeight: '900',
    },
    selectedCopy: {
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
