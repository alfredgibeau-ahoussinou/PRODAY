import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { CoachChapterScroll } from '../../../components/coach/coachPortalUi';
import { COACH_PITCH_ZONES } from '../navigation/coachNavConfig';
import { useCoachShellNav } from './CoachShellNavContext';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import { spacing, radius } from '../../../theme/designTokens';

/** Cockpit terrain coach — 6 commandes. */
export function CoachPitchPane() {
  const shellNav = useCoachShellNav();
  const styles = useMemo(() => createStyles(), []);
  const [active, setActive] = useState(COACH_PITCH_ZONES[0]!.id);
  const current = COACH_PITCH_ZONES.find((z) => z.id === active) ?? COACH_PITCH_ZONES[0]!;

  return (
    <CoachChapterScroll>
      <View style={styles.stack}>
        <ProDayText variant="caption" style={styles.kicker}>
          Cockpit coach
        </ProDayText>
        <ProDayText variant="section" style={styles.title}>
          Un terrain. Six commandes.
        </ProDayText>
        <ProDayText variant="caption" muted>
          Touche une zone pour ouvrir le dossier correspondant.
        </ProDayText>

        <View style={styles.chips}>
          {COACH_PITCH_ZONES.map((z) => {
            const on = z.id === active;
            return (
              <PressableSpring
                key={z.id}
                onPress={() => setActive(z.id)}
                scaleTo={0.96}
                style={[styles.chip, on && styles.chipOn]}
              >
                <ProDayText variant="caption" style={on ? styles.chipTextOn : styles.chipText}>
                  {z.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        <View style={styles.pitch}>
          <LinearGradient
            colors={[COACH_SITE.pitchDeep, COACH_SITE.pitch, COACH_SITE.pitchLight]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.pitchBorder} />
          <View style={styles.midLine} />
          <View style={styles.centerCircle} />
          {COACH_PITCH_ZONES.map((z) => {
            const on = z.id === active;
            return (
              <PressableSpring
                key={z.id}
                onPress={() => setActive(z.id)}
                scaleTo={0.92}
                style={[
                  styles.dot,
                  {
                    left: `${z.x * 100}%`,
                    top: `${z.y * 100}%`,
                  },
                  on && styles.dotOn,
                ]}
              >
                <View />
              </PressableSpring>
            );
          })}
        </View>

        <View style={styles.card}>
          <ProDayText variant="section">{current.title}</ProDayText>
          <ProDayText variant="caption" muted>
            Zone active · ouvrir le dossier
          </ProDayText>
          <PressableSpring
            onPress={() => shellNav?.requestNav(current.nav)}
            scaleTo={0.97}
            haptic
            style={styles.cta}
          >
            <ProDayText variant="caption" style={styles.ctaText}>
              Ouvrir {current.label}
            </ProDayText>
          </PressableSpring>
        </View>
      </View>
    </CoachChapterScroll>
  );
}

function createStyles() {
  return StyleSheet.create({
    stack: { gap: spacing.md, paddingBottom: spacing.xl },
    kicker: {
      color: COACH_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontWeight: '800',
      fontSize: 10,
    },
    title: { color: COACH_SITE.foreground, fontWeight: '800' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: COACH_SITE.border,
      backgroundColor: COACH_SITE.surface,
    },
    chipOn: { borderColor: COACH_SITE.accent, backgroundColor: COACH_SITE.soft },
    chipText: { color: COACH_SITE.muted, fontWeight: '700' },
    chipTextOn: { color: COACH_SITE.accent, fontWeight: '800' },
    pitch: {
      height: 220,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    pitchBorder: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.28)',
      margin: 10,
      borderRadius: 4,
    },
    midLine: {
      position: 'absolute',
      left: 10,
      right: 10,
      top: '50%',
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    centerCircle: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.35)',
      left: '50%',
      top: '50%',
      marginLeft: -28,
      marginTop: -28,
    },
    dot: {
      position: 'absolute',
      width: 16,
      height: 16,
      marginLeft: -8,
      marginTop: -8,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderWidth: 2,
      borderColor: '#fff',
    },
    dotOn: {
      backgroundColor: COACH_SITE.accent,
      width: 20,
      height: 20,
      marginLeft: -10,
      marginTop: -10,
      borderRadius: 10,
    },
    card: {
      gap: 6,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: COACH_SITE.border,
      backgroundColor: COACH_SITE.surface,
    },
    cta: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: COACH_SITE.accent,
    },
    ctaText: { color: '#fff', fontWeight: '800' },
  });
}
