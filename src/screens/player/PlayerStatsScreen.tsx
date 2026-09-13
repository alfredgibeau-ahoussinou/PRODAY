import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  playerPassportService,
  type PlayerPassportData,
} from '../../services/playerPassport.service';
import { PlayerCertifiedPassportModal } from '../../components/player/PlayerCertifiedPassportModal';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';

export const PlayerStatsScreen: React.FC = () => {
  const profile = useSessionProfile();
  const [showPassport, setShowPassport] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const guideSections: GuideSection[] = [
    {
      icon: 'star',
      iconColor: '#FFD700',
      title: 'Calcul des Notes du Staff (/10)',
      description: 'Après chaque match, le coach et ses adjoints évaluent ton impact selon des critères rigoureux (implication tactique, justesse technique, volume). La note moyenne globale (7.9) alimente ton passeport officiel.',
      badge: 'OFFICIEL FFF',
    },
    {
      icon: 'shield-checkmark',
      iconColor: '#30D158',
      title: 'Passeport Numérique Certifié',
      description: 'Ton passeport regroupe ton numéro de licence officiel, ton club d\'affiliation, tes minutes disputées et la signature de ton entraîneur pour attester de la véracité de ton CV.',
      badge: 'SCELLÉ',
    },
    {
      icon: 'qr-code',
      iconColor: '#0A84FF',
      title: 'Partage QR Code aux Recruteurs',
      description: 'Présente ou partage ton QR Code sécurisé lors des détections, stages ou essais. Les recruteurs scannent le code pour consulter instantanément ta fiche de joueur certifiée.',
      badge: 'SCOUTING',
    },
    {
      icon: 'speedometer',
      iconColor: '#A855F7',
      title: 'Données Physiques & GPS',
      description: 'Suis tes performances athlétiques clés : vitesse de pointe (32.8 km/h), distance moyenne parcourue (10.4 km) et pourcentage de réussite technique.',
    },
  ];

  const passportData: PlayerPassportData = playerPassportService.buildPassport({
    playerId: profile?.uid || 'player-demo',
    fullName: profile?.display_name || 'Kylian Perez',
    licenseNumber: 'FFF-75928103',
    clubName: 'FC ProDay',
    clubAffiliation: 'FFF-582910',
    category: 'Seniors R2',
    position: profile?.profile?.position || 'Attaquant (BU)',
    ovr: 87,
    matchesPlayed: 18,
    goals: 14,
    assists: 8,
    averageRating: 7.9,
    coachName: 'Didier Deschamps',
  });

  const lastMatches = [
    { opponent: 'AS Meudon', score: '3-1', date: 'J16', rating: 8.5, goals: 2, assists: 0 },
    { opponent: 'ES Colombes', score: '2-2', date: 'J15', rating: 7.8, goals: 1, assists: 1 },
    { opponent: 'FC Rueil', score: '4-0', date: 'J14', rating: 8.2, goals: 2, assists: 2 },
    { opponent: 'US Suresnes', score: '1-0', date: 'J13', rating: 7.4, goals: 0, assists: 1 },
    { opponent: 'Racing CFF', score: '2-1', date: 'J12', rating: 8.0, goals: 1, assists: 0 },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Passport CTA */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenSubtitle}>Saison 2025/2026</Text>
          <Text style={styles.screenTitle}>Performance & CV</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.guideIconBtn}
            onPress={() => {
              prodayHaptics.selection();
              setShowGuideModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Guide de la page"
          >
            <Ionicons name="help-circle-outline" size={16} color="#30D158" />
            <Text style={styles.guideBtnText}>Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passportBadgeBtn}
            onPress={() => {
              prodayHaptics.impactMedium();
              setShowPassport(true);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="shield-check" size={16} color="#30D158" />
            <Text style={styles.passportBadgeText}>Passeport FFF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dismissible Onboarding Guide Banner */}
      <PlayerPageGuideBanner
        pageKey="stats"
        title="Guide Performance & Passeport CV"
        subtitle="Découvre comment tes notes sont calculées et partage ton QR Code"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Primary KPI 4-Card Hero Matrix */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
            <Ionicons name="football" size={16} color="#30D158" />
          </View>
          <Text style={styles.kpiVal}>{passportData.goals}</Text>
          <Text style={styles.kpiLbl}>BUTS MARQUÉS</Text>
          <Text style={styles.kpiDelta}>+3 sur les 3 derniers</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
            <Ionicons name="git-pull-request" size={16} color="#0A84FF" />
          </View>
          <Text style={styles.kpiVal}>{passportData.assists}</Text>
          <Text style={styles.kpiLbl}>PASSES DÉCISIVES</Text>
          <Text style={styles.kpiDelta}>Top 3 de la poule</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.12)' }]}>
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
          <Text style={[styles.kpiVal, { color: '#FFD700' }]}>{passportData.averageRating}</Text>
          <Text style={styles.kpiLbl}>NOTE STAFF /10</Text>
          <Text style={styles.kpiDelta}>Attribuée par le coach</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
            <Ionicons name="time" size={16} color="#A855F7" />
          </View>
          <Text style={styles.kpiVal}>1 540'</Text>
          <Text style={styles.kpiLbl}>TEMPS DE JEU</Text>
          <Text style={styles.kpiDelta}>18 titularisations</Text>
        </View>
      </View>

      {/* Certified Club Passport Banner (Hero CTA) */}
      <TouchableOpacity
        style={styles.passportHeroCard}
        onPress={() => {
          prodayHaptics.impactMedium();
          setShowPassport(true);
        }}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#161E2E', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.passportHeroGradient}
        >
          <View style={styles.passportHeroLeft}>
            <View style={styles.passportHeroIcon}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#30D158" />
            </View>
            <View style={styles.passportHeroText}>
              <Text style={styles.passportHeroTitle}>Passeport Athlétique Certifié</Text>
              <Text style={styles.passportHeroSub}>
                Générer mon QR Code sécurisé pour les recruteurs
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Rolling Match History with Coach Ratings */}
      <View style={styles.matchHistorySection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Dernières Notations du Staff</Text>
          <Text style={styles.sectionHeaderSub}>Feuilles de match officielles</Text>
        </View>

        <View style={styles.matchList}>
          {lastMatches.map((m, idx) => (
            <View key={idx} style={styles.matchRow}>
              <View style={styles.matchDateBadge}>
                <Text style={styles.matchDateText}>{m.date}</Text>
              </View>

              <View style={styles.matchInfoCol}>
                <Text style={styles.matchOpponentText}>{m.opponent}</Text>
                <Text style={styles.matchScoreText}>
                  Victoire {m.score} · {m.goals}B · {m.assists}P
                </Text>
              </View>

              <View style={styles.ratingBadgeBox}>
                <Text style={styles.ratingBadgeVal}>{m.rating}</Text>
                <Text style={styles.ratingBadgeMax}>/10</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Athletic Physical Benchmark Gauges */}
      <View style={styles.athleticSection}>
        <Text style={styles.sectionHeaderTitle}>Données Physiques & GPS</Text>
        <Text style={styles.sectionHeaderSub}>Mesures d'entraînement et de match</Text>

        <View style={styles.benchGrid}>
          <View style={styles.benchItem}>
            <Text style={styles.benchVal}>32.8 km/h</Text>
            <Text style={styles.benchKey}>VITESSE DE POINTE</Text>
          </View>
          <View style={styles.benchItem}>
            <Text style={styles.benchVal}>10.4 km</Text>
            <Text style={styles.benchKey}>DISTANCE MOYENNE</Text>
          </View>
          <View style={styles.benchItem}>
            <Text style={styles.benchVal}>84 %</Text>
            <Text style={styles.benchKey}>PASSES RÉUSSIES</Text>
          </View>
          <View style={styles.benchItem}>
            <Text style={styles.benchVal}>68 %</Text>
            <Text style={styles.benchKey}>TIRS CADRÉS</Text>
          </View>
        </View>
      </View>

      {/* Certified Passport Modal */}
      <PlayerCertifiedPassportModal
        visible={showPassport}
        passport={passportData}
        onClose={() => setShowPassport(false)}
      />

      {/* Interactive Page Guide Modal */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Performance & CV Numérique"
        pageSubtitle="Suivi athlétique officiel et dossier de recrutement"
        badgeLabel="GUIDE PERFORMANCE & CV"
        badgeColor="#30D158"
        introText="Cet écran regroupe tes statistiques individuelles officielles, les notations attribuées par le staff et ton passeport certifié avec QR Code infalsifiable pour les recruteurs."
        sections={guideSections}
        proTip="Un dossier complet avec au moins 10 notes du staff et un QR Code actif multiplie par 3 tes chances d'être contacté par un club de niveau supérieur !"
        ctaLabel="J'ai compris !"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  guideBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  screenSubtitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 12,
    color: '#94A3B8',
  },
  screenTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passportBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  passportBadgeText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLbl: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  kpiDelta: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    color: '#30D158',
    marginTop: 4,
  },
  passportHeroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
  },
  passportHeroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  passportHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  passportHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportHeroText: {
    flex: 1,
  },
  passportHeroTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  passportHeroSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  matchHistorySection: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  matchList: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  matchDateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  matchDateText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  matchInfoCol: {
    flex: 1,
  },
  matchOpponentText: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchScoreText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ratingBadgeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingBadgeVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '900',
    color: '#FFD700',
  },
  ratingBadgeMax: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#64748B',
    marginLeft: 2,
  },
  athleticSection: {
    marginBottom: 20,
  },
  benchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  benchItem: {
    width: '48%',
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
  },
  benchVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  benchKey: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
});
