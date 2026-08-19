import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import {
  JOUEUR_SITE,
  type JoueurPageIdentity,
} from '../../content/joueurPageIdentity';
import { spacing } from '../../theme/designTokens';
import { joueurGamePress, joueurGameConfirm } from '../../features/joueur/joueurSfx';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';

const Ctx = createContext<JoueurPageIdentity | null>(null);

export function useJoueurPageIdentity(): JoueurPageIdentity | null {
  return useContext(Ctx);
}

export function JoueurIdentityProvider({
  identity,
  children,
}: {
  identity: JoueurPageIdentity;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={identity}>{children}</Ctx.Provider>;
}

type FrameProps = {
  identity: JoueurPageIdentity;
  showHero?: boolean;
  children: React.ReactNode;
};

/** Coins HUD type UI jeu. */
export function JoueurHudCorners({
  color,
  size = 12,
  thickness = 2,
}: {
  color: string;
  size?: number;
  thickness?: number;
}) {
  return (
    <>
      <View style={[stylesCorner.tl, { borderColor: color, width: size, height: size, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[stylesCorner.tr, { borderColor: color, width: size, height: size, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[stylesCorner.bl, { borderColor: color, width: size, height: size, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[stylesCorner.br, { borderColor: color, width: size, height: size, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </>
  );
}

const stylesCorner = StyleSheet.create({
  tl: { position: 'absolute', top: 0, left: 0 },
  tr: { position: 'absolute', top: 0, right: 0 },
  bl: { position: 'absolute', bottom: 0, left: 0 },
  br: { position: 'absolute', bottom: 0, right: 0 },
});

/** Jauge XP / charge — langage jeu. */
export function JoueurXpBar({
  label,
  value,
  max = 100,
  color,
}: {
  label?: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const theme = useJoueurTheme();
  const accent = color ?? theme.accent;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={xpStyles.wrap}>
      {label ? (
        <View style={xpStyles.head}>
          <ProDayText variant="caption" style={xpStyles.label}>
            {label}
          </ProDayText>
          <ProDayText variant="caption" style={[xpStyles.value, { color: accent }]}>
            {Math.round(value)}/{max}
          </ProDayText>
        </View>
      ) : null}
      <View style={xpStyles.track}>
        <LinearGradient
          colors={[accent, theme.accentBright]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[xpStyles.fill, { width: `${pct}%` }]}
        />
        <View style={xpStyles.shine} />
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  wrap: { gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  label: {
    color: JOUEUR_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 9,
    fontWeight: '800',
  },
  value: { fontWeight: '800', fontSize: 10 },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: JOUEUR_SITE.border,
  },
  fill: { height: '100%', borderRadius: 999 },
  shine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
    height: 4,
  },
});

/** Badge niveau / rang. */
export function JoueurLevelBadge({
  level,
  label = 'NIV',
}: {
  level: string | number;
  label?: string;
}) {
  const theme = useJoueurTheme();
  const accent = theme.accent;
  return (
    <View style={[badgeStyles.root, { borderColor: accent }]}>
      <JoueurHudCorners color={accent} size={8} thickness={1.5} />
      <ProDayText variant="caption" style={[badgeStyles.label, { color: accent }]}>
        {label}
      </ProDayText>
      <ProDayText variant="title" style={badgeStyles.value}>
        {level}
      </ProDayText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  root: {
    minWidth: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: JOUEUR_SITE.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  value: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: -0.5,
  },
});

/** Chrome Pôle Joueur — wash âge + HUD genre. */
export function JoueurPageFrame({ identity, showHero = true, children }: FrameProps) {
  const theme = useJoueurTheme();
  const styles = useMemo(() => createFrameStyles(identity), [identity]);
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        <LinearGradient
          colors={identity.wash}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.glow, { backgroundColor: identity.glow }, glowStyle]}
          pointerEvents="none"
        />
        {/* Scanlines */}
        <View style={styles.scan} pointerEvents="none">
          {Array.from({ length: 24 }).map((_, i) => (
            <View key={i} style={styles.scanLine} />
          ))}
        </View>
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} pointerEvents="none" />
        <View style={[styles.rightBar, { backgroundColor: theme.accentBright }]} pointerEvents="none" />

        {showHero ? (
          <View style={styles.hero}>
            <View style={[styles.heroPlate, { borderColor: theme.accent }]}>
              <JoueurHudCorners color={theme.accent} size={10} />
              <ProDayText variant="caption" style={[styles.eyebrow, { color: theme.accent }]}>
                {identity.hudLabel} · {identity.eyebrow}
              </ProDayText>
              <ProDayText variant="title" style={styles.title}>
                {identity.title}
              </ProDayText>
              <ProDayText variant="caption" style={styles.support}>
                {identity.support}
              </ProDayText>
            </View>
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
      </View>
    </Ctx.Provider>
  );
}

export function JoueurSectionCard({
  kicker,
  title,
  body,
  children,
  style,
  quest,
}: {
  kicker?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Style quête / mission. */
  quest?: boolean;
}) {
  const identity = useJoueurPageIdentity();
  const accent = identity?.accent ?? JOUEUR_SITE.ok;
  const radius = identity?.radius ?? 4;
  const density = identity?.density ?? 'pro';
  const styles = useMemo(
    () => createCardStyles(accent, radius, density, quest),
    [accent, radius, density, quest],
  );

  return (
    <View style={[styles.card, style]}>
      {kicker ? (
        <View style={styles.kickerRow}>
          <View style={[styles.kickerDot, { backgroundColor: accent }]} />
          <ProDayText variant="caption" style={styles.kicker}>
            {kicker}
          </ProDayText>
        </View>
      ) : null}
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" style={styles.body}>
          {body}
        </ProDayText>
      ) : null}
      {children}
    </View>
  );
}

export function JoueurKpiRow({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  const identity = useJoueurPageIdentity();
  const accent = identity?.accent ?? '#2F7BFF';
  const radius = identity?.radius ?? 4;
  const styles = useMemo(() => createKpiStyles(accent, radius), [accent, radius]);

  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.cell, index < items.length - 1 && styles.cellBorder]}
        >
          <ProDayText
            variant="title"
            style={[styles.value, item.tone ? { color: item.tone } : null]}
          >
            {item.value}
          </ProDayText>
          <ProDayText variant="caption" style={styles.label} numberOfLines={1}>
            {item.label}
          </ProDayText>
        </View>
      ))}
    </View>
  );
}

