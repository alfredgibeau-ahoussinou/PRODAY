import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { spacing } from '../../theme/designTokens';
import { joueurGameConfirm } from './joueurSfx';

/** Flash level-up plein écran — moments de progression. */
export function JoueurLevelUpOverlay() {
  const progress = useJoueurProgress();
  const joueurTheme = useJoueurTheme();
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  const event = progress?.levelUp ?? null;
  const accent = joueurTheme.accent;
  const accentBright = joueurTheme.accentBright;

  useEffect(() => {
    if (!event) return;
    scale.value = 0.7;
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
    scale.value = withSequence(
      withTiming(1.08, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 180 }),
    );
  }, [event, opacity, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!event || !progress) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={progress.clearLevelUp}>
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['rgba(7,11,20,0.92)', 'rgba(7,11,20,0.98)']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.card, { borderColor: accent }, cardStyle]}>
          <ProDayText variant="caption" style={[styles.kicker, { color: accentBright }]}>
            NIVEAU SUP
          </ProDayText>
          <ProDayText variant="title" style={styles.fromTo}>
            {event.from} → {event.to}
          </ProDayText>
          <ProDayText variant="caption" style={styles.sub}>
            Nouveau rang débloqué. Continue ta saison.
          </ProDayText>
          <PressableSpring
            onPress={() => {
              joueurGameConfirm();
              progress.clearLevelUp();
            }}
            scaleTo={0.96}
            haptic
            style={[styles.cta, { backgroundColor: accent }]}
          >
            <ProDayText variant="section" style={styles.ctaText}>
              CONTINUER
            </ProDayText>
          </PressableSpring>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: spacing.xl,
    backgroundColor: JOUEUR_SITE.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  kicker: {
    fontWeight: '900',
    letterSpacing: 3,
    fontSize: 11,
  },
  fromTo: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 48,
    letterSpacing: -2,
  },
  sub: {
    color: JOUEUR_SITE.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaText: {
    color: '#07101c',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
