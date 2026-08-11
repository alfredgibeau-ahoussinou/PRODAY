import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../components/ui/ProDayText';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import {
  startJoueurAmbient,
  stopJoueurAmbient,
  playJoueurSfxFireAndForget,
  isJoueurSfxMuted,
} from './joueurSfx';
import { persistJoueurSfxMuted } from '../../utils/joueurSfxPrefs';

/** Floating +XP / +★ popup. */
export function JoueurScorePop({
  text,
  color,
  visible,
  light,
}: {
  text: string;
  color: string;
  visible: boolean;
  light?: boolean;
}) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14)}
      exiting={FadeOutUp.duration(280)}
      style={[
        styles.pop,
        {
          borderColor: color,
          backgroundColor: light ? 'rgba(255,255,255,0.92)' : 'rgba(7,11,20,0.88)',
        },
      ]}
      pointerEvents="none"
    >
      <ProDayText variant="title" style={{ color, fontSize: 22 }} emoji={false}>
        {text}
      </ProDayText>
    </Animated.View>
  );
}

/** Orbes — densités distinctes par âge. */
export function JoueurParticleField({
  accent,
  density = 'hud',
  light,
}: {
  accent: string;
  density?: JoueurPageIdentity['density'];
  light?: boolean;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, {
        duration: density === 'playful' ? 2800 : density === 'hud' ? 6400 : 5200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [drift, density]);

  const a = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * drift.value }, { translateX: 4 * drift.value }],
    opacity: 0.25 + drift.value * 0.3,
  }));
  const b = useAnimatedStyle(() => ({
    transform: [{ translateY: 10 * drift.value }, { translateX: -5 * drift.value }],
    opacity: 0.2 + (1 - drift.value) * 0.3,
  }));

  const count = density === 'playful' ? 10 : density === 'hud' ? 3 : 4;
  const sparkColor = light ? accent : accent;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.spark,
            {
              left: `${10 + ((i * 17) % 80)}%`,
              top: `${12 + ((i * 23) % 70)}%`,
              backgroundColor: i % 2 === 0 ? sparkColor : light ? '#FDE68A' : JOUEUR_SITE.gold,
              width: density === 'playful' ? 10 + (i % 3) * 4 : 5 + (i % 3) * 3,
              height: density === 'playful' ? 10 + (i % 3) * 4 : 5 + (i % 3) * 3,
              opacity: density === 'playful' ? 0.45 : 0.28,
            },
            i % 2 === 0 ? a : b,
          ]}
        />
      ))}
    </View>
  );
}

type ShellProps = {
  identity: JoueurPageIdentity;
  liveLabel?: string;
  children: React.ReactNode;
  bootSound?: boolean;
};

/**
 * Shell jeu — 3 ambiances vraiment distinctes :
 * playful (clair, ludique) / hud (calme sombre) / pro (cockpit).
 */
