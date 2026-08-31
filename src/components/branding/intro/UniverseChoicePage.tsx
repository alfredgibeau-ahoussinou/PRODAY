import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { prodayMotion } from '../../../motion';
import { ProDaySymbol } from '../ProDaySymbol';
import { UNIVERSE_ACCENT } from './universeIntroAccents';
import { brandVariantForCarouselPole, universePoleDisplayName } from './universePoleBrand';

interface UniverseChoicePageProps {
  line: CarouselPoleId;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
  /** Largeur de la slide (peek) — ≠ largeur écran. */
  itemWidth: number;
  /** Composition tablette / desktop : plus d'air. */
  cinematic?: boolean;
  /** Réduit parallax pour accessibilité mouvement. */
  reducedMotion?: boolean;
  /**
   * Mode stage fixe (tablette) — pas de scrollX, focus piloté par `focused`.
   */
  staticFocus?: boolean;
  focused?: boolean;
}

const POLE_FEATURES: Record<CarouselPoleId, string[]> = {
  joueur: ['CV Sportif en ligne', 'Stats réelles de match', 'Détections & Mercato'],
  amateur: ['CV Sportif en ligne', 'Stats réelles de match', 'Détections & Mercato'],
  pro_player: ['CV Sportif en ligne', 'Stats réelles de match', 'Détections & Mercato'],
  coach: ['Séances IA Blood Bath', 'Tableau tactique', 'Convocations RSVP'],
  pro_staff: ['Séances IA Blood Bath', 'Tableau tactique', 'Convocations RSVP'],
  pro_club: ['Gestion des effectifs', 'Tournois en direct', 'Licences & Adhésions'],
  evenements: ['Organisation tournois', 'Matchs amicaux', 'Tableaux en direct'],
  president: ['Cockpit décisionnel', 'Finances & Devis', 'Contrats & Staff'],
  parent: ['Espace jeunes sécurisé', 'Contrôle tuteur', 'Covoiturage club'],
  supporter: ['Scores & matchs en direct', 'Tribune & communauté', 'Votes MVP'],
  sponsor: ['Packs de sponsoring', 'Visibilité locale', 'Reçus fiscaux'],
  sante: ['Suivi médical & forme', 'Charge physique', 'Prévention blessures'],
  admin: ['Centre de commande VIP', 'Surveillance IA & Système', 'Vérifications & Devis'],
};

const POLE_NUMBERS: Record<CarouselPoleId, string> = {
  admin: 'VIP',
  joueur: '01',
  amateur: '01',
  pro_player: '01',
  coach: '02',
  pro_staff: '02',
  pro_club: '03',
  evenements: '03',
  president: '03',
  parent: '04',
  supporter: '05',
  sponsor: '06',
  sante: '07',
};

export const UniverseChoicePage: React.FC<UniverseChoicePageProps> = ({
  line,
  index,
  itemWidth,
  scrollX,
  cinematic = false,
  reducedMotion = false,
  staticFocus = false,
  focused = true,
}) => {
  const accent = UNIVERSE_ACCENT[line] || '#C5A059';
  const variant = brandVariantForCarouselPole(line);
  const poleNum = POLE_NUMBERS[line] || '01';
  const poleName = universePoleDisplayName(line);
  const features = POLE_FEATURES[line] || ['Performance', 'Développement', 'Partage'];

  const symbolSize = cinematic ? 120 : 96;
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const staticOpacity = useSharedValue(focused ? 1 : reducedMotion ? 0.55 : 0.42);
  const staticScale = useSharedValue(focused ? 1 : reducedMotion ? 0.97 : 0.9);

  useEffect(() => {
    if (!staticFocus) return;
    const nextOpacity = focused ? 1 : reducedMotion ? 0.55 : 0.42;
    const nextScale = focused ? 1 : reducedMotion ? 0.97 : 0.9;
    if (reducedMotion) {
      staticOpacity.value = nextOpacity;
      staticScale.value = nextScale;
      return;
    }
    staticOpacity.value = withTiming(nextOpacity, {
      duration: prodayMotion.duration.slow,
      easing: prodayMotion.easing.out,
    });
    staticScale.value = withSpring(nextScale, prodayMotion.spring.smooth);
  }, [focused, reducedMotion, staticFocus, staticOpacity, staticScale]);

  const stageStyle = useAnimatedStyle(() => {
    if (staticFocus) {
      return {
        opacity: staticOpacity.value,
        transform: [{ scale: staticScale.value }],
      };
    }
    if (itemWidth <= 0) {
      return { opacity: 0, transform: [{ scale: 0.96 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.8, 0.5], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.96], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    const scale = interpolate(abs, [0, 0.65, 1], [1, 0.97, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.72, 0.4], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  }, [index, itemWidth, reducedMotion, staticFocus]);

  return (
    <Animated.View style={[styles.root, stageStyle]}>
      {/* Carte Holographique ProDay */}
      <View style={[styles.card, { borderColor: `${accent}40` }]}>
        <LinearGradient
          colors={[
            `${accent}22`,
            'rgba(18, 26, 22, 0.85)',
            'rgba(7, 16, 12, 0.95)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Halo lumineux d'ambiance */}
        <View style={[styles.halo, { backgroundColor: accent }]} />

        {/* Header de la carte : Numéro & Kicker */}
        <View style={styles.cardHeader}>
          <View style={[styles.numBadge, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
            <Text style={[styles.numText, { color: accent }]}>{poleNum}</Text>
          </View>
          <Text style={[styles.kickerText, { color: accent }]}>PÔLE {poleName.toUpperCase()}</Text>
        </View>

        {/* Symbole officiel ProDay au centre */}
        <View style={styles.symbolWrap}>
          <ProDaySymbol variant={variant} size={symbolSize} />
        </View>

        {/* Séparateur subtil */}
        <View style={[styles.divider, { backgroundColor: `${accent}30` }]} />

        {/* Liste des fonctionnalités clés */}
        <View style={styles.featuresList}>
          {features.map((feat, fIdx) => (
            <View key={fIdx} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: accent }]} />
              <Text style={styles.featureText} numberOfLines={1}>
                {feat}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (itemWidth: number, cinematic: boolean) =>
  StyleSheet.create({
    root: {
      width: itemWidth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    card: {
      width: '100%',
      maxWidth: cinematic ? 380 : 340,
      borderRadius: 24,
      borderWidth: 1.5,
      padding: cinematic ? 24 : 20,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 8,
      minHeight: cinematic ? 340 : 290,
      justifyContent: 'space-between',
    },
    halo: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      top: -30,
      alignSelf: 'center',
      opacity: 0.18,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      justifyContent: 'flex-start',
    },
    numBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    numText: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    kickerText: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    symbolWrap: {
      marginVertical: cinematic ? 18 : 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      width: '100%',
      height: 1,
      marginVertical: 10,
    },
    featuresList: {
      width: '100%',
      gap: 8,
      paddingTop: 4,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    featureText: {
      color: '#E0E8E5',
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
  });
