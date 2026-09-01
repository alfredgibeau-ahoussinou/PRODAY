import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  itemWidth: number;
  cinematic?: boolean;
  reducedMotion?: boolean;
  staticFocus?: boolean;
  focused?: boolean;
}

const POLE_DESCRIPTIONS: Record<CarouselPoleId, string> = {
  joueur: 'Révélez votre potentiel, suivez vos performances et accédez aux détections de football.',
  amateur: 'Suivez vos matchs du week-end, construisez votre CV sportif et progressez avec votre équipe.',
  pro_player: 'Plateforme haute performance : statistiques avancées, visibilité mercato et staff dédié.',
  coach: 'Concevez vos séances avec l’IA, préparez votre tableau tactique 3D et pilotez votre effectif.',
  pro_staff: 'Outils d’entraînement d’élite, analyse de charge et convocations d’équipe en temps réel.',
  pro_club: 'Structurez toutes vos catégories, organisez vos tournois et fédérez vos licenciés.',
  evenements: 'Gérez vos tournois en direct, générez vos poules et partagez les scores en temps réel.',
  president: 'Supervisez la gestion globale, validez les devis et pilotez les décisions stratégiques.',
  parent: 'Espace sécurisé pour suivre le calendrier de votre enfant et organiser le covoiturage.',
  supporter: 'Suivez les scores en direct, vibrez avec la communauté et votez pour les meilleurs joueurs.',
  sponsor: 'Soutenez les clubs de football locaux, boostez votre visibilité et suivez votre impact.',
  sante: 'Suivi de la charge physique, prévention des blessures et coordination du staff médical.',
  admin: 'Centre de pilotage exécutif, surveillance des systèmes et gouvernance de la plateforme.',
};

const POLE_INDEX_LABEL: Record<CarouselPoleId, string> = {
  joueur: '01 / 07',
  amateur: '01 / 07',
  pro_player: '01 / 07',
  coach: '02 / 07',
  pro_staff: '02 / 07',
  pro_club: '03 / 07',
  evenements: '03 / 07',
  president: '03 / 07',
  parent: '04 / 07',
  supporter: '05 / 07',
  sponsor: '06 / 07',
  sante: '07 / 07',
  admin: 'VIP EXCLUSIF',
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
  const poleName = universePoleDisplayName(line);
  const description = POLE_DESCRIPTIONS[line] || '';
  const indexLabel = POLE_INDEX_LABEL[line] || '01 / 07';

  const symbolSize = cinematic ? 140 : 115;
  const styles = useMemo(
    () => createStyles(itemWidth, cinematic),
    [itemWidth, cinematic],
  );

  const staticOpacity = useSharedValue(focused ? 1 : reducedMotion ? 0.4 : 0.25);
  const staticScale = useSharedValue(focused ? 1 : reducedMotion ? 0.95 : 0.88);

  useEffect(() => {
    if (!staticFocus) return;
    const nextOpacity = focused ? 1 : reducedMotion ? 0.4 : 0.25;
    const nextScale = focused ? 1 : reducedMotion ? 0.95 : 0.88;
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
      return { opacity: 0, transform: [{ scale: 0.9 }] };
    }
    const page = scrollX.value / itemWidth;
    const offset = page - index;
    const abs = Math.abs(offset);

    if (reducedMotion) {
      const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.7, 0.3], Extrapolation.CLAMP);
      const scale = interpolate(abs, [0, 1], [1, 0.95], Extrapolation.CLAMP);
      return { opacity, transform: [{ scale }] };
    }

    const scale = interpolate(abs, [0, 0.6, 1], [1, 0.92, 0.84], Extrapolation.CLAMP);
    const opacity = interpolate(abs, [0, 0.5, 1], [1, 0.6, 0.2], Extrapolation.CLAMP);
    const translateY = interpolate(abs, [0, 1], [0, 10], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  }, [index, itemWidth, reducedMotion, staticFocus]);

  return (
    <Animated.View style={[styles.root, stageStyle]}>
      <View style={styles.centerStage}>
        {/* Halo d'ambiance ultra-doux */}
        <View style={[styles.softHalo, { backgroundColor: accent }]} />

        {/* Symbole officiel ProDay haute fidélité */}
        <View style={styles.symbolWrap}>
          <ProDaySymbol variant={variant} size={symbolSize} />
        </View>

        {/* Kicker minimaliste */}
        <View style={styles.kickerRow}>
          <View style={[styles.kickerDot, { backgroundColor: accent }]} />
          <Text style={styles.kickerText}>{indexLabel}</Text>
        </View>

        {/* Titre épuré & élégant */}
        <Text style={styles.poleTitle}>
          {poleName}
        </Text>

        {/* Description éditoriale minimaliste */}
        <Text style={styles.description}>
          {description}
        </Text>
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
      paddingHorizontal: 16,
    },
    centerStage: {
      width: '100%',
      maxWidth: cinematic ? 420 : 340,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingVertical: 12,
    },
    softHalo: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      top: -20,
      alignSelf: 'center',
      opacity: 0.12,
    },
    symbolWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    kickerDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    kickerText: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    poleTitle: {
      color: '#FFFFFF',
      fontSize: cinematic ? 34 : 28,
      fontWeight: '800',
      letterSpacing: -0.6,
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      color: 'rgba(255, 255, 255, 0.65)',
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400',
      textAlign: 'center',
      maxWidth: 300,
    },
  });
