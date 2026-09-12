import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';
import { FutPlayer } from '../../components/coach/CoachFutPlayerCard';
import { CoachPitchView, FormationKey } from '../../components/coach/CoachPitchView';
import { CoachBenchDrawer } from '../../components/coach/CoachBenchDrawer';

const INITIAL_SQUAD: FutPlayer[] = [
  // 11 Starters (4-3-3 base)
  {
    id: '1',
    num: 1,
    name: 'H. Lloris',
    pos: 'GK',
    role: 'starter',
    rsvp: 'present',
    ovr: 86,
    rating: 8.2,
    form: 'peak',
    fatigueRisk: false,
    pac: 62,
    sho: 20,
    pas: 75,
    dri: 70,
    def: 86,
    phy: 80,
  },
  {
    id: '2',
    num: 3,
    name: 'E. Saliba',
    pos: 'LB',
    role: 'starter',
    rsvp: 'present',
    ovr: 82,
    rating: 7.9,
    form: 'good',
    fatigueRisk: false,
    pac: 84,
    sho: 64,
    pas: 79,
    dri: 81,
    def: 80,
    phy: 78,
  },
  {
    id: '3',
    num: 4,
    name: 'A. Pogba',
    pos: 'CB',
    role: 'starter',
    rsvp: 'present',
    ovr: 87,
    rating: 8.4,
    form: 'peak',
    fatigueRisk: false,
    pac: 78,
    sho: 45,
    pas: 80,
    dri: 72,
    def: 89,
    phy: 88,
  },
  {
    id: '4',
    num: 5,
    name: 'K. Diallo',
    pos: 'CB',
    role: 'starter',
    rsvp: 'present',
    ovr: 83,
    rating: 7.8,
    form: 'good',
    fatigueRisk: false,
    pac: 76,
    sho: 40,
    pas: 74,
    dri: 69,
    def: 84,
    phy: 85,
  },
  {
    id: '5',
    num: 2,
    name: 'M. Badé',
    pos: 'RB',
    role: 'starter',
    rsvp: 'present',
    ovr: 81,
    rating: 7.6,
    form: 'good',
    fatigueRisk: false,
    pac: 86,
    sho: 60,
    pas: 77,
    dri: 80,
    def: 79,
    phy: 81,
  },
  {
    id: '6',
    num: 8,
    name: 'M. Ruiz',
    pos: 'CM',
    role: 'starter',
    rsvp: 'present',
    ovr: 85,
    rating: 8.3,
    form: 'peak',
    fatigueRisk: false,
    pac: 78,
    sho: 76,
    pas: 88,
    dri: 85,
    def: 75,
    phy: 77,
  },
  {
    id: '7',
    num: 6,
    name: 'T. Doué',
    pos: 'CDM',
    role: 'starter',
    rsvp: 'present',
    ovr: 84,
    rating: 8.0,
    form: 'good',
    fatigueRisk: false,
    pac: 77,
    sho: 70,
    pas: 82,
    dri: 79,
    def: 86,
    phy: 86,
  },
  {
    id: '8',
    num: 10,
    name: 'R. Cherki',
    pos: 'CM',
    role: 'starter',
    rsvp: 'present',
    ovr: 88,
    rating: 8.7,
    form: 'peak',
    fatigueRisk: false,
    pac: 84,
    sho: 82,
    pas: 90,
    dri: 91,
    def: 60,
    phy: 74,
  },
  {
    id: '9',
    num: 11,
    name: 'S. Tel',
    pos: 'LW',
    role: 'starter',
    rsvp: 'present',
    ovr: 83,
    rating: 7.9,
    form: 'good',
    fatigueRisk: false,
    pac: 91,
    sho: 80,
    pas: 76,
    dri: 86,
    def: 45,
    phy: 76,
  },
  {
    id: '10',
    num: 9,
    name: 'Y. Benali',
    pos: 'ST',
    role: 'starter',
    rsvp: 'present',
    ovr: 89,
    rating: 8.8,
    form: 'peak',
    fatigueRisk: false,
    pac: 89,
    sho: 91,
    pas: 79,
    dri: 87,
    def: 42,
    phy: 84,
  },
  {
    id: '11',
    num: 7,
    name: 'L. Mbeumo',
    pos: 'RW',
    role: 'starter',
    rsvp: 'present',
    ovr: 84,
    rating: 8.1,
    form: 'tired',
    fatigueRisk: true,
    pac: 88,
    sho: 83,
    pas: 81,
    dri: 85,
    def: 50,
    phy: 78,
  },

  // Substitutes (Bench)
  {
    id: '12',
    num: 14,
    name: 'A. Virginius',
    pos: 'RW',
    role: 'sub',
    rsvp: 'present',
    ovr: 82,
    rating: 7.7,
    form: 'peak',
    fatigueRisk: false,
    pac: 89,
    sho: 79,
    pas: 77,
    dri: 82,
    def: 48,
    phy: 76,
  },
  {
    id: '13',
    num: 12,
    name: 'B. Faivre',
    pos: 'CB',
    role: 'sub',
    rsvp: 'present',
    ovr: 80,
    rating: 7.5,
    form: 'good',
    fatigueRisk: false,
    pac: 74,
    sho: 40,
    pas: 72,
    dri: 68,
    def: 82,
    phy: 81,
  },
  {
    id: '14',
    num: 16,
    name: 'N. Gouiri',
    pos: 'ST',
    role: 'sub',
    rsvp: 'present',
    ovr: 83,
    rating: 7.9,
    form: 'good',
    fatigueRisk: false,
    pac: 83,
    sho: 84,
    pas: 79,
    dri: 84,
    def: 44,
    phy: 79,
  },
  {
    id: '15',
    num: 18,
    name: 'J. Mandanda',
    pos: 'GK',
    role: 'sub',
    rsvp: 'present',
    ovr: 79,
    rating: 7.4,
    form: 'good',
    fatigueRisk: false,
    pac: 55,
    sho: 18,
    pas: 70,
    dri: 65,
    def: 80,
    phy: 77,
  },
  {
    id: '16',
    num: 17,
    name: 'F. Camara',
    pos: 'CM',
    role: 'sub',
    rsvp: 'present',
    ovr: 81,
    rating: 7.6,
    form: 'good',
    fatigueRisk: false,
    pac: 78,
    sho: 74,
    pas: 81,
    dri: 80,
    def: 76,
    phy: 78,
  },
  {
    id: '17',
    num: 19,
    name: 'S. Bellegarde',
    pos: 'LB',
    role: 'sub',
    rsvp: 'present',
    ovr: 78,
    rating: 7.3,
    form: 'good',
    fatigueRisk: false,
    pac: 82,
    sho: 60,
    pas: 75,
    dri: 77,
    def: 76,
    phy: 75,
  },

  // Reserves / Injured / Pending
  {
    id: '18',
    num: 20,
    name: 'R. Lecomte',
    pos: 'LB',
    role: 'unselected',
    rsvp: 'injured',
    ovr: 77,
    rating: 7.1,
    form: 'injured',
    fatigueRisk: true,
    pac: 80,
    sho: 58,
    pas: 72,
    dri: 74,
    def: 75,
    phy: 72,
  },
  {
    id: '19',
    num: 21,
    name: 'K. Zedadka',
    pos: 'ST',
    role: 'unselected',
    rsvp: 'absent',
    ovr: 76,
    rating: 6.9,
    form: 'tired',
    fatigueRisk: false,
    pac: 81,
    sho: 75,
    pas: 68,
    dri: 73,
    def: 40,
    phy: 74,
  },
  {
    id: '20',
    num: 22,
    name: 'M. Sissoko',
    pos: 'CDM',
    role: 'unselected',
    rsvp: 'pending',
    ovr: 78,
    rating: 7.2,
    form: 'good',
    fatigueRisk: false,
    pac: 72,
    sho: 65,
    pas: 77,
    dri: 74,
    def: 79,
    phy: 82,
  },
];