export function JoueurArcadeShell({
  identity,
  liveLabel,
  children,
  bootSound = true,
}: ShellProps) {
  const pulse = useSharedValue(0.55);
  const [muted, setMuted] = useState(isJoueurSfxMuted());
  const isArcade = identity.density === 'playful';
  const isTeen = identity.density === 'hud';
  const isPro = identity.density === 'pro';
  const resolvedLive =
    liveLabel ??
    (isArcade ? 'AVENTURE' : isTeen ? 'CARRIÈRE' : 'LIVE');

  useEffect(() => {
    if (isTeen) {
      // Teen : pulse très lent, ambiance calme (pas d’arcade)
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: isArcade ? 900 : 1600,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.45, {
            duration: isArcade ? 900 : 1600,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      );
    }
    if (bootSound && !isJoueurSfxMuted()) {
      playJoueurSfxFireAndForget('enter');
      // Ambient seulement adulte / ado (pas youth — trop bruyant pour petit jeu)
      if (!isArcade) void startJoueurAmbient();
    }
    return () => {
      if (bootSound) stopJoueurAmbient();
    };
  }, [bootSound, pulse, isArcade, isTeen]);

  const liveDot = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    void persistJoueurSfxMuted(next);
    if (!next) {
      playJoueurSfxFireAndForget('tap');
      if (!isArcade) void startJoueurAmbient();
    }
  };

  const pillBg = isArcade ? 'rgba(255,255,255,0.78)' : 'rgba(7,11,20,0.72)';
  const muteColor = isArcade ? identity.inkMuted : JOUEUR_SITE.muted;

  return (
    <View style={[styles.shell, { backgroundColor: identity.shellBg }]}>
      <LinearGradient
        colors={identity.wash}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <JoueurMotifField motif={identity.motif} accent={identity.accent} light={isArcade} />
      <View
        style={[
          styles.glowBlob,
          {
            backgroundColor: identity.glow,
            opacity: isArcade ? 0.55 : isTeen ? 0.22 : 0.35,
            height: isArcade ? 200 : 160,
          },
        ]}
        pointerEvents="none"
      />
      <JoueurParticleField
        accent={identity.accent}
        density={identity.density}
        light={isArcade}
      />

      <View style={styles.topBar}>
        <View
          style={[
            styles.livePill,
            {
              borderColor: `${identity.accent}66`,
              borderRadius: isArcade ? 18 : isPro ? 8 : 12,
              backgroundColor: pillBg,
              borderWidth: isArcade ? 2 : StyleSheet.hairlineWidth,
              paddingVertical: isArcade ? 7 : 5,
              paddingHorizontal: isArcade ? 12 : 10,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.liveDot,
              {
                backgroundColor: isArcade
                  ? identity.accent
                  : isTeen
                    ? identity.accentBright
                    : JOUEUR_SITE.live,
                width: isArcade ? 8 : 6,
                height: isArcade ? 8 : 6,
                borderRadius: isArcade ? 4 : 3,
              },
              liveDot,
            ]}
          />
          <ProDayText
            variant="caption"
            style={[
              styles.liveText,
              {
                color: isArcade ? identity.ink : identity.accentBright,
                fontSize: isArcade ? 11 : 9,
                letterSpacing: isArcade ? 1.2 : 1.8,
              },
            ]}
          >
            {resolvedLive}
          </ProDayText>
          <ProDayText
            variant="caption"
            style={[
              styles.modeChip,
              {
                color: identity.accent,
                fontSize: isArcade ? 9 : 8,
              },
            ]}
          >
            {identity.worldTag}
          </ProDayText>
        </View>
        <Pressable
          onPress={toggleMute}
          hitSlop={10}
          style={[
            styles.muteBtn,
            {
              borderColor: identity.border,
              backgroundColor: pillBg,
              borderRadius: isArcade ? 16 : 999,
            },
          ]}
        >
          <ProDayText
            variant="caption"
            style={{ color: muteColor, fontWeight: '800', fontSize: isArcade ? 11 : 10 }}
          >
            {muted ? (isArcade ? 'MUTE' : 'SON COUPÉ') : isArcade ? 'SON' : 'SON ACTIVÉ'}
          </ProDayText>
        </Pressable>
      </View>

      <View style={styles.shellBody}>{children}</View>
    </View>
  );
}

function JoueurMotifField({
  motif,
  accent,
  light,
}: {
  motif: JoueurPageIdentity['motif'];
  accent: string;
  light?: boolean;
}) {
  if (motif === 'none') return null;
  const opacityBase = light ? 0.16 : 0.08;
  if (motif === 'dots') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: light ? 36 : 28 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 17) % 96}%`,
              top: `${8 + ((i * 23) % 88)}%`,
              width: light ? 6 + (i % 4) : 3 + (i % 3),
              height: light ? 6 + (i % 4) : 3 + (i % 3),
              borderRadius: 99,
              backgroundColor: accent,
              opacity: opacityBase + (i % 4) * 0.03,
            }}
          />
        ))}
      </View>
    );
  }
  if (motif === 'grid') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${12 + i * 10}%`,
              height: StyleSheet.hairlineWidth,
              backgroundColor: accent,
              opacity: 0.05,
            }}
          />
        ))}
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: -40,
            bottom: -40,
            left: `${i * 14}%`,
            width: 18,
            backgroundColor: accent,
            opacity: 0.04,
            transform: [{ rotate: '18deg' }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: 0 },
  glowBlob: {
    position: 'absolute',
    top: '6%',
    left: '14%',
    right: '14%',
    height: 160,
    borderRadius: 200,
  },
  shellBody: { flex: 1, minHeight: 0 },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
  },
  muteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  modeChip: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  spark: {
    position: 'absolute',
    borderRadius: 99,
  },
  pop: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    zIndex: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 18,
  },
});
