import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { HEALTH_CHAPTERS, type HealthChapterId } from '../../content/healthChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface HealthChapterRailProps {
  active: HealthChapterId;
  onSelect: (id: HealthChapterId) => void;
}

/** Grille de pôles santé — icônes, libellés courts, sélection claire. */
export const HealthChapterRail: React.FC<HealthChapterRailProps> = ({ active, onSelect }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
                  on && styles.tileOn,
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
                    {
                      backgroundColor: on ? 'rgba(255,255,255,0.18)' : colors.accentSoft,
                    },
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
    tileOn: Platform.select({
      ios: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
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
    tileLabelOn: {
      color: '#FFFFFF',
    },
    tileTag: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
  });
}
