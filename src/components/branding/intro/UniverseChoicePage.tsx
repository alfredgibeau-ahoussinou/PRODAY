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

const POLE_PERKS: Record<CarouselPoleId, { icon: string; title: string }[]> = {
  joueur: [
    { icon: '⚡', title: 'CV & Highlight Vidéo' },
    { icon: '📊', title: 'Statistiques Réelles' },
    { icon: '🎯', title: 'Détections & Mercato' },
    { icon: '🔥', title: 'Assistant IA Training' },
  ],
  amateur: [
    { icon: '⚡', title: 'CV & Highlight Vidéo' },
    { icon: '📊', title: 'Statistiques Réelles' },
    { icon: '🎯', title: 'Détections & Mercato' },
    { icon: '🔥', title: 'Assistant IA Training' },
  ],
  pro_player: [
    { icon: '⚡', title: 'CV & Highlight Vidéo' },
    { icon: '📊', title: 'Statistiques Réelles' },
    { icon: '🎯', title: 'Détections & Mercato' },
    { icon: '🔥', title: 'Assistant IA Training' },
  ],
  coach: [
    { icon: '🔥', title: 'Séances IA Blood Bath' },
    { icon: '📋', title: 'Tableau Tactique 3D' },
    { icon: '📲', title: 'Convocations & RSVP' },
    { icon: '📈', title: 'Forme & Débriefs' },
  ],
  pro_staff: [
    { icon: '🔥', title: 'Séances IA Blood Bath' },
    { icon: '📋', title: 'Tableau Tactique 3D' },
    { icon: '📲', title: 'Convocations & RSVP' },
    { icon: '📈', title: 'Forme & Débriefs' },
  ],
  pro_club: [
    { icon: '🛡️', title: 'Gestion Effectifs U7-Seniors' },
    { icon: '🏆', title: 'Tournois & Live Scores' },
    { icon: '📝', title: 'Licences & Adhésions' },
    { icon: '🚗', title: 'Covoiturage Équipe' },
  ],
  evenements: [
    { icon: '🏆', title: 'Tournois & Live Scores' },
    { icon: '🤝', title: 'Matchs Amicaux' },
    { icon: '📊', title: 'Poules & Classements' },
    { icon: '📢', title: 'Billetterie Événement' },
  ],
  president: [
    { icon: '👑', title: 'Cockpit Décisionnel' },
    { icon: '💰', title: 'Finances & Devis' },
    { icon: '📜', title: 'Contrats & Staff' },
    { icon: '⚡', title: 'Validation Membres' },
  ],
  parent: [
    { icon: '👨‍👩‍👧', title: 'Espace Jeunes Sécurisé' },
    { icon: '🛡️', title: 'Contrôle Parental & Tuteur' },
    { icon: '🚗', title: 'Covoiturage Matchs' },
    { icon: '💬', title: 'Lien Direct Coach' },
  ],
  supporter: [
    { icon: '🔴', title: 'Matchs & Scores Live' },
    { icon: '🎬', title: 'Reels Vidéo & Buts' },
    { icon: '⭐', title: 'Élection Joueur MVP' },
    { icon: '🏟️', title: 'Tribune Communauté' },
  ],
  sponsor: [
    { icon: '💎', title: 'Packs Visibilité Locale' },
    { icon: '🎯', title: 'Mécénat & Déduction' },
    { icon: '🤝', title: 'Partenariats Clubs' },
    { icon: '📈', title: 'Portée & ROI Mesuré' },
  ],
  sante: [
    { icon: '❤️', title: 'Bilan Médical & Forme' },
    { icon: '⚡', title: 'Charge Physique & GPS' },
    { icon: '🛡️', title: 'Prévention Blessures' },
    { icon: '🩺', title: 'Suivi Kiné & Staff' },
  ],
  admin: [
    { icon: '👑', title: 'Centre de Commande VIP' },
    { icon: '🤖', title: 'Surveillance IA & Système' },
    { icon: '⚡', title: 'Vérifications & Devis' },
    { icon: '🛡️', title: 'Contrôle Déploiements' },
  ],
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

const POLE_BADGE: Record<CarouselPoleId, string> = {
  admin: 'ACCÈS FONDATION',
  joueur: 'PASS ATHLÈTE',
  amateur: 'PASS ATHLÈTE',
  pro_player: 'PASS PRO',
  coach: 'PASS STAFF',
  pro_staff: 'PASS STAFF',
  pro_club: 'PASS DIRIGEANT',
  evenements: 'PASS EVENT',
  president: 'PASS EXÉCUTIF',
  parent: 'PASS FAMILLE',
  supporter: 'PASS FAN CLUB',
  sponsor: 'PASS PARTENAIRE',
  sante: 'PASS MÉDICAL',
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
  const accent = UNIVERSE_ACCENT[line] || '#F5D04A';
  const variant = brandVariantForCarouselPole(line);
  const poleNum = POLE_NUMBERS[line] || '01';
  const poleName = universePoleDisplayName(line);
  const badgeLabel = POLE_BADGE[line] || 'PASS PRODAY';
  const perks = POLE_PERKS[line] || [
    { icon: '⚡', title: 'Performance' },
    { icon: '🔥', title: 'Entraînement' },
    { icon: '🤝', title: 'Partage' },
    { icon: '🏆', title: 'Victoire' },
  ];

  const symbolSize = cinematic ? 110 : 88;
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
      {/* Carte Fitness Park / Athletic Pass */}
      <View style={[styles.card, { borderColor: `${accent}60` }]}>
        {/* Background Carbon & Dégradé athlétique */}
        <LinearGradient
          colors={['#16221B', '#0E1712', '#07100C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Liseré supérieur néon / accent */}
        <View style={[styles.topNeonStripe, { backgroundColor: accent }]} />

        {/* Halo d'ambiance intense */}
        <View style={[styles.halo, { backgroundColor: accent }]} />

        {/* Header de la carte de membre : Numéro + Badge Type */}
        <View style={styles.cardHeader}>
          <View style={[styles.numBadge, { backgroundColor: accent }]}>
            <Text style={styles.numText}>{poleNum}</Text>
          </View>
          <View style={[styles.typeBadge, { borderColor: `${accent}70`, backgroundColor: `${accent}18` }]}>
            <Text style={[styles.typeText, { color: accent }]}>{badgeLabel}</Text>
          </View>
        </View>

        {/* Bloc Titre Athlétique & Symbole Central */}
        <View style={styles.centerBlock}>
          <View style={styles.symbolAura}>
            <ProDaySymbol variant={variant} size={symbolSize} />
          </View>
          <Text style={[styles.poleTitle, { color: '#FFFFFF' }]}>
            {poleName.toUpperCase()}
          </Text>
        </View>

        {/* Grille 2x2 des avantages & fonctionnalités (Style Fitness Park) */}
        <View style={styles.perksGrid}>
          {perks.map((perk, pIdx) => (
            <View
              key={pIdx}
              style={[
                styles.perkItem,
                { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' },
              ]}
            >
              <Text style={styles.perkIcon}>{perk.icon}</Text>
              <Text style={styles.perkTitle} numberOfLines={1}>
                {perk.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Pied de Carte : Puce Digitale & Sécurité ProDay */}
        <View style={styles.cardFooter}>
          <View style={styles.chipGraphic}>
            <View style={[styles.chipLine, { backgroundColor: accent }]} />
            <View style={[styles.chipLine, { backgroundColor: accent }]} />
            <View style={[styles.chipLine, { backgroundColor: accent }]} />
          </View>
          <Text style={styles.footerCode}>PRODAY · ATHLETIC CLUB 2026</Text>
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
      maxWidth: cinematic ? 390 : 345,
      borderRadius: 24,
      borderWidth: 2,
      padding: cinematic ? 24 : 18,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 12,
      minHeight: cinematic ? 370 : 330,
      justifyContent: 'space-between',
      position: 'relative',
    },
    topNeonStripe: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
    },
    halo: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      top: -40,
      alignSelf: 'center',
      opacity: 0.22,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 4,
    },
    numBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    numText: {
      color: '#07100C',
      fontFamily: 'System',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    typeText: {
      fontFamily: 'System',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    centerBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: cinematic ? 12 : 8,
      gap: 8,
    },
    symbolAura: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    poleTitle: {
      fontFamily: 'System',
      fontSize: cinematic ? 22 : 19,
      fontWeight: '900',
      letterSpacing: 1.8,
      textAlign: 'center',
    },
    perksGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'space-between',
      marginTop: 4,
    },
    perkItem: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    perkIcon: {
      fontSize: 13,
    },
    perkTitle: {
      color: '#E2E8F0',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.1,
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    chipGraphic: {
      flexDirection: 'row',
      gap: 3,
    },
    chipLine: {
      width: 4,
      height: 12,
      borderRadius: 2,
      opacity: 0.7,
    },
    footerCode: {
      color: 'rgba(255, 255, 255, 0.35)',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
  });
