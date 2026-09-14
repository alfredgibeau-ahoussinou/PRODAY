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

type SofascoreTab = 'resume' | 'stats_saison' | 'matchs' | 'historique_ovr';

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
    { id: 'assists', label: 'Passes D', value: '8', icon: 'git-pull-request-outline', color: '#0EA5E9', sub: 'Top 5 ligue' },
    { id: 'matches', label: 'Matchs joués', value: '18', icon: 'time-outline', color: '#8B5CF6', sub: '1 420 min' },
    { id: 'rating', label: 'Note moyenne', value: '7.9', icon: 'star-outline', color: '#F59E0B', sub: 'Staff certifié' },
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Gamified FUT Card */}
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
          <Ionicons name="sparkles" size={17} color="#0F172A" />
          <Text style={styles.shareBtnText}>Flex & Share (Story 9:16 & Image HD)</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Sofascore-style Horizontal Tabs */}
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
            Match par match
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
            Historique OVR
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tab Content */}
      <View style={styles.tabContentArea}>
        {/* Onglet 1: Résumé (Grille stricte de 5 cases sans case vide orpheline) */}
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

        {/* Onglet 2: Stats de saison (Barres vs moyenne équipe) */}
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

        {/* Onglet 3: Match par match (avec déclencheur VEO et clips IA) */}
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
                      <Ionicons name="star" size={11} color="#F59E0B" />
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
                        <Ionicons name="play" size={14} color="#FFFFFF" />
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
                      <MaterialCommunityIcons name="auto-fix" size={12} color="#C5A059" />
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
                          <Ionicons name="play" size={10} color="#C5A059" />
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

        {/* Onglet 4: Historique OVR */}
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
                          ms.isCurrent && { color: '#0F172A', fontWeight: '800' },
                        ]}
                      >
                        {ms.period}
                      </Text>
                      <Text
                        style={[
                          styles.timelineOvr,
                          ms.isCurrent && { color: '#0284C7' },
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
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
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 360,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsRail: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#0F172A',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  statsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
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
    backgroundColor: '#0284C7',
  },
  legendDotSquad: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginLeft: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
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
    color: '#334155',
    fontWeight: '500',
  },
  compareValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  compareBarContainer: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  compareBarSquad: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#CBD5E1',
  },
  compareBarPlayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0284C7',
  },
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderTopColor: '#F1F5F9',
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
    color: '#64748B',
    textTransform: 'uppercase',
  },
  clipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clipChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1.5,
  },
  matchDayBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  matchOpponent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  matchDate: {
    fontSize: 11,
    color: '#64748B',
  },
  matchCardCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  matchScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  matchCardRight: {
    alignItems: 'flex-end',
    width: 60,
  },
  veoClipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  veoClipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noVeoText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  ovrTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  ovrHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  ovrHeroLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  ovrHeroValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0284C7',
  },
  ovrProgressionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ovrProgressionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
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
    backgroundColor: '#0284C7',
    marginTop: 4,
  },
  timelineDotCurrent: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#DCFCE7',
  },
  timelineDotFuture: {
    backgroundColor: '#CBD5E1',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
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
    color: '#334155',
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
    backgroundColor: '#0F172A',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 12,
    backgroundColor: '#1E293B',
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
