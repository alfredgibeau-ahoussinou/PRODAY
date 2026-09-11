import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <View style={styles.headLeft}>
          <Icon name="football" size={14} color={accent} />
          <ProDayText variant="caption" style={[styles.label, { color: accent }]}>
            {label}
          </ProDayText>
        </View>
        {saving ? <ActivityIndicator size="small" color={accent} /> : null}
      </View>

      <View style={styles.pitch}>
        <LinearGradient
          colors={['#07160D', '#0C2817', '#06130B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
  const pitchHeight = compact ? 180 : 200;

  return StyleSheet.create({
    wrap: { gap: spacing.xs + 2 },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    headLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    label: {
      fontWeight: '800',
      letterSpacing: 0.8,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    pitch: {
      height: pitchHeight,
      backgroundColor: '#07160D',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.22)',
      paddingVertical: 8,
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
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    centerCircle: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 48,
      height: 48,
      marginLeft: -24,
      marginTop: -24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
    },
    penaltyBox: {
      position: 'absolute',
      bottom: 8,
      left: '22%',
      right: '22%',
      height: '24%',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderBottomWidth: 0,
    },
    goalLine: {
      position: 'absolute',
      bottom: 8,
      left: spacing.md,
      right: spacing.md,
      height: 1.5,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    lineRow: {
      alignItems: 'center',
      zIndex: 1,
    },
    slot: {
      minWidth: 104,
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: 'rgba(5, 12, 9, 0.82)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    slotSelected: {
      backgroundColor: `${accent}2A`,
      borderColor: accent,
      borderWidth: 1.5,
      shadowColor: accent,
      shadowOpacity: 0.35,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    youBadge: {
      position: 'absolute',
      top: -7,
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
      fontSize: 10,
      fontWeight: '900',
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: 0.8,
    },
    slotShortSelected: {
      color: accent,
    },
    slotLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.92)',
    },
    slotLabelSelected: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    selectedCopy: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
  });
}