export function JoueurActionRow({
  primary,
  onPrimary,
  secondary,
  onSecondary,
}: {
  primary: string;
  onPrimary: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  const identity = useJoueurPageIdentity();
  const accent = identity?.accent ?? '#2F7BFF';
  const accentBright = identity?.accentBright ?? accent;
  const radius = identity?.radius ?? 4;
  const styles = useMemo(
    () => createActionStyles(accent, accentBright, radius),
    [accent, accentBright, radius],
  );

  return (
    <View style={styles.row}>
      <PressableSpring
        onPress={() => {
          joueurGameConfirm();
          onPrimary();
        }}
        scaleTo={0.96}
        haptic
        style={styles.primary}
      >
        <LinearGradient
          colors={[accentBright, accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ProDayText variant="caption" style={styles.primaryText}>
          ▶ {primary.toUpperCase()}
        </ProDayText>
      </PressableSpring>
      {secondary && onSecondary ? (
        <PressableSpring
          onPress={() => {
            joueurGamePress();
            onSecondary();
          }}
          scaleTo={0.96}
          style={styles.secondary}
        >
          <ProDayText variant="caption" style={styles.secondaryText}>
            {secondary.toUpperCase()}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

export function JoueurEmptyState({
  title,
  body,
  cta,
  onPress,
}: {
  title: string;
  body: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <JoueurSectionCard kicker="EMPLACEMENT VIDE" title={title} body={body}>
      {cta && onPress ? <JoueurActionRow primary={cta} onPrimary={onPress} /> : null}
    </JoueurSectionCard>
  );
}

function createFrameStyles(identity: JoueurPageIdentity) {
  const playful = identity.density === 'playful';
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: identity.shellBg },
    glow: {
      position: 'absolute',
      left: '15%',
      right: '15%',
      top: '8%',
      height: playful ? 180 : 130,
      borderRadius: 200,
    },
    scan: {
      ...StyleSheet.absoluteFillObject,
      opacity: playful ? 0 : 0.55,
      justifyContent: 'space-evenly',
    },
    scanLine: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: JOUEUR_SITE.scanline,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: playful ? 5 : 3,
      opacity: 0.95,
      zIndex: 2,
    },
    rightBar: {
      position: 'absolute',
      right: 0,
      top: '20%',
      bottom: '20%',
      width: 2,
      opacity: 0.35,
      zIndex: 2,
    },
    hero: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    heroPlate: {
      borderWidth: playful ? 2 : StyleSheet.hairlineWidth,
      borderRadius: Math.max(identity.radius, 16),
      backgroundColor: playful ? identity.elevated : JOUEUR_SITE.panel,
      padding: spacing.md,
      gap: 6,
      overflow: 'hidden',
    },
    eyebrow: {
      textTransform: 'uppercase',
      letterSpacing: playful ? 1.8 : 2.8,
      fontSize: 9,
      fontWeight: '900',
    },
    title: {
      color: identity.ink,
      fontWeight: '900',
      letterSpacing: playful ? 0.4 : -0.4,
      fontSize: playful ? 28 : 24,
    },
    support: { color: identity.inkMuted, lineHeight: 18 },
    body: { flex: 1, minHeight: 0 },
  });
}

function createCardStyles(
  accent: string,
  radius: number,
  density: JoueurPageIdentity['density'],
  quest?: boolean,
) {
  const soft = Math.max(radius, density === 'playful' ? 20 : 16);
  return StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderColor: quest ? `${accent}66` : JOUEUR_SITE.border,
      borderRadius: soft,
      padding: spacing.md,
      gap: spacing.xs,
      backgroundColor: quest ? 'rgba(12, 22, 38, 0.92)' : 'rgba(10, 16, 28, 0.88)',
      overflow: 'hidden',
      transform: density === 'playful' ? undefined : undefined,
    },
    kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    kickerDot: { width: 8, height: 8, borderRadius: 4 },
    kicker: {
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 2.2,
      fontSize: 9,
      fontWeight: '900',
    },
    title: {
      color: JOUEUR_SITE.foreground,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    body: {
      color: JOUEUR_SITE.muted,
      lineHeight: 18,
    },
  });
}

function createKpiStyles(accent: string, radius: number) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: JOUEUR_SITE.border,
      backgroundColor: 'rgba(12, 18, 30, 0.9)',
      borderRadius: Math.max(radius, 16),
      overflow: 'hidden',
      gap: 0,
    },
    cell: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      gap: 4,
    },
    cellBorder: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: JOUEUR_SITE.border,
    },
    value: {
      color: accent,
      fontWeight: '900',
      fontSize: 22,
      letterSpacing: -0.5,
    },
    label: {
      color: JOUEUR_SITE.muted,
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      fontSize: 8,
      fontWeight: '800',
    },
  });
}

function createActionStyles(accent: string, accentBright: string, radius: number) {
  const pill = Math.max(radius, 18);
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    primary: {
      borderRadius: pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 15,
      minHeight: 50,
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 0,
      borderColor: accentBright,
      flexGrow: 1,
    },
    primaryText: {
      color: '#fff',
      fontWeight: '900',
      letterSpacing: 1.2,
      fontSize: 12,
      zIndex: 1,
      textAlign: 'center',
    },
    secondary: {
      borderRadius: pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 15,
      minHeight: 50,
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: `${accent}88`,
      backgroundColor: 'rgba(8,14,24,0.75)',
      flexGrow: 1,
    },
    secondaryText: {
      color: JOUEUR_SITE.foreground,
      fontWeight: '800',
      letterSpacing: 1,
      fontSize: 11,
      textAlign: 'center',
    },
  });
}
