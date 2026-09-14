import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { PlayerCardReveal } from '../../components/joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import type { ProDayPlayerCardData } from '../../models/ProDayCard';
import { PlayerStoryExportModal } from '../../components/player/PlayerStoryExportModal';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { PlayerPageGuideModal, type GuideSection } from '../../components/player/PlayerPageGuideModal';
import { PlayerPageGuideBanner } from '../../components/player/PlayerPageGuideBanner';

interface PlayerHomeScreenProps {
  onNavigateTab?: (tabId: 'stats' | 'wellness' | 'tactics') => void;
}

export const PlayerHomeScreen: React.FC<PlayerHomeScreenProps> = ({ onNavigateTab }) => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';
  const tabNav = useTabNavigationOptional();

  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('present');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    void playerRsvpService.getRsvp(userId, 'match-j17').then(setRsvp);
  }, [userId]);

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    setRsvp(status);
    void playerRsvpService.setRsvp(userId, 'match-j17', status);
  };

  const guideSections: GuideSection[] = [
    {
      icon: 'card',
      iconColor: '#FFD700',
      title: 'Carte FUT Officielle Intouchable',
      description: 'Ta carte officielle ProDay résume ton identité, ton niveau OVR (87) et tes 3 métriques clés : Matchs joués, Note moyenne du staff et Buts+Passes. Touche-la pour accéder à ton passeport complet.',
      badge: 'IDENTITÉ SACRÉE',
    },
    {
      icon: 'checkmark-done-circle',
      iconColor: '#30D158',
      title: 'Statut RSVP Match Instantané',
      description: 'Indique en un tap ton statut pour le prochain match J17 (Présent, Incertain ou Absent). Le staff technique est immédiatement notifié pour préparer la feuille de match et la tactique.',
      badge: 'EN 1 TAP',
    },
    {
      icon: 'partly-sunny',
      iconColor: '#0A84FF',
      title: 'Météo & Compte à Rebours J17',
      description: 'Visualise le décompte exact jusqu\'au coup d\'envoi ainsi que la météo et le revêtement du terrain pour adapter ton équipement (moulés vs vissés).',
    },
    {
      icon: 'sparkles',
      iconColor: '#A855F7',
      title: 'Export Story Social Flex (9:16)',
      description: 'Génère une story haute définition prête pour Instagram et TikTok avec ta carte FUT officielle et tes statistiques pour valoriser ton statut sur les réseaux.',
      badge: 'VIRAL',
    },
  ];

  const cardData: ProDayPlayerCardData = React.useMemo(() => {
    if (profile) {
      const base = userToProDayCard(profile, {
        clubName: 'FC ProDay',
      });
      return {
        ...base,
        matches: 18,
        goals: 14,
        assists: 8,
        overall: 87,
        tier: 'gold',
        formPct: 89,
        primaryPosition: profile.profile?.position || 'BU',
      };
    }
    return {
      id: userId,
      role: 'player',
      tier: 'gold',
      displayName: 'Kylian Perez',
      photoUrl: null,
      verified: true,
      accentHex: '#FFD700',
      deepHex: '#7A621E',
      actions: ['view_profile', 'message'],
      firstName: 'Kylian',
      lastName: 'Perez',
      age: 22,
      gender: 'M',
      nationality: 'FR',
      clubName: 'FC ProDay',
      primaryPosition: 'BU',
      strongFoot: 'R',
      heightCm: 181,
      weightKg: 75,
      levelLabel: 'Régional 1',
      league: 'Seniors R1',
      levelBadge: 'amateur',
      overall: 87,
      formPct: 89,
      potential: 94,
      estimatedValueLabel: '—',
      matches: 18,
      goals: 14,
      assists: 8,
      minutesPlayed: 1260,
      lastMatchLabel: '18 matchs',
      progressLabel: 'Saison 25/26',
      skillBadges: ['#10', 'BU', 'R1'],
      aiObjectives: [],
      recruitmentStatus: 'Sous contrat',
    };
  }, [profile, userId]);

  const playerData = {
    id: cardData.id,
    name: cardData.displayName,
    pos: cardData.primaryPosition,
    ovr: cardData.overall,
    tier: cardData.overall >= 88 ? ('special' as const) : ('gold' as const),
    clubName: cardData.clubName,
    pac: 92,
    sho: 86,
    pas: 81,
    dri: 89,
    def: 44,
    phy: 78,
    matchesPlayed: cardData.matches,
    goals: cardData.goals,
    assists: cardData.assists,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Welcome Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>Bonjour,</Text>
          <Text style={styles.nameHeader}>{cardData.firstName}</Text>
        </View>

        <View style={styles.headerBadges}>
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

          <View style={styles.levelPill}>
            <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
            <Text style={styles.levelText}>Niv. 8 · Pro</Text>
          </View>
        </View>
      </View>

      {/* Dismissible Onboarding Guide Banner */}
      <PlayerPageGuideBanner
        pageKey="cockpit"
        title="Guide du Cockpit ProDay"
        subtitle="Découvre ta carte FUT, le RSVP match et l'export Story"
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* Central Visual: Identique à la page compte (PlayerCardReveal / PlayerShieldCard) */}
      <View style={styles.futCardSection}>
        <PlayerCardReveal
          card={cardData}
          width={Math.min(270, Dimensions.get('window').width - 48)}
          onPress={() => onNavigateTab?.('stats')}
        />
        <Text style={styles.cardHint}>Toucher la carte pour afficher les détails & statistiques</Text>
      </View>

      {/* Next Match Countdown, Weather & One-Tap RSVP Widget */}
      <LinearGradient
        colors={['#161B26', '#0E1118']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.matchWidgetCard}
      >
        <View style={styles.matchWidgetTop}>
          <View style={styles.matchBadgeRow}>
            <View style={styles.matchLiveBadge}>
              <Ionicons name="time" size={12} color="#30D158" />
              <Text style={styles.matchLiveBadgeText}>PROCHAIN MATCH · J17</Text>
            </View>
            <View style={styles.weatherPill}>
              <Ionicons name="sunny" size={12} color="#FBBF24" />
              <Text style={styles.weatherText}>18°C · Synthétique</Text>
            </View>
          </View>

          <Text style={styles.matchFixtureTitle}>FC ProDay vs RC France</Text>
          <Text style={styles.matchCountdownSub}>Coup d'envoi dans 2j 14h 22m · Sam. 20 Sept · 18:00</Text>
        </View>

        {/* One-Tap RSVP Bar */}
        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpSectionTitle}>MON STATUT DE PRÉSENCE :</Text>
          <View style={styles.rsvpBar}>
            <TouchableOpacity
              style={[styles.rsvpBtn, rsvp === 'present' && styles.rsvpBtnPresent]}
              onPress={() => handleRsvpChange('present')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={rsvp === 'present' ? '#000000' : '#30D158'}
              />
              <Text style={[styles.rsvpBtnText, rsvp === 'present' && styles.rsvpBtnTextActive]}>
                Présent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rsvpBtn, rsvp === 'pending' && styles.rsvpBtnPending]}
              onPress={() => handleRsvpChange('pending')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="help-circle"
                size={14}
                color={rsvp === 'pending' ? '#000000' : '#FBBF24'}
              />
              <Text style={[styles.rsvpBtnText, rsvp === 'pending' && styles.rsvpBtnTextActive]}>
                Incertain
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rsvpBtn, rsvp === 'absent' && styles.rsvpBtnAbsent]}
              onPress={() => handleRsvpChange('absent')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close-circle"
                size={14}
                color={rsvp === 'absent' ? '#FFFFFF' : '#FF453A'}
              />
              <Text style={[styles.rsvpBtnText, rsvp === 'absent' && styles.rsvpBtnTextActive]}>
                Absent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Direct Gateway to Current Season */}
      <TouchableOpacity
        style={styles.seasonBannerBtn}
        onPress={() => {
          prodayHaptics.selection();
          tabNav?.setActiveTab('feed');
        }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#161E2E', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.seasonBannerGradient}
        >
          <View style={styles.seasonBannerLeft}>
            <View style={styles.seasonBannerIconBox}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.seasonBannerTitle}>Saison 2025/2026 en Direct</Text>
              <Text style={styles.seasonBannerSub}>FC ProDay 1er · Match J17 au sommet · Voir les matchs →</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#30D158" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Valeur Marchande & Score Carrière ProDay */}
      <LinearGradient
        colors={['#14141A', '#0E0E14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.careerHeroCard}
      >
        <View style={styles.careerHeroHeader}>
          <View style={styles.careerTag}>
            <Ionicons name="briefcase" size={13} color="#0A84FF" />
            <Text style={styles.careerTagText}>COTATION & STATUT CARRIÈRE</Text>
          </View>
          <Text style={styles.contractStatusBadge}>Sous contrat R1</Text>
        </View>

        <View style={styles.careerHeroMetrics}>
          <View style={styles.careerMetricCol}>
            <Text style={styles.careerMetricVal}>120k €</Text>
            <Text style={styles.careerMetricLbl}>COTE PRODAY</Text>
            <Text style={styles.careerMetricSub}>+15% cette saison</Text>
          </View>

          <View style={styles.careerMetricDivider} />

          <View style={styles.careerMetricCol}>
            <Text style={[styles.careerMetricVal, { color: '#30D158' }]}>84 / 100</Text>
            <Text style={styles.careerMetricLbl}>SCORE CARRIÈRE</Text>
            <Text style={styles.careerMetricSub}>Profil certifié</Text>
          </View>

          <View style={styles.careerMetricDivider} />

          <View style={styles.careerMetricCol}>
            <Text style={[styles.careerMetricVal, { color: '#FFD700' }]}>114</Text>
            <Text style={styles.careerMetricLbl}>MATCHS TOTAL</Text>
            <Text style={styles.careerMetricSub}>59 Buts · 32 Passes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exportCvBtn}
          onPress={() => onNavigateTab?.('stats')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={15} color="#30D158" />
          <Text style={styles.exportCvBtnText}>Voir mon Passeport & CV Recruteurs</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Trajectoire & Historique des Clubs */}
      <View style={styles.careerSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trajectoire & Historique des Clubs</Text>
          <Text style={styles.sectionSubtitle}>Parcours en compétition officielle FFF</Text>
        </View>

        <View style={styles.timelineList}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDotActive} />
            <View style={styles.timelineItemContent}>
              <View style={styles.timelineRowTop}>
                <Text style={styles.timelineClub}>FC ProDay</Text>
                <Text style={styles.timelineYearsActive}>2024 - Présent</Text>
              </View>
              <Text style={styles.timelineDivision}>Seniors Régional 1 · 38 Matchs · 26 Buts</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineItemContent}>
              <View style={styles.timelineRowTop}>
                <Text style={styles.timelineClub}>Red Star FC</Text>
                <Text style={styles.timelineYears}>2022 - 2024</Text>
              </View>
              <Text style={styles.timelineDivision}>U19 Nationaux · 44 Matchs · 19 Buts</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineItemContent}>
              <View style={styles.timelineRowTop}>
                <Text style={styles.timelineClub}>Paris FC</Text>
                <Text style={styles.timelineYears}>2020 - 2022</Text>
              </View>
              <Text style={styles.timelineDivision}>Centre de Préformation · 32 Matchs · 14 Buts</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Palmarès & Distinctions en Carrière */}
      <View style={styles.careerSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Palmarès & Titres en Carrière</Text>
        </View>

        <View style={styles.palmaresGrid}>
          <View style={styles.palmaresItem}>
            <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.palmaresTitle}>Champion Régional 2</Text>
            <Text style={styles.palmaresYear}>Saison 2023/2024 · FC ProDay</Text>
          </View>

          <View style={styles.palmaresItem}>
            <MaterialCommunityIcons name="shield-star" size={20} color="#0A84FF" />
            <Text style={styles.palmaresTitle}>Vainqueur Coupe Paris</Text>
            <Text style={styles.palmaresYear}>Édition 2023 · Red Star FC</Text>
          </View>

          <View style={styles.palmaresItem}>
            <MaterialCommunityIcons name="shoe-cleat" size={20} color="#30D158" />
            <Text style={styles.palmaresTitle}>Soulier d'Or U19</Text>
            <Text style={styles.palmaresYear}>19 buts inscrits (2023)</Text>
          </View>
        </View>
      </View>

      {/* Profil Athlétique & Radar 6 Axes */}
      <View style={styles.careerSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attributs de Joueur (Radar 6 Axes)</Text>
          <Text style={styles.sectionSubtitle}>Évalués par les recruteurs & le staff</Text>
        </View>

        <View style={styles.attributesGrid}>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>VITESSE</Text>
            <Text style={[styles.attrVal, { color: '#30D158' }]}>88</Text>
          </View>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>FINITION</Text>
            <Text style={[styles.attrVal, { color: '#FFD700' }]}>85</Text>
          </View>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>DRIBBLE</Text>
            <Text style={[styles.attrVal, { color: '#0A84FF' }]}>86</Text>
          </View>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>VISION</Text>
            <Text style={styles.attrVal}>82</Text>
          </View>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>PHYSIQUE</Text>
            <Text style={styles.attrVal}>78</Text>
          </View>
          <View style={styles.attrPill}>
            <Text style={styles.attrKey}>MENTAL</Text>
            <Text style={styles.attrVal}>84</Text>
          </View>
        </View>
      </View>

      {/* Social Flex Action Button */}
      <TouchableOpacity
        style={styles.socialFlexBtn}
        onPress={() => {
          prodayHaptics.impactMedium();
          setShowStoryModal(true);
        }}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.socialFlexGradient}
        >
          <View style={styles.socialFlexLeft}>
            <View style={styles.socialFlexIcon}>
              <Ionicons name="sparkles" size={18} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.socialFlexTitle}>Exporter ma Story ProDay</Text>
              <Text style={styles.socialFlexSub}>Format 9:16 pour Instagram & TikTok</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Navigation Cards */}
      <View style={styles.quickNavGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab?.('stats')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <Ionicons name="stats-chart" size={18} color="#0A84FF" />
          </View>
          <Text style={styles.quickCardTitle}>Passeport & Stats</Text>
          <Text style={styles.quickCardSub}>CV officiel & QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => onNavigateTab?.('wellness')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <Ionicons name="pulse" size={18} color="#30D158" />
          </View>
          <Text style={styles.quickCardTitle}>Santé & Check-In</Text>
          <Text style={styles.quickCardSub}>Synchronisé coach</Text>
        </TouchableOpacity>
      </View>

      {/* Story Export Modal */}
      <PlayerStoryExportModal
        visible={showStoryModal}
        player={playerData}
        weekendStats={{
          matchTitle: 'J17 · vs RC France',
          result: 'Victoire 2 - 0',
          matchRating: 8.7,
          goals: 2,
          assists: 1,
          distanceKm: 11.2,
          duelsPct: 81,
          minutes: 90,
        }}
        onClose={() => setShowStoryModal(false)}
      />

      {/* Interactive Page Guide Modal */}
      <PlayerPageGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        pageTitle="Cockpit & Carte Officielle"
        pageSubtitle="Ton centre de contrôle joueur ProDay"
        badgeLabel="GUIDE DU COCKPIT"
        badgeColor="#30D158"
        introText="Bienvenue sur ton Cockpit personnel. Cet écran rassemble ton identité sacrée de joueur, ta disponibilité pour le prochain match et tes outils de valorisation."
        sections={guideSections}
        proTip="Mets à jour ton statut RSVP au moins 48h avant la rencontre pour maximiser tes chances de figurer dans le 11 de départ du coach !"
        ctaLabel="C'est parti !"
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 13,
    color: '#94A3B8',
  },
  nameHeader: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerBadges: {
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
    paddingVertical: 5,
    borderRadius: 12,
  },
  guideBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
  },
  futCardSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  cardHint: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  /* Next Match Countdown, Weather & RSVP Widget */
  matchWidgetCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    padding: 14,
    marginVertical: 10,
  },
  matchWidgetTop: {
    marginBottom: 10,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchLiveBadgeText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weatherText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  matchFixtureTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  matchCountdownSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  rsvpSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  rsvpSectionTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rsvpBar: {
    flexDirection: 'row',
    backgroundColor: '#0F1015',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rsvpBtnPresent: {
    backgroundColor: '#30D158',
  },
  rsvpBtnPending: {
    backgroundColor: '#FBBF24',
  },
  rsvpBtnAbsent: {
    backgroundColor: '#FF453A',
  },
  rsvpBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rsvpBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },

  /* Season Gateway Banner */
  seasonBannerBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  seasonBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  seasonBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  seasonBannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonBannerTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  seasonBannerSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },

  /* Career Hero Card */
  careerHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginTop: 14,
  },
  careerHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  careerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  careerTagText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0A84FF',
    letterSpacing: 0.5,
  },
  contractStatusBadge: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  careerHeroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  careerMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  careerMetricVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  careerMetricLbl: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  careerMetricSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  careerMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exportCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  exportCvBtnText: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 8,
  },

  /* Career Sections */
  careerSection: {
    marginTop: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* Timeline */
  timelineList: {
    backgroundColor: '#141418',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#30D158',
    marginTop: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748B',
    marginTop: 4,
  },
  timelineItemContent: {
    flex: 1,
  },
  timelineRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineClub: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineYearsActive: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  timelineYears: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
  },
  timelineDivision: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Palmares */
  palmaresGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  palmaresItem: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 4,
  },
  palmaresTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  palmaresYear: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },

  /* Attributes Radar Grid */
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attrPill: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#141418',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attrKey: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  attrVal: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  socialFlexBtn: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  socialFlexGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  socialFlexLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialFlexIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFlexTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  socialFlexSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  quickNavGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardTitle: {
    fontFamily: Platform.select({ ios: 'SF Pro Display', default: 'System' }),
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickCardSub: {
    fontFamily: Platform.select({ ios: 'SF Pro Text', default: 'System' }),
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
