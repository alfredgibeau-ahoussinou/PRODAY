import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { HEALTH_CHAPTERS, type HealthChapterId } from '../../content/healthChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

const BOOKING_CHAPTERS = HEALTH_CHAPTERS.filter((ch) => ch.id !== 'conseils');

interface HealthChapterRailProps {
  active: HealthChapterId;
  onSelect: (id: HealthChapterId) => void;
  /** Chips horizontaux compacts — legacy. */
  minimal?: boolean;
  /** Grille pleine largeur — sélection spécialité (Doctolib-like). */
  picker?: boolean;
}

export const HealthChapterRail: React.FC<HealthChapterRailProps> = ({
  active,
  onSelect,
  minimal = false,
  picker = false,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (picker) {
    return (
      <View style={styles.pickerGrid}>
        {BOOKING_CHAPTERS.map((ch) => {
          const on = ch.id === active;
          return (
            <PressableSpring
              key={ch.id}
              style={[
                styles.pickerTile,
                {
                  backgroundColor: on ? colors.accent : colors.surface,
                  borderColor: on ? colors.accent : colors.border,
                },
                !on && shadows.soft,
              ]}
              onPress={() => {
                prodayHaptics.tabSwitch();
                onSelect(ch.id);
              }}
              scaleTo={0.97}
              haptic
            >
              <View
                style={[
                  styles.pickerIconWrap,
                  {
                    backgroundColor: on ? 'rgba(255,255,255,0.16)' : colors.accentSoft,
                  },
                ]}
              >
                <Icon
                  name={ch.icon}
                  size={24}
                  color={on ? colors.brandInverse : colors.accent}
                  variant={on ? 'filled' : 'outline'}
                />
              </View>
              <ProDayText
                variant="section"
                inverse={on}
                style={[styles.pickerLabel, on && styles.pickerLabelOn]}
                numberOfLines={1}
              >
                {ch.shortLabel}
              </ProDayText>
              <ProDayText
                variant="caption"
                style={[
                  styles.pickerTag,
                  { color: on ? 'rgba(255,255,255,0.75)' : colors.textMuted },
                ]}
                numberOfLines={2}
              >
                {ch.tag}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    );
  }

  if (minimal) {
    return (
      <View style={styles.minimalRow}>
        {BOOKING_CHAPTERS.map((ch) => {
          const on = ch.id === active;
          return (
            <PressableSpring
              key={ch.id}
              style={[
                styles.minimalChip,
                {
                  backgroundColor: on ? colors.accent : colors.surface,
                  borderColor: on ? colors.accent : colors.border,
                },
              ]}
              onPress={() => {
                if (!on) {
                  prodayHaptics.tabSwitch();
                  onSelect(ch.id);
                }
              }}
              scaleTo={0.96}
            >
              <Icon
                name={ch.icon}
                size={14}
                color={on ? colors.brandInverse : colors.accent}
                variant={on ? 'filled' : 'outline'}
              />
              <ProDayText
                variant="caption"
                inverse={on}
                style={[styles.minimalLabel, on && styles.minimalLabelOn]}
              >
                {ch.shortLabel}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.panel, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <View style={styles.grid}>
          {HEALTH_CHAPTERS.map((ch) => {
            const on = ch.id === active;
            return (
              <PressableSpring
                key={ch.id}
                style={[
                  styles.tile,
                  {
                    backgroundColor: on ? colors.accent : colors.surface,
                    borderColor: on ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => {
                  if (!on) {
                    prodayHaptics.tabSwitch();
                    onSelect(ch.id);
                  }
                }}
                scaleTo={0.96}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: on ? 'rgba(255,255,255,0.18)' : colors.accentSoft },
                  ]}
                >
                  <Icon
                    name={ch.icon}
                    size={18}
                    color={on ? colors.brandInverse : colors.accent}
                    variant={on ? 'filled' : 'outline'}
                  />
                </View>
                <ProDayText
                  variant="caption"
                  inverse={on}
                  accent={!on}
                  style={[styles.tileLabel, on && styles.tileLabelOn]}
                  numberOfLines={1}
                >
                  {ch.shortLabel}
                </ProDayText>
                <ProDayText
                  variant="caption"
                  style={[
                    styles.tileTag,
                    { color: on ? 'rgba(255,255,255,0.72)' : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {ch.tag}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </View>
    </View>
  );
};

function createStyles(c: { surface: string }) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: c.surface,
    },
    panel: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tile: {
      width: '31%',
      flexGrow: 1,
      minWidth: 96,
      maxWidth: '33%',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 3,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    tileLabel: {
      fontFamily: fontFamily.extrabold,
      fontWeight: '800',
      fontSize: 12,
      textAlign: 'center',
    },
    tileLabelOn: { color: '#FFFFFF' },
    tileTag: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    pickerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    pickerTile: {
      width: '47%',
      minHeight: 132,
      padding: spacing.md,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    pickerIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerLabel: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    pickerLabelOn: { color: '#FFFFFF' },
    pickerTag: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },
    minimalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    minimalChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    minimalLabel: {
      fontFamily: fontFamily.extrabold,
      fontWeight: '800',
      fontSize: 13,
    },
    minimalLabelOn: { color: '#FFFFFF' },
  });
}
