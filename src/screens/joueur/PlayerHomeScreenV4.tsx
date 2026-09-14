import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { VeoVideoHubScreen } from '../veo/VeoVideoHubScreen';
import { FITNESS_PARK, FITNESS_PARK_RADIUS } from '../../theme/fitnessParkTheme';

interface PlayerHomeScreenV4Props {
  onNavigateTab?: (tabId: string) => void;
  onOpenVideoHub?: () => void;
}

export const PlayerHomeScreenV4: React.FC<PlayerHomeScreenV4Props> = ({
  onNavigateTab,
  onOpenVideoHub,
}) => {
  const profile = useSessionProfile();
  const tabNav = useTabNavigation();
  const userId = profile?.uid || 'player-demo';

  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('present');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [internalVideoHubOpen, setInternalVideoHubOpen] = useState(false);

  const handleOpenVideo = () => {
    if (onOpenVideoHub) {
      onOpenVideoHub();
    } else {
      setInternalVideoHubOpen(true);
    }
  };

  const handleNavigate = (dest: string) => {
    if (onNavigateTab) {
      onNavigateTab(dest);
      return;
    }
    if (dest === 'tactics') {
      tabNav?.openDashboard?.('smart_tactics');
    } else if (dest === 'wellness') {
      tabNav?.openDashboard?.('train');
    } else if (dest === 'profil') {
      tabNav?.setActiveTab?.('profil');
    } else if (dest === 'matchs' || dest === 'calendar') {
      tabNav?.setActiveTab?.('matchs');
    } else if (dest === 'carpool') {
      tabNav?.openCarpool?.();
    }
  };

  useEffect(() => {
    void playerRsvpService.getRsvp(userId, 'match-j17').then(setRsvp);
  }, [userId]);

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    setRsvp(status);
    void playerRsvpService.setRsvp(userId, 'match-j17', status);
  };

  const toggleExpandNews = (id: string) => {
    prodayHaptics.selection();
    setExpandedNewsId((prev) => (prev === id ? null : id));
  };

  const clubNews = [
    {
      id: 'news-1',
      title: 'Préparation derby retour ce dimanche',
      date: 'Hier à 18:30',
      tag: 'MATCH',
      summary: 'Séance vidéo collective vendredi à 19h avant entraînement tactique.',
      fullContent:
        'Le staff a préparé l’analyse vidéo de notre adversaire. Rendez-vous au club-house à 19h précises pour le briefing tactique sur les phases arrêtées. Tenue d’entraînement obligatoire dès l’arrivée.',
    },
    {
      id: 'news-2',
      title: 'Diffusion du dernier match disponible sur VEO',
      date: 'Il y a 2 jours',
      tag: 'VIDÉO VEO',
      summary: 'Le replay intégral de la victoire 3-1 contre AS Meudon est en ligne.',
      fullContent:
        'Retrouvez l’enregistrement de la caméra VEO avec tous les temps forts et les séquences de jeu collectives dans l’onglet Vidéo VEO de votre application.',
    },
    {
      id: 'news-3',
      title: 'Stage de perfectionnement vacances de Pâques',
      date: 'Il y a 4 jours',
      tag: 'CLUB',
      summary: 'Inscriptions ouvertes pour les catégories U14 à Seniors.',
      fullContent:
        'Encadré par les éducateurs diplômés du club avec sessions spécifiques par ligne (attaquants, milieux, défenseurs, gardiens). Places limitées à 30 participants par groupe.',
    },
  ];

  const firstName = (profile?.display_name?.split(' ')[0] || 'Alfred').toUpperCase();
  const category = profile?.profile?.category || 'SENIORS R2';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Athlétique Bleu Électrique Dégradé (Style Officiel Fitness Park) */}
      <LinearGradient
        colors={['#0044CC', '#002673', '#0B0F14']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.topProfileRow}>
          {/* Avatar Cerclé de Blanc */}
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.8}
            onPress={() => handleNavigate('profil')}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {firstName.charAt(0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Titre Hello Athlétique & Statut */}
          <View style={styles.profileTextCol}>
            <Text style={styles.helloTitle}>
              HELLO {firstName}
            </Text>
            <TouchableOpacity
              style={styles.subChevronRow}
              activeOpacity={0.7}
              onPress={() => handleNavigate('profil')}
            >
              <Text style={styles.subStatusText}>
                {category} • FC PRODAY
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Badge Espace Fitness Park (Classic / Gold) */}
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>CLASSIC</Text>
          </View>
        </View>

        {/* Barre de Recherche Globale intégrée au header */}
        <View style={styles.searchBarWrapper}>
          <GlobalSearchBar
            placeholder="Rechercher joueurs, programmes, séances..."
          />
        </View>
      </LinearGradient>

      {/* 2. Section « REJOINS UN PROGRAMME » (Fitness Park Hero Workout Cards) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.athleticSectionTitle}>REJOINS UN PROGRAMME</Text>
        <TouchableOpacity
          onPress={() => handleNavigate('calendar')}
          style={styles.seeAllRow}
        >
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.programsScroll}
      >
        {/* Workout Card 1: HYROX / Derby Match */}
        <TouchableOpacity
          style={styles.programCard}
          activeOpacity={0.9}
          onPress={() => handleNavigate('calendar')}
        >
          <LinearGradient
            colors={['rgba(0, 50, 150, 0.4)', 'rgba(11, 15, 20, 0.95)']}
            style={styles.programCardGradient}
          >
            <View style={styles.programTopCapsule}>
              <Text style={styles.programCapsuleText}>COMPÉTITION R2</Text>
            </View>

            <View style={styles.programBottomContent}>
              <Text style={styles.programCardTitle}>
                DERBY RETOUR : AS MEUDON
              </Text>
              <Text style={styles.programCardMeta}>
                DIMANCHE 15:00 • DOMICILE • J17
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Workout Card 2: Hyrox Fondations Basics */}
        <TouchableOpacity
          style={[styles.programCard, { borderColor: '#1E2F48' }]}
          activeOpacity={0.9}
          onPress={() => handleNavigate('wellness')}
        >
          <LinearGradient
            colors={['rgba(255, 140, 0, 0.35)', 'rgba(11, 15, 20, 0.95)']}
            style={styles.programCardGradient}
          >
            <View style={[styles.programTopCapsule, { backgroundColor: 'rgba(255, 210, 0, 0.25)' }]}>
              <Text style={[styles.programCapsuleText, { color: FITNESS_PARK.accentYellow }]}>
                PRÉPA PHYSIQUE
              </Text>
            </View>

            <View style={styles.programBottomContent}>
              <Text style={styles.programCardTitle}>
                HYROX FONDATIONS BASICS
              </Text>
              <Text style={styles.programCardMeta}>
                1-4 • INTERMÉDIAIRE • 60 MIN
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* 3. Prochain Événement & Bandeau RSVP 1-Tap (Style Sombre Fitness Park) */}
      <View style={styles.nextEventCard}>
        <View style={styles.nextEventHeader}>
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>PROCHAIN MATCH • J17</Text>
          </View>
          <Text style={styles.eventCountdown}>Dimanche • 15:00</Text>
        </View>

        <View style={styles.matchupRow}>
          <View style={styles.teamCol}>
            <View style={styles.teamLogoPlaceHolder}>
              <Text style={styles.teamLogoLetter}>P</Text>
            </View>
            <Text style={styles.teamName}>FC ProDay</Text>
          </View>

          <View style={styles.vsCol}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.matchVenue}>Domicile • Stade Municipal</Text>
          </View>

          <View style={styles.teamCol}>
            <View style={[styles.teamLogoPlaceHolder, { backgroundColor: '#1E2838' }]}>
              <Text style={[styles.teamLogoLetter, { color: '#94A3B8' }]}>V</Text>
            </View>
            <Text style={styles.teamName}>FC Versailles</Text>
          </View>
        </View>

        {/* 1-Tap RSVP Pill Banner */}
        <View style={styles.rsvpBannerContainer}>
          <Text style={styles.rsvpBannerTitle}>Ta présence pour ce match :</Text>
          <View style={styles.rsvpButtonsRow}>
            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                rsvp === 'present' && styles.rsvpBtnPresentActive,
              ]}
              onPress={() => handleRsvpChange('present')}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={rsvp === 'present' ? '#FFFFFF' : '#10B981'}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  rsvp === 'present' && styles.rsvpBtnTextActive,
                ]}
              >
                Présent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                rsvp === 'uncertain' && styles.rsvpBtnUncertainActive,
              ]}
              onPress={() => handleRsvpChange('uncertain')}
            >
              <Ionicons
                name="help-circle"
                size={16}
                color={rsvp === 'uncertain' ? '#FFFFFF' : '#F59E0B'}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  rsvp === 'uncertain' && styles.rsvpBtnTextActive,
                ]}
              >
                Incertain
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rsvpBtn,
                rsvp === 'absent' && styles.rsvpBtnAbsentActive,
              ]}
              onPress={() => handleRsvpChange('absent')}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={rsvp === 'absent' ? '#FFFFFF' : '#EF4444'}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  rsvp === 'absent' && styles.rsvpBtnTextActive,
                ]}
              >
                Absent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. Carrousel Horizontal (Dernière note, Score, Covoiturage) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performances & Équipe</Text>
        <Text style={styles.sectionSub}>Dernière journée (J16)</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselScroll}
      >
        {/* Tuile 1: Note Match */}
        <TouchableOpacity
          style={styles.carouselTile}
          activeOpacity={0.85}
          onPress={() => handleNavigate('profil')}
        >
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>NOTE DE MATCH</Text>
            <View style={styles.momBadge}>
              <Text style={styles.momBadgeText}>HOMME DU MATCH</Text>
            </View>
          </View>
          <Text style={styles.tileBigRating}>8.5<Text style={styles.tileBigRatingDenom}>/10</Text></Text>
          <Text style={styles.tileSub}>2 buts inscrits vs AS Meudon</Text>
        </TouchableOpacity>

        {/* Tuile 2: Score équipe */}
        <TouchableOpacity
          style={styles.carouselTile}
          activeOpacity={0.85}
          onPress={() => handleNavigate('matchs')}
        >
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>RÉSULTAT ÉQUIPE</Text>
            <View style={[styles.momBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.momBadgeText, { color: '#10B981' }]}>VICTOIRE</Text>
            </View>
          </View>
          <Text style={styles.tileBigScore}>3 - 1</Text>
          <Text style={styles.tileSub}>+3 pts • 2e place au classement</Text>
        </TouchableOpacity>

        {/* Tuile 3: Covoiturage */}
        <TouchableOpacity
          style={styles.carouselTile}
          activeOpacity={0.85}
          onPress={() => handleNavigate('carpool')}
        >
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>COVOITURAGE J17</Text>
            <Ionicons name="car-outline" size={18} color="#0066FF" />
          </View>
          <Text style={styles.tileCarpoolNumber}>2 places</Text>
          <Text style={styles.tileSub}>Dispo avec Thomas • Départ 13:45</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 5. Raccourcis Tactique & Santé */}
      <View style={styles.fitnessGrid}>
        <TouchableOpacity
          style={styles.fitnessCard}
          onPress={() => handleNavigate('tactics')}
          activeOpacity={0.85}
        >
          <View style={[styles.fitnessIconCircle, { backgroundColor: 'rgba(0, 102, 255, 0.2)' }]}>
            <Ionicons name="git-network-outline" size={22} color="#38BDF8" />
          </View>
          <Text style={styles.fitnessCardTitle}>Consignes tactiques</Text>
          <Text style={styles.fitnessCardSub}>Voir le plan de jeu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fitnessCard}
          onPress={() => handleNavigate('wellness')}
          activeOpacity={0.85}
        >
          <View style={[styles.fitnessIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="fitness-outline" size={22} color="#F87171" />
          </View>
          <Text style={styles.fitnessCardTitle}>Charge & Récupération</Text>
          <Text style={styles.fitnessCardSub}>Bilan de santé</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Fil d'actualité Club Dépliable */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actualités du club</Text>
        <Text style={styles.sectionSub}>Déplier pour tout lire</Text>
      </View>

      <View style={styles.newsList}>
        {clubNews.map((news) => {
          const isExpanded = expandedNewsId === news.id;
          return (
            <TouchableOpacity
              key={news.id}
              style={styles.newsCard}
              activeOpacity={0.9}
              onPress={() => toggleExpandNews(news.id)}
            >
              <View style={styles.newsCardHeader}>
                <View style={styles.newsBadge}>
                  <Text style={styles.newsBadgeText}>{news.tag}</Text>
                </View>
                <Text style={styles.newsDate}>{news.date}</Text>
              </View>

              <Text style={styles.newsTitle}>{news.title}</Text>
              <Text style={styles.newsSummary}>{news.summary}</Text>

              {isExpanded && (
                <View style={styles.newsExpandedContent}>
                  <Text style={styles.newsFullText}>{news.fullContent}</Text>
                  {news.tag === 'VIDÉO VEO' && (
                    <TouchableOpacity
                      style={styles.newsActionBtn}
                      onPress={handleOpenVideo}
                    >
                      <Ionicons name="play-circle-outline" size={16} color="#0B0F14" />
                      <Text style={styles.newsActionBtnText}>Ouvrir le lecteur VEO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.newsFooter}>
                <Text style={styles.newsToggleText}>
                  {isExpanded ? 'Réduire' : 'Lire la suite'}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={FITNESS_PARK.accentYellow}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Hub Vidéo VEO */}
      <Modal
        visible={internalVideoHubOpen}
        animationType="slide"
        onRequestClose={() => setInternalVideoHubOpen(false)}
      >
        <VeoVideoHubScreen onBack={() => setInternalVideoHubOpen(false)} />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FITNESS_PARK.bg,
  },
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  heroGradient: {
    paddingTop: Platform.select({ ios: 16, android: 16, default: 20 }),
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 16,
  },
  topProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#161F2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E2838',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  profileTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  helloTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.2,
  },
  planBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planBadgeText: {
    color: '#0B0F14',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchBarWrapper: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  athleticSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  seeAllRow: {
    padding: 4,
  },
  programsScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  programCard: {
    width: 280,
    height: 170,
    borderRadius: FITNESS_PARK_RADIUS.cardLarge,
    overflow: 'hidden',
    backgroundColor: FITNESS_PARK.surface,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  programCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  programTopCapsule: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 102, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  programCapsuleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  programBottomContent: {
    gap: 4,
  },
  programCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  programCardMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  nextEventCard: {
    marginHorizontal: 16,
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 14,
  },
  nextEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventBadge: {
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventBadgeText: {
    color: FITNESS_PARK.accentYellow,
    fontSize: 11,
    fontWeight: '800',
  },
  eventCountdown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamLogoPlaceHolder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0044CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamLogoLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  vsCol: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  matchVenue: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  rsvpBannerContainer: {
    borderTopWidth: 1,
    borderTopColor: FITNESS_PARK.divider,
    paddingTop: 12,
    gap: 8,
  },
  rsvpBannerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E2838',
    borderWidth: 1,
    borderColor: '#28374D',
  },
  rsvpBtnPresentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  rsvpBtnUncertainActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  rsvpBtnAbsentActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  rsvpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  rsvpBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  carouselScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  carouselTile: {
    width: 200,
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 14,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 6,
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  momBadge: {
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  momBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: FITNESS_PARK.accentYellow,
  },
  tileBigRating: {
    fontSize: 28,
    fontWeight: '900',
    color: FITNESS_PARK.accentYellow,
  },
  tileBigRatingDenom: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tileBigScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
  },
  tileCarpoolNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38BDF8',
  },
  tileSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fitnessGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  fitnessCard: {
    flex: 1,
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 14,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 6,
  },
  fitnessIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fitnessCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fitnessCardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  newsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  newsCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 14,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 6,
  },
  newsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsBadge: {
    backgroundColor: 'rgba(0, 102, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  newsDate: {
    fontSize: 11,
    color: '#64748B',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newsSummary: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  newsExpandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: FITNESS_PARK.divider,
    gap: 8,
  },
  newsFullText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  newsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  newsActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B0F14',
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  newsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: FITNESS_PARK.accentYellow,
  },
});
