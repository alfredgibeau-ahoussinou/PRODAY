import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import {
  JoueurIdentityProvider,
  JoueurHudCorners,
} from '../player/joueurPortalUi';
import { ProDayText } from '../ui/ProDayText';
import { AmbientGlow } from '../ui/AmbientGlow';
import { spacing } from '../../theme/designTokens';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

type Variant = 'tab' | 'page' | 'minimal';

type Props = {
  /** Override identity — sinon session joueur. */
  identity?: JoueurPageIdentity;
  variant?: Variant;
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Masquer le hero compact (variant page). */
  hideHero?: boolean;
};

/**
 * Chrome écran joueur unifié — dark premium #0A0A0F, accent mint.
 */
export function JoueurScreenChrome({
  identity: identityProp,
  variant = 'tab',
  kicker,
  title,
  subtitle,
  children,
  style,
  hideHero = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const theme = useJoueurTheme();
  const identity = identityProp ?? theme.identity;
  const accent = theme.accent;

  if (!identity) {
    return (
      <View
        style={[
          styles.fallback,
          {
            backgroundColor: PLAYER_DARK.bg,
            // DESIGN.md §5.1 — intégration stricte des safe areas.
            paddingTop: Math.max(insets.top, 12),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const showHero = variant === 'page' && !hideHero && (title || kicker);

  return (
    <JoueurIdentityProvider identity={identity}>
      <View
        style={[
          styles.root,
          {
            backgroundColor: PLAYER_DARK.bg,
            // DESIGN.md §5.1 — paddingTop: Math.max(insets.top, 12).
            paddingTop: Math.max(insets.top, 12),
          },
          style,
        ]}
      >
        <LinearGradient
          colors={[PLAYER_DARK.bgElevated, PLAYER_DARK.bg, PLAYER_DARK.bg]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* DESIGN.md §4.3 — Ambient Glow en haut d'écran (halo accent pôle). */}
        <AmbientGlow color={accent} intensity={0.16} height={240} />
        <View
          style={[styles.accentBar, { backgroundColor: accent }]}
          pointerEvents="none"
        />

        {showHero ? (
          <View style={[styles.hero, { paddingTop: spacing.xs }]}>
            <View style={[styles.heroPlate, { borderColor: PLAYER_DARK.border }]}>
              <JoueurHudCorners color={accent} size={8} thickness={1.5} />
              {kicker ? (
                <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
                  {kicker.toUpperCase()}
                </ProDayText>
              ) : null}
              {title ? (
                <ProDayText variant="title" style={[styles.title, { color: PLAYER_DARK.text }]}>
                  {title}
                </ProDayText>
              ) : null}
              {subtitle ? (
                <ProDayText variant="caption" style={[styles.subtitle, { color: PLAYER_DARK.textMuted }]}>
                  {subtitle}
                </ProDayText>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
      </View>
    </JoueurIdentityProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  fallback: { flex: 1, minHeight: 0 },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 2,
  },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    zIndex: 1,
  },
  heroPlate: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
    backgroundColor: PLAYER_DARK.surface,
    overflow: 'hidden',
  },
  kicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: {
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  subtitle: {
    lineHeight: 18,
  },
  body: { flex: 1, minHeight: 0, zIndex: 1 },
});
