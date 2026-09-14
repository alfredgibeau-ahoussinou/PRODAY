import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { playerRsvpService, type PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';

interface PlayerHomeScreenV4Props {
  onNavigateTab?: (tabId: string) => void;
  onOpenVideoHub?: () => void;
}

export const PlayerHomeScreenV4: React.FC<PlayerHomeScreenV4Props> = ({
  onNavigateTab,
  onOpenVideoHub,
}) => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-demo';

  const [rsvp, setRsvp] = useState<PlayerRsvpStatus>('present');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Recherche Globale */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>
              {profile?.profile?.category || 'Seniors R2'} • FC ProDay
            </Text>
            <Text style={styles.greetingTitle}>
              Bonjour, {profile?.display_name?.split(' ')[0] || 'Joueur'}
            </Text>
          </View>
          <View style={styles.fitnessShapeBadge}>
            <Ionicons name="flame" size={16} color="#EA580C" />
            <Text style={styles.fitnessShapeText}>Forme 92%</Text>
          </View>
        </View>

        <GlobalSearchBar
          placeholder="Rechercher joueurs, clubs, pages..."
        />
      </View>

      {/* 2. Prochain Événement & Bandeau RSVP 1-Tap */}
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
            <View style={[styles.teamLogoPlaceHolder, { backgroundColor: '#E2E8F0' }]}>
              <Text style={[styles.teamLogoLetter, { color: '#0F172A' }]}>V</Text>
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
                color={rsvp === 'present' ? '#FFFFFF' : '#16A34A'}
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
                color={rsvp === 'uncertain' ? '#FFFFFF' : '#D97706'}
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
                color={rsvp === 'absent' ? '#FFFFFF' : '#DC2626'}
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

      {/* 3. Carrousel Horizontal (Dernière note, Score, Covoiturage) */}
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
        <View style={styles.carouselTile}>
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>NOTE DE MATCH</Text>
            <View style={styles.momBadge}>
              <Text style={styles.momBadgeText}>HOMME DU MATCH</Text>
            </View>
          </View>
          <Text style={styles.tileBigRating}>8.5<Text style={styles.tileBigRatingDenom}>/10</Text></Text>
          <Text style={styles.tileSub}>2 buts inscrits vs AS Meudon</Text>
        </View>

        {/* Tuile 2: Score équipe */}
        <View style={styles.carouselTile}>
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>RÉSULTAT ÉQUIPE</Text>
            <View style={[styles.momBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.momBadgeText, { color: '#16A34A' }]}>VICTOIRE</Text>
            </View>
          </View>
          <Text style={styles.tileBigScore}>3 - 1</Text>
          <Text style={styles.tileSub}>+3 pts • 2e place au classement</Text>
        </View>

        {/* Tuile 3: Covoiturage */}
        <View style={styles.carouselTile}>
          <View style={styles.tileTopRow}>
            <Text style={styles.tileCategory}>COVOITURAGE J17</Text>
            <Ionicons name="car-outline" size={18} color="#0284C7" />
          </View>
          <Text style={styles.tileCarpoolNumber}>2 places</Text>
          <Text style={styles.tileSub}>Dispo avec Thomas • Départ 13:45</Text>
        </View>
      </ScrollView>

      {/* 4. Raccourcis Pratique Sportive Fitness Park */}
      <View style={styles.fitnessGrid}>
        <TouchableOpacity
          style={styles.fitnessCard}
          onPress={() => onNavigateTab?.('tactics')}
        >
          <View style={[styles.fitnessIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="git-network-outline" size={22} color="#0284C7" />
          </View>
          <Text style={styles.fitnessCardTitle}>Consignes tactiques</Text>
          <Text style={styles.fitnessCardSub}>Voir le plan de jeu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fitnessCard}
          onPress={() => onNavigateTab?.('wellness')}
        >
          <View style={[styles.fitnessIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="fitness-outline" size={22} color="#DC2626" />
          </View>
          <Text style={styles.fitnessCardTitle}>Charge & Récupération</Text>
          <Text style={styles.fitnessCardSub}>Bilan de santé</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Fil d'actualité Club Dépliable */}
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
                  {news.tag === 'VIDÉO VEO' && onOpenVideoHub && (
                    <TouchableOpacity
                      style={styles.newsActionBtn}
                      onPress={onOpenVideoHub}
                    >
                      <Ionicons name="play-circle-outline" size={16} color="#FFFFFF" />
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
                  color="#0284C7"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  fitnessShapeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fitnessShapeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  nextEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  nextEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventCountdown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  vsCol: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  matchVenue: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  rsvpBannerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  rsvpBannerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rsvpBtnPresentActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  rsvpBtnUncertainActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  rsvpBtnAbsentActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  rsvpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  rsvpBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  carouselScroll: {
    gap: 12,
    paddingRight: 16,
  },
  carouselTile: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
  },
  momBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  momBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  tileBigRating: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D97706',
  },
  tileBigRatingDenom: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tileBigScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#16A34A',
  },
  tileCarpoolNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0284C7',
  },
  tileSub: {
    fontSize: 11,
    color: '#64748B',
  },
  fitnessGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fitnessCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  fitnessCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  newsList: {
    gap: 10,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  newsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  newsDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  newsSummary: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  newsExpandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  newsFullText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  newsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  newsActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontWeight: '600',
    color: '#0284C7',
  },
});
