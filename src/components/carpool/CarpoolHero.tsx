import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Line,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

/**
 * Direction visuelle « Stade la nuit » : bitume + lignes de craie + une voie
 * qui file vers le point de rendez-vous, sous un halo de projecteur cyan.
 * Une seule composition plein cadre — marque, titre, phrase d'appui, un groupe
 * d'actions. Aucun overlay/badge flottant sur le héros.
 */

const ASPHALT_TOP = '#101216';
const ASPHALT_BOTTOM = '#050506';
const CHALK = 'rgba(255,255,255,0.16)';
const CHALK_SOFT = 'rgba(255,255,255,0.08)';

type CarpoolHeroAction = {
  label: string;
  icon?: IconName;
  onPress: () => void;
  tone?: 'primary' | 'ghost';
};

interface CarpoolHeroProps {
  brand?: string;
  eyebrow: string;
  headline: string;
  support: string;
  actions: CarpoolHeroAction[];
  /** Hauteur mini du bloc atmosphère. */
  minHeight?: number;
  /** Marge basse — le héros s'ouvre directement sur le contenu. */
  compact?: boolean;
}

/** Fond bitume + géométrie terrain/voie, réutilisable (invité + membre). */
export const CarpoolPitchBackdrop: React.FC<{
  width: number;
  height: number;
  accent: string;
}> = ({ width, height, accent }) => {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const cx = w / 2;
  const vanishY = h * 0.32;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ASPHALT_TOP} />
          <Stop offset="1" stopColor={ASPHALT_BOTTOM} />
        </SvgLinearGradient>
        <RadialGradient id="flood" cx="0.5" cy="0.02" r="0.9">
          <Stop offset="0" stopColor={accent} stopOpacity="0.30" />
          <Stop offset="0.45" stopColor={accent} stopOpacity="0.06" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width={w} height={h} fill="url(#asphalt)" />
      <Rect x="0" y="0" width={w} height={h} fill="url(#flood)" />

      {/* Voie de covoiturage qui file vers le point de rendez-vous */}
      <G opacity={0.9}>
        <Line x1={cx} y1={h} x2={cx} y2={vanishY} stroke={CHALK} strokeWidth={2} strokeDasharray="14 16" />
        <Path d={`M ${w * 0.06} ${h} L ${cx - 10} ${vanishY}`} stroke={CHALK_SOFT} strokeWidth={2} />
        <Path d={`M ${w * 0.94} ${h} L ${cx + 10} ${vanishY}`} stroke={CHALK_SOFT} strokeWidth={2} />
      </G>

      {/* Lignes de craie — repère terrain */}
      <Line x1="0" y1={vanishY} x2={w} y2={vanishY} stroke={CHALK_SOFT} strokeWidth={1.5} />
      <Circle cx={cx} cy={vanishY} r={34} stroke={CHALK_SOFT} strokeWidth={1.5} fill="none" />
      <Circle cx={cx} cy={vanishY} r={3} fill={CHALK} />
    </Svg>
  );
};

export const CarpoolHero: React.FC<CarpoolHeroProps> = ({
  brand = 'ProDay',
  eyebrow,
  headline,
  support,
  actions,
  minHeight = 260,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const width = Dimensions.get('window').width;
  const height = minHeight + insets.top;
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Motion #3 : balayage lent du projecteur.
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + sweep.value * 0.4,
    transform: [{ translateX: (sweep.value - 0.5) * width * 0.5 }],
  }));

  return (
    <View style={[styles.shell, { height, marginBottom: compact ? 0 : spacing.md }]}>
      <CarpoolPitchBackdrop width={width} height={height} accent={colors.accent} />
      <Animated.View
        style={[
          styles.floodBeam,
          { backgroundColor: colors.accent, top: -height * 0.5 },
          sweepStyle,
        ]}
        pointerEvents="none"
      />

      <AnimatedEntrance kind="fadeDown">
        <View style={[styles.inner, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.brandRow}>
            <ProDayText variant="brand" style={styles.brandWord}>
              {brand}
            </ProDayText>
            <View style={[styles.brandTick, { backgroundColor: colors.accent }]} />
            <ProDayText variant="eyebrow" style={styles.eyebrow}>
              {eyebrow}
            </ProDayText>
          </View>

          <View style={styles.copy}>
            <ProDayText variant="hero" style={styles.headline} numberOfLines={2}>
              {headline}
            </ProDayText>
            <ProDayText variant="body" style={styles.support} numberOfLines={2}>
              {support}
            </ProDayText>
          </View>

          <View style={styles.ctaRow}>
            {actions.map((action, index) => {
              const ghost = action.tone === 'ghost';
              return (
                <PressableSpring
                  key={action.label}
                  onPress={action.onPress}
                  scaleTo={0.97}
                  haptic
                  style={[
                    styles.cta,
                    ghost
                      ? styles.ctaGhost
                      : { backgroundColor: colors.accent },
                    index === 0 && actions.length > 1 && styles.ctaLead,
                  ]}
                >
                  {action.icon ? (
                    <Icon
                      name={action.icon}
                      size={16}
                      color={ghost ? colors.accent : '#04110F'}
                      variant={ghost ? 'outline' : 'filled'}
                    />
                  ) : null}
                  <ProDayText
                    variant="caption"
                    style={[styles.ctaText, ghost && { color: colors.accent }]}
                  >
                    {action.label}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>
        </View>
      </AnimatedEntrance>
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    shell: {
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    floodBeam: {
      position: 'absolute',
      alignSelf: 'center',
      width: 3,
      height: '150%',
      opacity: 0.3,
      transform: [{ rotate: '12deg' }],
    },
    inner: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    brandWord: {
      color: '#FFFFFF',
      fontSize: 20,
    },
    brandTick: {
      width: 18,
      height: 3,
      borderRadius: 2,
    },
    eyebrow: {
      color: 'rgba(255,255,255,0.66)',
      flexShrink: 1,
    },
    copy: { gap: spacing.xs, maxWidth: 520 },
    headline: {
      color: '#FFFFFF',
      fontSize: 32,
      lineHeight: 36,
    },
    support: {
      color: 'rgba(255,255,255,0.80)',
      lineHeight: 22,
    },
    ctaRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      borderRadius: 4,
    },
    ctaLead: { flexGrow: 1, justifyContent: 'center' },
    ctaGhost: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    ctaText: {
      color: '#04110F',
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 0.3,
    },
  });
}
