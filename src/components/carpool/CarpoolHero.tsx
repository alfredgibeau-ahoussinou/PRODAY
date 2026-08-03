import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
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
 * « Stade la nuit » — une seule composition plein cadre, calme et éditoriale :
 * bitume profond, une voie qui converge vers le point de rendez-vous, un halo
 * de projecteur. Marque + un titre + une phrase + (au plus) une action.
 * Aucun overlay, badge, chip ou carte sur le héros.
 */

const ASPHALT_TOP = '#0E1013';
const ASPHALT_BOTTOM = '#040405';
const CHALK = 'rgba(255,255,255,0.14)';
const CHALK_SOFT = 'rgba(255,255,255,0.05)';

type CarpoolHeroAction = {
  label: string;
  icon?: IconName;
  onPress: () => void;
};

interface CarpoolHeroProps {
  brand?: string;
  headline: string;
  support?: string;
  /** Action unique, mise en avant. Facultative (le membre navigue au ruban). */
  primaryAction?: CarpoolHeroAction;
  /** Lien discret secondaire, en texte (ex. créer un compte). */
  linkAction?: { label: string; onPress: () => void };
  /** Hauteur mini du bloc atmosphère (mode fixe). */
  minHeight?: number;
  /** Le héros occupe toute la hauteur disponible (invité). */
  fill?: boolean;
}

/** Fond bitume + voie qui converge — atmosphère réutilisable (invité + membre). */
export const CarpoolPitchBackdrop: React.FC<{
  width: number;
  height: number;
  accent: string;
}> = ({ width, height, accent }) => {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const cx = w / 2;
  const vanishY = h * 0.3;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ASPHALT_TOP} />
          <Stop offset="1" stopColor={ASPHALT_BOTTOM} />
        </SvgLinearGradient>
        <RadialGradient id="flood" cx="0.5" cy="0" r="0.95">
          <Stop offset="0" stopColor={accent} stopOpacity="0.26" />
          <Stop offset="0.4" stopColor={accent} stopOpacity="0.05" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
        <SvgLinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ASPHALT_BOTTOM} stopOpacity="0" />
          <Stop offset="0.55" stopColor={ASPHALT_BOTTOM} stopOpacity="0" />
          <Stop offset="1" stopColor={ASPHALT_BOTTOM} stopOpacity="0.92" />
        </SvgLinearGradient>
      </Defs>

      <Rect x="0" y="0" width={w} height={h} fill="url(#asphalt)" />
      <Rect x="0" y="0" width={w} height={h} fill="url(#flood)" />

      {/* Repère terrain — une ligne d'horizon et le rond central, très discrets */}
      <Line x1="0" y1={vanishY} x2={w} y2={vanishY} stroke={CHALK_SOFT} strokeWidth={1} />
      <Circle cx={cx} cy={vanishY} r={42} stroke={CHALK_SOFT} strokeWidth={1} fill="none" />

      {/* La voie de covoiturage qui converge vers le point de rendez-vous */}
      <G>
        <Path d={`M ${w * 0.14} ${h} L ${cx - 7} ${vanishY}`} stroke={CHALK_SOFT} strokeWidth={1.5} />
        <Path d={`M ${w * 0.86} ${h} L ${cx + 7} ${vanishY}`} stroke={CHALK_SOFT} strokeWidth={1.5} />
        <Line x1={cx} y1={h} x2={cx} y2={vanishY} stroke={CHALK} strokeWidth={2} strokeDasharray="16 20" />
      </G>
      <Circle cx={cx} cy={vanishY} r={3} fill={accent} opacity={0.9} />

      {/* Voile bas — le texte repose sur le noir */}
      <Rect x="0" y="0" width={w} height={h} fill="url(#fade)" />
    </Svg>
  );
};

export const CarpoolHero: React.FC<CarpoolHeroProps> = ({
  brand = 'ProDay',
  headline,
  support,
  primaryAction,
  linkAction,
  minHeight = 244,
  fill = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  // Motion : balayage lent et unique du projecteur.
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 7200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + sweep.value * 0.32,
    transform: [{ translateX: (sweep.value - 0.5) * (size.width || 320) * 0.44 }],
  }));

  const shellStyle = fill
    ? [styles.shell, styles.fill]
    : [styles.shell, { height: minHeight + insets.top }];

  return (
    <View style={shellStyle} onLayout={onLayout}>
      {size.width > 0 ? (
        <CarpoolPitchBackdrop width={size.width} height={size.height} accent={colors.accent} />
      ) : null}
      <Animated.View
        style={[styles.floodBeam, { backgroundColor: colors.accent }, sweepStyle]}
        pointerEvents="none"
      />

      <AnimatedEntrance kind="fadeDown">
        <View style={[styles.inner, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.brandRow}>
            <ProDayText variant="brand" style={styles.brandWord}>
              {brand}
            </ProDayText>
            <View style={[styles.brandTick, { backgroundColor: colors.accent }]} />
          </View>

          <View style={styles.copy}>
            <ProDayText variant="hero" style={styles.headline}>
              {headline}
            </ProDayText>
            {support ? (
              <ProDayText variant="body" style={styles.support} numberOfLines={2}>
                {support}
              </ProDayText>
            ) : null}
          </View>

          {primaryAction ? (
            <View style={styles.actions}>
              <PressableSpring
                onPress={primaryAction.onPress}
                scaleTo={0.97}
                haptic
                style={[styles.cta, { backgroundColor: colors.accent }]}
              >
                <ProDayText variant="caption" style={styles.ctaText}>
                  {primaryAction.label}
                </ProDayText>
                {primaryAction.icon ? (
                  <Icon name={primaryAction.icon} size={16} color="#04110F" variant="filled" />
                ) : null}
              </PressableSpring>
              {linkAction ? (
                <PressableSpring onPress={linkAction.onPress} scaleTo={0.98} style={styles.link}>
                  <ProDayText variant="caption" style={styles.linkText}>
                    {linkAction.label}
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </View>
          ) : null}
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
      backgroundColor: ASPHALT_BOTTOM,
    },
    fill: { flex: 1 },
    floodBeam: {
      position: 'absolute',
      alignSelf: 'center',
      top: '-25%',
      width: 2,
      height: '150%',
      opacity: 0.3,
      transform: [{ rotate: '10deg' }],
    },
    inner: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    brandWord: {
      color: '#FFFFFF',
      fontSize: 18,
    },
    brandTick: {
      width: 22,
      height: 2,
      borderRadius: 1,
    },
    copy: { gap: spacing.sm, maxWidth: 560 },
    headline: {
      color: '#FFFFFF',
      fontSize: 36,
      lineHeight: 39,
      letterSpacing: -1,
    },
    support: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: 15,
      lineHeight: 22,
      maxWidth: 420,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderRadius: 4,
    },
    ctaText: {
      color: '#04110F',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    link: { paddingVertical: 6 },
    linkText: {
      color: 'rgba(255,255,255,0.62)',
      fontWeight: '600',
      fontSize: 13,
      textDecorationLine: 'underline',
    },
  });
}
