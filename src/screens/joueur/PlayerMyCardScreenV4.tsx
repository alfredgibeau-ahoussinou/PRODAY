import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { PlayerCardReveal } from '../../components/joueur/PlayerCardReveal';
import { userToProDayCard } from '../../utils/prodayFutCard';
import type { ProDayPlayerCardData } from '../../models/ProDayCard';
import { PlayerStoryExportModal } from '../../components/player/PlayerStoryExportModal';
import { ProDayVideoPlayer } from '../../components/video/ProDayVideoPlayer';
import { FITNESS_PARK, FITNESS_PARK_RADIUS } from '../../theme/fitnessParkTheme';

type SofascoreTab = 'club_services' | 'resume' | 'stats_saison' | 'matchs' | 'historique_ovr';

export const PlayerMyCardScreenV4: React.FC = () => {
  const profile = useSessionProfile();
  const userId = profile?.uid || 'player-v4-demo';

  const [activeTab, setActiveTab] = useState<SofascoreTab>('resume');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedVideoModal, setSelectedVideoModal] = useState<{
    visible: boolean;
    title: string;
    streamUrl?: string;
  }>({ visible: false, title: '' });

  const cardData: ProDayPlayerCardData = React.useMemo(() => {
    const fallbackUser: any = {
      uid: userId,
      display_name: 'Kylian Perez',
      email: 'kylian@proday.com',
      role: 'player',
      profile: {
        position: 'BU',
      },
    };
    return userToProDayCard(profile || fallbackUser, {
      clubName: 'FC ProDay',
      matches: 18,
      goals: 14,
      assists: 8,
      overall: 87,
      tier: 'gold',
      formPct: 89,
      primaryPosition: profile?.profile?.position || 'BU',
    });
  }, [profile, userId]);

  const kpis = [
    { id: 'goals', label: 'Buts', value: '14', icon: 'football-outline', color: '#10B981', sub: '2e du champ.' },
    { id: 'assists', label: 'Passes D', value: '8', icon: 'git-pull-request-outline', color: '#38BDF8', sub: 'Top 5 ligue' },
    { id: 'matches', label: 'Matchs joués', value: '18', icon: 'time-outline', color: '#A78BFA', sub: '1 420 min' },
    { id: 'rating', label: 'Note moyenne', value: '7.9', icon: 'star-outline', color: FITNESS_PARK.accentYellow, sub: 'Staff certifié' },
    { id: 'attendance', label: 'Présence', value: '94%', icon: 'checkmark-done-outline', color: '#10B981', sub: '24/25 séances' },
  ];

  const seasonComparisons = [
    { label: 'Duels offensifs gagnés', playerVal: 68, squadAvg: 54, unit: '%' },
    { label: 'Précision des passes', playerVal: 84, squadAvg: 76, unit: '%' },
    { label: 'Tirs cadrés', playerVal: 62, squadAvg: 48, unit: '%' },
    { label: 'Ballons récupérés / match', playerVal: 5.2, squadAvg: 3.8, unit: '', maxVal: 8 },
    { label: 'Distance moyenne', playerVal: 10.4, squadAvg: 9.6, unit: 'km', maxVal: 13 },
  ];

  const matchHistory = [
    {
      id: 'm1',
      matchDay: 'J16',
      date: 'Dim. 8 Mars',
      opponent: 'AS Meudon',
      score: '3 - 1',
      rating: 8.5,
      goals: 2,
      assists: 0,
      veoAvailable: true,
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      aiClips: [
        { id: 'c1', label: '⚽ But lucarne (34’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=2040,2072' },
        { id: 'c2', label: '⚽ Doublé tête (78’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=4680,4705' },
      ],
    },
    {
      id: 'm2',
      matchDay: 'J15',
      date: 'Dim. 1 Mars',
      opponent: 'ES Colombes',
      score: '2 - 2',
      rating: 7.8,
      goals: 1,
      assists: 1,
      veoAvailable: true,
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      aiClips: [
        { id: 'c3', label: '⚽ But égalisateur (52’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=3120,3145' },
        { id: 'c4', label: '👟 Passe D (61’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=3660,3688' },
      ],
    },
    {
      id: 'm3',
      matchDay: 'J14',
      date: 'Sam. 22 Fév.',
      opponent: 'FC Rueil',
      score: '4 - 0',
      rating: 8.2,
      goals: 2,
      assists: 2,
      veoAvailable: true,
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      aiClips: [
        { id: 'c5', label: '🎯 Frappe cadrée (12’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=740,765' },
        { id: 'c6', label: '⚡ Transition express (28’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=1680,1705' },
      ],
    },
    {
      id: 'm4',
      matchDay: 'J13',
      date: 'Dim. 15 Fév.',
      opponent: 'US Suresnes',
      score: '1 - 0',
      rating: 7.4,
      goals: 0,
      assists: 1,
      veoAvailable: false,
    },
    {
      id: 'm5',
      matchDay: 'J12',
      date: 'Dim. 8 Fév.',
      opponent: 'Racing CFF',
      score: '2 - 1',
      rating: 8.0,
      goals: 1,
      assists: 0,
      veoAvailable: true,
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      aiClips: [
        { id: 'c7', label: '⚽ But victoire (84’)', clipUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8#t=5040,5068' },
      ],
    },
  ];

  const ovrMilestones = [
    { period: 'Début de saison (Septembre)', ovr: 78, delta: '+0', note: 'Titularisation en R2' },
    { period: 'Fin de phase aller (Décembre)', ovr: 82, delta: '+4', note: 'Série de 5 buts en 4 matchs' },
    { period: 'Reprise hivernale (Février)', ovr: 85, delta: '+3', note: 'Impact physique et constance' },
    { period: 'Actuel (Mars 2026)', ovr: 87, delta: '+2', isCurrent: true, note: 'Palier Élite Or atteint' },
    { period: 'Objectif palier suivant', ovr: 89, delta: '+2', isFuture: true, note: 'Palier Maître de zone' },
  ];

  const openCall = () => {
    void Linking.openURL('tel:0145678900');
  };

  const openMap = () => {
    const address = 'Complexe Sportif ProDay, 92100 Boulogne-Billancourt';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    });
    if (url) void Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Carte Club & Statut Adhérent (Style Officiel Fitness Park - Image 4) */}
      <View style={styles.clubCardContainer}>
        <View style={styles.clubHeaderRow}>
          <View style={styles.clubLogoCircle}>
            <Text style={styles.clubLogoText}>P</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.clubTitleRow}>
              <Text style={styles.clubName}>FC PRODAY</Text>
              <View style={styles.clubPillBadge}>
                <Text style={styles.clubPillBadgeText}>ULTIMATE</Text>
              </View>
            </View>
            <Text style={styles.clubAddress}>
              Complexe Sportif ProDay • 92100 Boulogne
            </Text>
            <Text style={styles.clubHours}>
              Ouvert lun-dim 06h - 23h • Équipe Seniors R2
            </Text>
          </View>
        </View>

        {/* Rangée de boutons contacts / réseaux sociaux (Image 4) */}
        <View style={styles.socialChipsRow}>
          <TouchableOpacity style={styles.contactChip} onPress={openCall} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={15} color="#FFFFFF" />
            <Text style={styles.contactChipText}>Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactChip}
            onPress={() => void Linking.openURL('https://instagram.com')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-instagram" size={15} color="#FFFFFF" />
            <Text style={styles.contactChipText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactChip}
            onPress={() => void Linking.openURL('https://facebook.com')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-facebook" size={15} color="#FFFFFF" />
            <Text style={styles.contactChipText}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactChip} onPress={openMap} activeOpacity={0.8}>
            <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
            <Text style={styles.contactChipText}>Itinéraire</Text>
          </TouchableOpacity>
        </View>

        {/* Services Cartes Club Fitness Park (Le Shop & VEO) */}
        <View style={styles.clubServicesGrid}>
          <TouchableOpacity
            style={styles.clubServiceCard}
            activeOpacity={0.85}
            onPress={() => void Linking.openURL('https://proday.shop')}
          >
            <Ionicons name="shirt-outline" size={20} color={FITNESS_PARK.accentYellow} />
            <Text style={styles.clubServiceTitle}>LE SHOP DU CLUB</Text>
            <Text style={styles.clubServiceSub}>Maillots & Équipements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clubServiceCard}
            activeOpacity={0.85}
            onPress={() => {
              prodayHaptics.impactMedium();
              setSelectedVideoModal({
                visible: true,
                title: 'Caméra VEO Club en Direct',
                streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              });
            }}
          >
            <Ionicons name="videocam-outline" size={20} color="#38BDF8" />
            <Text style={styles.clubServiceTitle}>VIDÉO VEO CONNECTÉE</Text>
            <Text style={styles.clubServiceSub}>Direct terrain d'honneur</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Gamified FUT Card & Flex & Share */}
      <View style={styles.cardSection}>
        <PlayerCardReveal
          card={cardData}
          width={260}
        />

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            prodayHaptics.impactMedium();
            setShowStoryModal(true);
          }}
        >
          <Ionicons name="sparkles" size={17} color="#0B0F14" />
          <Text style={styles.shareBtnText}>Flex & Share (Story 9:16 & Image HD)</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Onglets Sofascore Style Fitness Park */}
      <View style={styles.tabsRail}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'resume' && styles.tabChipActive]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveTab('resume');
          }}
        >
          <Text style={[styles.tabChipText, activeTab === 'resume' && styles.tabChipTextActive]}>
            Résumé
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'stats_saison' && styles.tabChipActive]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveTab('stats_saison');
          }}
        >
          <Text
            style={[
              styles.tabChipText,
              activeTab === 'stats_saison' && styles.tabChipTextActive,
            ]}
          >
            Stats saison
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'matchs' && styles.tabChipActive]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveTab('matchs');
          }}
        >
          <Text style={[styles.tabChipText, activeTab === 'matchs' && styles.tabChipTextActive]}>
            Matchs & VEO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'historique_ovr' && styles.tabChipActive]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveTab('historique_ovr');
          }}
        >
          <Text
            style={[
              styles.tabChipText,
              activeTab === 'historique_ovr' && styles.tabChipTextActive,
            ]}
          >
            Progression
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Contenu des Onglets */}
      <View style={styles.tabContentArea}>
        {/* Onglet 1: Résumé (Grille 5 KPIs) */}
        {activeTab === 'resume' && (
          <View style={styles.kpiGrid}>
            {kpis.map((kpi, idx) => {
              const isFifth = idx === 4;
              return (
                <View
                  key={kpi.id}
                  style={[
                    styles.kpiBox,
                    isFifth && styles.kpiBoxFullWidth,
                  ]}
                >
                  <View style={styles.kpiHeaderRow}>
                    <Ionicons name={kpi.icon as any} size={18} color={kpi.color} />
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  </View>
                  <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
                  <Text style={styles.kpiSub}>{kpi.sub}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Onglet 2: Stats de saison */}
        {activeTab === 'stats_saison' && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsHeaderTitle}>Comparaison au poste ({cardData.primaryPosition})</Text>
              <View style={styles.statsLegend}>
                <View style={styles.legendDotPlayer} />
                <Text style={styles.legendText}>Toi</Text>
                <View style={styles.legendDotSquad} />
                <Text style={styles.legendText}>Moyenne équipe</Text>
              </View>
            </View>

            {seasonComparisons.map((item, idx) => {
              const max = item.maxVal || 100;
              const playerPercent = Math.min(100, Math.round((item.playerVal / max) * 100));
              const squadPercent = Math.min(100, Math.round((item.squadAvg / max) * 100));

              return (
                <View key={idx} style={styles.compareRow}>
                  <View style={styles.compareLabels}>
                    <Text style={styles.compareName}>{item.label}</Text>
                    <Text style={styles.compareValue}>
                      {item.playerVal}
                      {item.unit} <Text style={{ color: '#64748B', fontSize: 12 }}>({item.squadAvg}{item.unit})</Text>
                    </Text>
                  </View>
                  <View style={styles.compareBarContainer}>
                    <View style={[styles.compareBarSquad, { width: `${squadPercent}%` }]} />
                    <View style={[styles.compareBarPlayer, { width: `${playerPercent}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Onglet 3: Match par match & Replays VEO */}
        {activeTab === 'matchs' && (
          <View style={styles.matchList}>
            {matchHistory.map((m) => (
              <View key={m.id} style={styles.matchCard}>
                <View style={styles.matchCardTopRow}>
                  <View style={styles.matchCardLeft}>
                    <View style={styles.matchDayBadge}>
                      <Text style={styles.matchDayText}>{m.matchDay}</Text>
                    </View>
                    <View>
                      <Text style={styles.matchOpponent}>{m.opponent}</Text>
                      <Text style={styles.matchDate}>{m.date}</Text>
                    </View>
                  </View>

                  <View style={styles.matchCardCenter}>
                    <Text style={styles.matchScore}>{m.score}</Text>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={11} color={FITNESS_PARK.accentYellow} />
                      <Text style={styles.ratingText}>{m.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.matchCardRight}>
                    {m.veoAvailable ? (
                      <TouchableOpacity
                        style={styles.veoClipBtn}
                        onPress={() => {
                          prodayHaptics.impactMedium();
                          setSelectedVideoModal({
                            visible: true,
                            title: `Match Complet ${m.matchDay} vs ${m.opponent}`,
                            streamUrl: m.streamUrl,
                          });
                        }}
                      >
                        <Ionicons name="play" size={14} color="#0B0F14" />
                        <Text style={styles.veoClipBtnText}>VEO</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noVeoText}>Sans vidéo</Text>
                    )}
                  </View>
                </View>

                {m.aiClips && m.aiClips.length > 0 && (
                  <View style={styles.aiClipsContainer}>
                    <View style={styles.aiClipsHeader}>
                      <MaterialCommunityIcons name="auto-fix" size={12} color={FITNESS_PARK.accentYellow} />
                      <Text style={styles.aiClipsTitle}>Clips IA découpés ({m.aiClips.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {m.aiClips.map((clip) => (
                        <TouchableOpacity
                          key={clip.id}
                          style={styles.clipChip}
                          onPress={() => {
                            prodayHaptics.impactMedium();
                            setSelectedVideoModal({
                              visible: true,
                              title: `${clip.label} · ${m.matchDay} vs ${m.opponent}`,
                              streamUrl: clip.clipUrl,
                            });
                          }}
                        >
                          <Ionicons name="play" size={10} color={FITNESS_PARK.accentYellow} />
                          <Text style={styles.clipChipText}>{clip.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Onglet 4: Progression OVR */}
        {activeTab === 'historique_ovr' && (
          <View style={styles.ovrTimelineCard}>
            <View style={styles.ovrHeroRow}>
              <View>
                <Text style={styles.ovrHeroLabel}>OVR Actuel</Text>
                <Text style={styles.ovrHeroValue}>87</Text>
              </View>
              <View style={styles.ovrProgressionBadge}>
                <Ionicons name="trending-up" size={18} color="#10B981" />
                <Text style={styles.ovrProgressionText}>+9 pts cette saison</Text>
              </View>
            </View>

            <View style={styles.timelineList}>
              {ovrMilestones.map((ms, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineNodeCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        ms.isCurrent && styles.timelineDotCurrent,
                        ms.isFuture && styles.timelineDotFuture,
                      ]}
                    />
                    {idx < ovrMilestones.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineInfo}>
                    <View style={styles.timelineTitleRow}>
                      <Text
                        style={[
                          styles.timelinePeriod,
                          ms.isCurrent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {ms.period}
                      </Text>
                      <Text
                        style={[
                          styles.timelineOvr,
                          ms.isCurrent && { color: FITNESS_PARK.accentYellow },
                        ]}
                      >
                        {ms.ovr} OVR
                      </Text>
                    </View>
                    <Text style={styles.timelineNote}>{ms.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Story 9:16 Export Modal */}
      <PlayerStoryExportModal
        visible={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        player={{
          id: cardData.id,
          name: cardData.displayName,
          pos: cardData.primaryPosition,
          ovr: cardData.overall,
          clubName: cardData.clubName,
          pac: 88,
          sho: 85,
          pas: 82,
          dri: 87,
          def: 45,
          phy: 80,
          goals: cardData.goals,
          assists: cardData.assists,
          matchesPlayed: cardData.matches,
        }}
        weekendStats={{
          matchTitle: 'J16 · vs AS Meudon',
          result: 'Victoire 3 - 1',
          matchRating: 8.5,
          goals: 2,
          assists: 1,
          distanceKm: 10.4,
          duelsPct: 78,
          minutes: 90,
        }}
      />

      {/* Player VEO Clip Modal */}
      <Modal
        visible={selectedVideoModal.visible}
        animationType="slide"
        onRequestClose={() =>
          setSelectedVideoModal({ visible: false, title: '' })
        }
      >
        <View style={styles.videoModalRoot}>
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitle}>
              Diffusion VEO — {selectedVideoModal.title}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedVideoModal({ visible: false, title: '' })
              }
              style={styles.videoModalCloseBtn}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.videoModalBody}>
            <ProDayVideoPlayer
              streamUrl={selectedVideoModal.streamUrl}
              videoType="replay"
              title={selectedVideoModal.title}
              opponent="Adversaire officiel"
              isLive={false}
            />
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  clubCardContainer: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 14,
  },
  clubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0044CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clubLogoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  clubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  clubPillBadge: {
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  clubPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0B0F14',
    letterSpacing: 0.5,
  },
  clubAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  clubHours: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  socialChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E2838',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28374D',
  },
  contactChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clubServicesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  clubServiceCard: {
    flex: 1,
    backgroundColor: '#1E2838',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#28374D',
    gap: 4,
  },
  clubServiceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  clubServiceSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  cardSection: {
    alignItems: 'center',
    gap: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 360,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0F14',
  },
  tabsRail: {
    flexDirection: 'row',
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 4,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: '#1E2838',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellow,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabChipTextActive: {
    color: FITNESS_PARK.accentYellow,
    fontWeight: '800',
  },
  tabContentArea: {
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiBox: {
    width: '48%',
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 6,
  },
  kpiBoxFullWidth: {
    width: '100%',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
  },
  statsCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
    paddingBottom: 10,
  },
  statsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotPlayer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0066FF',
  },
  legendDotSquad: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
    marginLeft: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  compareRow: {
    gap: 6,
  },
  compareLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareName: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  compareValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  compareBarContainer: {
    height: 10,
    backgroundColor: '#1E2838',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  compareBarSquad: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#334155',
  },
  compareBarPlayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0066FF',
  },
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 14,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
  },
  matchCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiClipsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: FITNESS_PARK.divider,
  },
  aiClipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  aiClipsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  clipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clipChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: FITNESS_PARK.accentYellow,
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1.5,
  },
  matchDayBadge: {
    backgroundColor: '#1E2838',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchOpponent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matchDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  matchCardCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  matchScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 210, 0, 0.15)',
    borderWidth: 1,
    borderColor: FITNESS_PARK.accentYellowBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: FITNESS_PARK.accentYellow,
  },
  matchCardRight: {
    alignItems: 'flex-end',
    width: 60,
  },
  veoClipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FITNESS_PARK.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  veoClipBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B0F14',
  },
  noVeoText: {
    fontSize: 11,
    color: '#64748B',
  },
  ovrTimelineCard: {
    backgroundColor: FITNESS_PARK.surface,
    borderRadius: FITNESS_PARK_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: FITNESS_PARK.border,
    gap: 16,
  },
  ovrHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: FITNESS_PARK.divider,
    paddingBottom: 14,
  },
  ovrHeroLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  ovrHeroValue: {
    fontSize: 34,
    fontWeight: '900',
    color: FITNESS_PARK.accentYellow,
  },
  ovrProgressionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ovrProgressionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066FF',
    marginTop: 4,
  },
  timelineDotCurrent: {
    backgroundColor: FITNESS_PARK.accentYellow,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotFuture: {
    backgroundColor: '#334155',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#28374D',
    minHeight: 28,
  },
  timelineInfo: {
    flex: 1,
    paddingBottom: 16,
    gap: 2,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelinePeriod: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timelineOvr: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineNote: {
    fontSize: 11,
    color: '#64748B',
  },
  videoModalRoot: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 12,
    backgroundColor: '#161F2C',
  },
  videoModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoModalCloseBtn: {
    padding: 6,
  },
  videoModalBody: {
    flex: 1,
    padding: 16,
  },
});