const FORMATION_OPTIONS: FormationKey[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '5-3-2',
];

export const CoachSquadScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'composition' | 'convocations' | 'classement'>('composition');
  const [squad, setSquad] = useState<FutPlayer[]>(INITIAL_SQUAD);
  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<{
    confidence: number;
    title: string;
    description: string;
  } | null>(null);

  // Derived squad subsets
  const starters = squad.filter((p) => p.role === 'starter');
  const subs = squad.filter((p) => p.role === 'sub');
  const unselected = squad.filter((p) => p.role === 'unselected');

  // RSVP stats
  const presentCount = squad.filter((p) => p.rsvp === 'present').length;
  const pendingCount = squad.filter((p) => p.rsvp === 'pending').length;
  const absentCount = squad.filter((p) => p.rsvp === 'absent').length;
  const injuredCount = squad.filter((p) => p.rsvp === 'injured').length;

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore on unsupported
    }
  };

  // 1. Select starter on pitch
  const handleSelectStarter = (player: FutPlayer) => {
    if (selectedBenchId) {
      // Swap bench player with this starter
      const benchPlayer = squad.find((p) => p.id === selectedBenchId);
      if (benchPlayer) {
        swapStarterWithBench(player, benchPlayer);
        setSelectedStarterId(null);
        setSelectedBenchId(null);
        return;
      }
    }

    if (selectedStarterId === player.id) {
      setSelectedStarterId(null);
    } else {
      setSelectedStarterId(player.id);
      setSelectedBenchId(null);
    }
  };

  // 2. Swap two starters on pitch
  const handleSwapPositions = (playerA: FutPlayer, playerB: FutPlayer) => {
    triggerHaptic();
    setSquad((prev) => {
      const idxA = prev.findIndex((p) => p.id === playerA.id);
      const idxB = prev.findIndex((p) => p.id === playerB.id);
      if (idxA === -1 || idxB === -1) return prev;

      const next = [...prev];
      const temp = next[idxA];
      next[idxA] = next[idxB];
      next[idxB] = temp;
      return next;
    });
    setSelectedStarterId(null);
    setSelectedBenchId(null);
  };

  // 3. Select bench player
  const handleSelectBenchPlayer = (benchPlayer: FutPlayer) => {
    triggerHaptic();
    if (selectedStarterId) {
      const starter = starters.find((p) => p.id === selectedStarterId);
      if (starter) {
        swapStarterWithBench(starter, benchPlayer);
        setSelectedStarterId(null);
        setSelectedBenchId(null);
        return;
      }
    }

    if (selectedBenchId === benchPlayer.id) {
      setSelectedBenchId(null);
    } else {
      setSelectedBenchId(benchPlayer.id);
    }
  };

  // 4. Swap starter with bench player
  const swapStarterWithBench = (starter: FutPlayer, sub: FutPlayer) => {
    triggerHaptic();
    setSquad((prev) =>
      prev.map((p) => {
        if (p.id === starter.id) {
          return { ...p, role: 'sub' };
        }
        if (p.id === sub.id) {
          return { ...p, role: 'starter' };
        }
        return p;
      })
    );
  };

  // 5. AI Auto-Lineup Algorithm
  const generateAiLineup = () => {
    triggerHaptic();
    setIsAiGenerating(true);

    setTimeout(() => {
      setIsAiGenerating(false);

      // AI Logic: Prioritize present players, bench fatigued ones, maximize team OVR & synergy
      setSquad((prev) => {
        // Find if L. Mbeumo (fatigued RW) can be replaced by A. Virginius (peak RW)
        const updated = prev.map((p) => {
          if (p.id === '11' && p.fatigueRisk) {
            // Demote fatigued starter to bench
            return { ...p, role: 'sub' as const, form: 'tired' as const };
          }
          if (p.id === '12' && p.role === 'sub') {
            // Promote peak sub to starting XI
            return { ...p, role: 'starter' as const, form: 'peak' as const };
          }
          return p;
        });
        return updated;
      });

      setAiReport({
        confidence: 98,
        title: 'XI de Départ Optimisé par Moteur IA',
        description:
          'L. Mbeumo ménagé pour risque de surcharge ACWR (>1.45). A. Virginius titularisé sur l’aile droite (Forme 100%, 89 VIT). Synergie collective +14%.',
      });
    }, 750);
  };

  const sendRsvpReminders = () => {
    triggerHaptic();
    Alert.alert(
      'Relances Automatiques Envoyées',
      `Notification Push et message WhatsApp transmis aux ${pendingCount} joueur(s) n’ayant pas encore validé leur présence.`
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Segment Tabs */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.matchBadgeRow}>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>PROCHAIN MATCH · J14</Text>
              </View>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>XI Confirmé</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Composition & Terrain Tactique</Text>
            <Text style={styles.headerSubtitle}>RC France · Dimanche 15:00 · Stade Municipal</Text>
          </View>
        </View>

        {/* Segment Switcher */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'composition' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('composition')}
          >
            <MaterialCommunityIcons
              name="soccer-field"
              size={14}
              color={activeTab === 'composition' ? '#FFFFFF' : '#8B8B9A'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'composition' && styles.segmentBtnTextActive,
              ]}
            >
              Composition FUT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'convocations' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('convocations')}
          >
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={14}
              color={activeTab === 'convocations' ? '#FFFFFF' : '#8B8B9A'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'convocations' && styles.segmentBtnTextActive,
              ]}
            >
              RSVP & Convocs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'classement' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('classement')}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={14}
              color={activeTab === 'classement' ? '#FFFFFF' : '#8B8B9A'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'classement' && styles.segmentBtnTextActive,
              ]}
            >
              Classement
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: COMPOSITION FUT & TERRAIN TACTIQUE */}
      {activeTab === 'composition' && (
        <>
          {/* Tactical Command Bar: Formation Selector & 1-tap AI Button */}
          <View style={styles.tacticalCommandCard}>
            <View style={styles.formationPillsRow}>
              {FORMATION_OPTIONS.map((fKey) => {
                const isActive = formation === fKey;
                return (
                  <TouchableOpacity
                    key={fKey}
                    style={[styles.formationPill, isActive && styles.formationPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setFormation(fKey);
                    }}
                  >
                    <Text
                      style={[
                        styles.formationPillText,
                        isActive && styles.formationPillTextActive,
                      ]}
                    >
                      {fKey}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.aiActionBtn, isAiGenerating && styles.aiActionBtnLoading]}
              onPress={generateAiLineup}
              activeOpacity={0.85}
              disabled={isAiGenerating}
            >
              {isAiGenerating ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="magic-staff" size={14} color="#000000" />
                  <Text style={styles.aiActionBtnText}>
                    Générer XI Optimal IA · Optimiser Charge Athlétique
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* AI Report Card */}
            {aiReport && (
              <View style={styles.aiReportBox}>
                <View style={styles.aiConfidenceBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#30D158" />
                  <Text style={styles.aiConfidenceText}>{aiReport.confidence}% FIABILITÉ IA</Text>
                </View>
                <Text style={styles.aiReportTitle}>{aiReport.title}</Text>
                <Text style={styles.aiReportDesc}>{aiReport.description}</Text>
              </View>
            )}
          </View>

          {/* Interactive FIFA-Inspired Pitch View */}
          <CoachPitchView
            starters={starters}
            formation={formation}
            selectedPlayerId={selectedStarterId}
            onSelectPlayer={handleSelectStarter}
            onSwapPositions={handleSwapPositions}
          />

          {/* Bench & Reserves Collapsible Drawer */}
          <CoachBenchDrawer
            subs={subs}
            unselected={unselected}
            selectedStarterId={selectedStarterId}
            selectedBenchId={selectedBenchId}
            onSelectBenchPlayer={handleSelectBenchPlayer}
          />
        </>
      )}

      {/* TAB 2: LISTE COMPLÈTE CONVOCATIONS & RSVP */}
      {activeTab === 'convocations' && (
        <>
          {/* RSVP Barometer Bar */}
          <View style={styles.rsvpBarometerCard}>
            <View style={styles.rsvpBarometerTop}>
              <Text style={styles.rsvpTitle}>Baromètre de Présence Match</Text>
              {pendingCount > 0 && (
                <TouchableOpacity style={styles.reminderBtn} onPress={sendRsvpReminders}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={13} color="#C5A059" />
                  <Text style={styles.reminderBtnText}>Relancer {pendingCount}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rsvpPillsRow}>
              <View style={[styles.rsvpPill, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                <Text style={[styles.rsvpCount, { color: '#30D158' }]}>{presentCount}</Text>
                <Text style={styles.rsvpLabel}>Présents</Text>
              </View>
              <View style={[styles.rsvpPill, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
                <Text style={[styles.rsvpCount, { color: '#FF9F0A' }]}>{pendingCount}</Text>
                <Text style={styles.rsvpLabel}>En attente</Text>
              </View>
              <View style={[styles.rsvpPill, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
                <Text style={[styles.rsvpCount, { color: '#FF453A' }]}>{absentCount}</Text>
                <Text style={styles.rsvpLabel}>Absents</Text>
              </View>
              <View style={[styles.rsvpPill, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
                <Text style={[styles.rsvpCount, { color: '#BF5AF2' }]}>{injuredCount}</Text>
                <Text style={styles.rsvpLabel}>Blessés</Text>
              </View>
            </View>
          </View>

          <View style={styles.rosterCard}>
          <Text style={styles.rosterTitle}>Effectif Convoqué ({squad.length} joueurs)</Text>
          {squad.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerNum}>
                <Text style={styles.playerNumText}>#{player.num}</Text>
              </View>
              <View style={styles.playerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.ovrMiniBadge}>
                    <Text style={styles.ovrMiniText}>{player.ovr}</Text>
                  </View>
                </View>
                <Text style={styles.playerMeta}>
                  {player.pos} · {player.role === 'starter' ? 'Titulaire' : player.role === 'sub' ? 'Remplaçant' : 'Non retenu'}
                </Text>
              </View>
              <View
                style={[
                  styles.rsvpStatusPill,
                  player.rsvp === 'present' && { backgroundColor: 'rgba(48, 209, 88, 0.2)' },
                  player.rsvp === 'pending' && { backgroundColor: 'rgba(255, 159, 10, 0.2)' },
                  player.rsvp === 'absent' && { backgroundColor: 'rgba(255, 69, 58, 0.2)' },
                  player.rsvp === 'injured' && { backgroundColor: 'rgba(191, 90, 242, 0.2)' },
                ]}
              >
                <Text
                  style={[
                    styles.rsvpStatusText,
                    player.rsvp === 'present' && { color: '#30D158' },
                    player.rsvp === 'pending' && { color: '#FF9F0A' },
                    player.rsvp === 'absent' && { color: '#FF453A' },
                    player.rsvp === 'injured' && { color: '#BF5AF2' },
                  ]}
                >
                  {player.rsvp === 'present'
                    ? 'Présent'
                    : player.rsvp === 'pending'
                    ? 'Attente'
                    : player.rsvp === 'absent'
                    ? 'Absent'
                    : 'Blessé'}
                </Text>
              </View>
            </View>
          ))}
          </View>
        </>
      )}

      {/* TAB 3: CLASSEMENT OFFICIEL */}
      {activeTab === 'classement' && (
        <CoachStandingsTable compact={false} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 14,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    marginBottom: 12,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  matchBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchBadgeText: {
    color: '#C5A059',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#30D158',
  },
  activePillText: {
    color: '#30D158',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 11.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#1E1E26',
  },
  segmentBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rsvpBarometerCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 12,
  },
  rsvpBarometerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rsvpTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reminderBtnText: {
    color: '#C5A059',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  rsvpPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
  },
  rsvpCount: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: '-apple-system',
  },
  rsvpLabel: {
    color: '#8B8B9A',
    fontSize: 9.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  tacticalCommandCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 10,
    marginBottom: 10,
  },
  tacticalCommandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formationSelectorCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    marginBottom: 12,
  },
  formationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  formationTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formationHint: {
    color: '#8B8B9A',
    fontSize: 9.5,
    fontFamily: '-apple-system',
  },
  formationPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  formationPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  formationPillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  formationPillText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formationPillTextActive: {
    color: '#C5A059',
  },
  aiCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    padding: 12,
    marginBottom: 12,
  },
  aiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  aiSubtitle: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 8,
  },
  aiActionBtnLoading: {
    opacity: 0.7,
  },
  aiActionBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  aiReportBox: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 10,
    marginTop: 10,
  },
  aiConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  aiConfidenceText: {
    color: '#30D158',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  aiReportTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  aiReportDesc: {
    color: '#D0D0D8',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    lineHeight: 14,
  },
  rosterCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  rosterTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  playerNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1C1C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerNumText: {
    color: '#C5A059',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  ovrMiniBadge: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ovrMiniText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  playerMeta: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  rsvpStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rsvpStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
});
