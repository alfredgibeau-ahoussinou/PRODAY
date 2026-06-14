import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProductLineId } from '../../../models/ProductLine';
import { getUniverseIdentity } from '../../../content/brandExperience';
import { ProductLineLogo } from '../ProductLineLogo';
import { gradientsForLine } from '../../../theme/universeGradients';
import { spacing } from '../../../theme/designTokens';
import { UNIVERSE_SHORT } from './universeIntroAccents';

const FEATURES: Record<ProductLineId, string[]> = {
  homme: ['Mercato M', 'Matchs & convocations', 'CV foot en ligne'],
  woman: ['Mercato F', 'Matchs au féminin', 'CV joueuse'],
  pro: ['Mercato Pro', 'Convocations staff', 'Réseau vérifié'],
  sante: ['Agenda RDV', 'Messagerie patients', 'Visibilité clubs'],
};

interface UniverseChoicePageProps {
  line: ProductLineId;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
}

/** Une page plein écran par univers — glisse horizontalement. */
export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  pageWidth,
  pageHeight,
  scrollX,
}) => {
  const identity = getUniverseIdentity(line);
  const stops = gradientsForLine(line);
  const styles = useMemo(() => createStyles(pageWidth, pageHeight), [pageHeight, pageWidth]);
  const bullets = FEATURES[line];

  const contentStyle = useAnimatedStyle(() => {
    const page = scrollX.value / pageWidth;
    const offset = page - index;
    const translateX = interpolate(offset, [-1, 0, 1], [pageWidth * 0.22, 0, -pageWidth * 0.22], Extrapolation.CLAMP);
    const opacity = interpolate(offset, [-1, -0.25, 0, 0.25, 1], [0, 0.45, 1, 0.45, 0], Extrapolation.CLAMP);
    const scale = interpolate(offset, [-1, 0, 1], [0.9, 1, 0.9], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateX }, { scale }],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    const page = scrollX.value / pageWidth;
    const offset = page - index;
    const translateY = interpolate(offset, [-1, 0, 1], [28, 0, 28], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[...stops.hero]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <View style={styles.scrim} />

      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={styles.pageTag}>
          {String(index + 1).padStart(2, '0')} · {UNIVERSE_SHORT[line]}
        </Text>

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <ProductLineLogo line={line} width={Math.min(pageWidth * 0.52, 200)} onDark />
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.productName}>{identity.productName}</Text>
          <Text style={styles.heroLine}>{identity.heroLine}</Text>
          <Text style={styles.mission}>{identity.mission}</Text>
        </View>

        <View style={styles.bullets}>
          {bullets.map((label) => (
            <View key={label} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

function createStyles(pageWidth: number, pageHeight: number) {
  return StyleSheet.create({
    page: {
      width: pageWidth,
      height: pageHeight,
      overflow: 'hidden',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl * 2,
      paddingBottom: spacing.xl * 5,
      justifyContent: 'center',
      gap: spacing.lg,
    },
    pageTag: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.62)',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    logoWrap: {
      alignItems: 'flex-start',
    },
    copy: {
      gap: spacing.sm,
    },
    productName: {
      fontSize: 15,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.82)',
      letterSpacing: 0.4,
    },
    heroLine: {
      fontSize: 34,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -1,
      lineHeight: 38,
    },
    mission: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.78)',
      maxWidth: pageWidth * 0.88,
    },
    bullets: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    bulletText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.92)',
    },
  });
}
