import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { CLUB_PITCH_ZONES, type ClubHubSectionId } from '../../content/clubPoleExperience';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Props = {
  onOpenSection: (section: ClubHubSectionId) => void;
  onOpenCarpool?: () => void;
};

/** Cockpit « Un terrain. Six commandes. » — aligné site `/pro-club`. */
export function ClubPitchMapPanel({ onOpenSection, onOpenCarpool }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [active, setActive] = useState(CLUB_PITCH_ZONES[0]!.id);
  const current = CLUB_PITCH_ZONES.find((z) => z.id === active) ?? CLUB_PITCH_ZONES[0]!;

  const openZone = () => {
    if (current.id === 'covoit' && onOpenCarpool) {
      onOpenCarpool();
      return;
    }
    onOpenSection(current.section);
  };

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" accent>
        Cockpit club
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        Un terrain. Six commandes.
      </ProDayText>
      <ProDayText variant="caption" muted>
        Explorez les zones : chaque point ouvre une capacité du club.
      </ProDayText>

      <View style={styles.chips}>
        {CLUB_PITCH_ZONES.map((z) => {
          const on = z.id === active;
          return (
            <PressableSpring
              key={z.id}
              onPress={() => setActive(z.id)}
              scaleTo={0.96}
              style={[
                styles.chip,
                {
                  borderColor: on ? colors.accent : colors.border,
                  backgroundColor: on ? colors.accentSoft : colors.surfaceMuted,
                },
              ]}
            >
              <ProDayText variant="caption" accent={on}>
                {z.label} · {z.title.split(/[&·]/)[0]!.trim()}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>

      <View style={styles.pitch}>
        <LinearGradient
          colors={['#0a3d1a', '#14532d', '#166534']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.pitchBorder} />
        <View style={styles.midLine} />
        <View style={styles.centerCircle} />
        {CLUB_PITCH_ZONES.map((z) => {
          const on = z.id === active;
          return (
            <Pressable
              key={z.id}
              onPress={() => setActive(z.id)}
              style={[
                styles.dot,
                {
                  left: z.x,
                  top: z.y,
                  backgroundColor: on ? colors.accent : 'rgba(255,255,255,0.85)',
                  borderColor: on ? '#fff' : 'rgba(255,255,255,0.35)',
                  transform: [{ translateX: -14 }, { translateY: -14 }, { scale: on ? 1.15 : 1 }],
                },
              ]}
              accessibilityLabel={z.title}
            >
              <ProDayText variant="caption" style={styles.dotLabel}>
                {z.label}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent>
          {current.label}
        </ProDayText>
        <ProDayText variant="section">{current.title}</ProDayText>
        <ProDayText variant="caption" muted>
          {current.body}
        </ProDayText>
        <PressableSpring onPress={openZone} scaleTo={0.97} haptic style={styles.cta}>
          <ProDayText variant="caption" accent style={styles.ctaLabel}>
            Ouvrir cette commande
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>
    </View>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontWeight: '800', letterSpacing: -0.3 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    pitch: {
      height: 220,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.15)',
      position: 'relative',
    },
    pitchBorder: {
      position: 'absolute',
      top: '8%',
      left: '6%',
      right: '6%',
      bottom: '8%',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    midLine: {
      position: 'absolute',
      top: '8%',
      bottom: '8%',
      left: '50%',
      width: 1.5,
      marginLeft: -0.75,
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
    centerCircle: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.28)',
      left: '50%',
      top: '50%',
      marginLeft: -28,
      marginTop: -28,
    },
    dot: {
      position: 'absolute',
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotLabel: { color: '#0A1F12', fontWeight: '800', fontSize: 9 },
    card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
    cta: { marginTop: spacing.xs },
    ctaLabel: { fontWeight: '800' },
  });
}
