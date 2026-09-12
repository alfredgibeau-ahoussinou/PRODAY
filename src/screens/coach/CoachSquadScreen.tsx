import React, { useState, useMemo } from 'react';
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
import {
  CoachPitchView,
  MatchFormatKey,
  MATCH_FORMATS_CONFIG,
} from '../../components/coach/CoachPitchView';
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

const FORMAT_OPTIONS: MatchFormatKey[] = ['11v11', '8v8', '5v5', 'futsal', '4v4', '3v3'];

export const CoachSquadScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'composition' | 'convocations' | 'classement'>('composition');
  const [format, setFormat] = useState<MatchFormatKey>('11v11');
  const [formation, setFormation] = useState<string>('4-3-3');
  const [squad, setSquad] = useState<FutPlayer[]>(INITIAL_SQUAD);
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<{
    confidence: number;
    title: string;
    description: string;
  } | null>(null);

  const formatConfig = MATCH_FORMATS_CONFIG[format];
  const targetStartersCount = formatConfig.starterCount;

  const [showStartingRosterList, setShowStartingRosterList] = useState(true);

  // Derive starters and subs dynamically according to format starter count & fitness
  const { starters, subs, unselected } = useMemo(() => {
    const presentOrFit = squad.filter((p) => p.rsvp !== 'injured' && p.rsvp !== 'absent');
    const unavailable = squad.filter((p) => p.rsvp === 'injured' || p.rsvp === 'absent');

    // Priority to players explicitly marked 'starter' AND who are present/fit
    const currentStarters = presentOrFit.filter((p) => p.role === 'starter');

    let finalStarters: FutPlayer[] = [];
    if (currentStarters.length === targetStartersCount) {
      finalStarters = currentStarters;
    } else if (currentStarters.length > targetStartersCount) {
      finalStarters = currentStarters.slice(0, targetStartersCount);
    } else {
      const remainingNeeded = targetStartersCount - currentStarters.length;
      const candidates = presentOrFit.filter((p) => p.role !== 'starter');
      finalStarters = [...currentStarters, ...candidates.slice(0, remainingNeeded)];
    }

    const starterIds = new Set(finalStarters.map((p) => p.id));
    const finalSubs = squad.filter((p) => !starterIds.has(p.id) && p.rsvp !== 'injured' && p.rsvp !== 'absent');

    return {
      starters: finalStarters,
      subs: finalSubs,
      unselected: unavailable,
    };
  }, [squad, targetStartersCount]);

  const teamOvr = useMemo(() => {
    if (!starters.length) return 80;
    const sum = starters.reduce((acc, p) => acc + (p.ovr || 75), 0);
    return Math.round(sum / starters.length);
  }, [starters]);

  // Starters partitioned by tactical line (Gardien, Défense, Milieu, Attaque)
  const startersByLine = useMemo(() => {
    const gk = starters.filter((p) => p.pos === 'GK');
    const def = starters.filter((p) => ['LB', 'CB', 'RB', 'LWB', 'RWB'].includes(p.pos));
    const mid = starters.filter((p) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.pos));
    const att = starters.filter((p) => ['ST', 'CF', 'RW', 'LW'].includes(p.pos));
    return { gk, def, mid, att };
  }, [starters]);

  // RSVP stats
  const presentCount = squad.filter((p) => p.rsvp === 'present').length;
  const pendingCount = squad.filter((p) => p.rsvp === 'pending').length;
  const absentCount = squad.filter((p) => p.rsvp === 'absent').length;
  const injuredCount = squad.filter((p) => p.rsvp === 'injured').length;

  // Cycle player RSVP status: present -> pending -> absent -> injured -> present
  const cyclePlayerRsvp = (playerId: string) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    setSquad((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const nextMap: Record<'present' | 'pending' | 'absent' | 'injured', 'present' | 'pending' | 'absent' | 'injured'> = {
          present: 'pending',
          pending: 'absent',
          absent: 'injured',
          injured: 'present',
        };
        const nextRsvp = nextMap[p.rsvp] || 'present';
        const demoteStarter = (nextRsvp === 'absent' || nextRsvp === 'injured') && p.role === 'starter';
        return {
          ...p,
          rsvp: nextRsvp,
          role: demoteStarter ? ('sub' as const) : p.role,
          form: nextRsvp === 'injured' ? ('injured' as const) : p.form === 'injured' ? ('good' as const) : p.form,
        };
      })
    );
  };

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
  };

  // Format Switcher
  const handleSelectFormat = (f: MatchFormatKey) => {
    triggerHaptic();
    setFormat(f);
    const newConfig = MATCH_FORMATS_CONFIG[f];
    setFormation(newConfig.defaultFormation);
    setSelectedStarterId(null);
    setSelectedBenchId(null);

    // Re-assign role attributes cleanly
    setSquad((prev) => {
      const needed = newConfig.starterCount;
      return prev.map((p, idx) => ({
        ...p,
        role: idx < needed ? ('starter' as const) : ('sub' as const),
      }));
    });
  };

  // 1. Select starter on pitch
  const handleSelectStarter = (player: FutPlayer) => {
    if (selectedBenchId) {
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

  // 4. Swap starter with bench player (100% manual override)
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

  // 5. Optional AI Auto-Lineup Suggestion
  const generateAiLineup = () => {
    triggerHaptic();
    setIsAiGenerating(true);

    setTimeout(() => {
      setIsAiGenerating(false);

      // AI Logic: Prioritize peak fitness, bench fatigue risk players
      setSquad((prev) => {
        return prev.map((p) => {
          if (p.id === '11' && p.fatigueRisk) {
            return { ...p, role: 'sub' as const, form: 'tired' as const };
          }
          if (p.id === '12' && p.role === 'sub') {
            return { ...p, role: 'starter' as const, form: 'peak' as const };
          }
          return p;
        });
      });

      setAiReport({
        confidence: 98,
        title: 'Composition Suggérée par l’IA (Modifiable à 100%)',
        description:
          'L. Mbeumo préservé pour surcharge ACWR. A. Virginius titularisé (Forme 100%). Vous conservez la liberté totale d’ajuster chaque poste manuellement.',
      });
    }, 600);
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
      {/* 1. Header: Segment Tabs & Subtitle */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.matchBadgeRow}>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>PROCHAIN MATCH · J17</Text>
              </View>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>
                  {formatConfig.name} · {targetStartersCount}/{targetStartersCount} Titulaires
                </Text>
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
              Terrain FUT
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
          {/* Universal Consolidated Tactical Command Bar */}
          <View style={styles.tacticalControlPanel}>
            {/* Row 1: Format de jeu */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>FORMAT :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlScroll}>
                {FORMAT_OPTIONS.map((fKey) => {
                  const isSelected = format === fKey;
                  const cfg = MATCH_FORMATS_CONFIG[fKey];
                  return (
                    <TouchableOpacity
                      key={fKey}
                      style={[styles.formatPill, isSelected && styles.formatPillActive]}
                      onPress={() => handleSelectFormat(fKey)}
                    >
                      <Text style={[styles.formatPillText, isSelected && styles.formatPillTextActive]}>
                        {cfg.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Row 2: Formations */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>SYSTÈME :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlScroll}>
                {formatConfig.formations.map((fKey) => {
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
              </ScrollView>
            </View>

            {/* Row 3: Action IA & Statut XI */}
            <View style={styles.actionAndStatusRow}>
              <TouchableOpacity
                style={[styles.aiActionBtnCompact, isAiGenerating && styles.aiActionBtnLoading]}
                onPress={generateAiLineup}
                activeOpacity={0.85}
                disabled={isAiGenerating}
              >
                {isAiGenerating ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="magic-staff" size={13} color="#000000" />
                    <Text style={styles.aiActionBtnTextCompact}>
                      Suggérer XI Optimal IA
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.lineupStatusBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#30D158" />
                <Text style={styles.lineupStatusText}>
                  {format === '11v11' ? 'XI COMPLET (11/11)' : `${targetStartersCount} TITULAIRES`}
                </Text>
              </View>
            </View>

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

          {/* Interactive FIFA-Inspired Pitch View (Adapts to format) */}
          <CoachPitchView
            starters={starters}
            format={format}
            formation={formation}
            selectedPlayerId={selectedStarterId}
            onSelectPlayer={handleSelectStarter}
            onSwapPositions={handleSwapPositions}
          />

          {/* Starting XI Detailed Roster Strip (Guarantees absolute clarity for Foot à 11) */}
          <View style={styles.startingRosterCard}>
            <TouchableOpacity
              style={styles.startingRosterHeader}
              onPress={() => setShowStartingRosterList(!showStartingRosterList)}
              activeOpacity={0.8}
            >
              <View style={styles.startingRosterHeaderLeft}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={16} color="#C5A059" />
                <Text style={styles.startingRosterTitle}>
                  {format === '11v11'
                    ? 'Feuille de Match · XI Titulaire (11 Joueurs)'
                    : `Feuille de Match · ${targetStartersCount} Titulaires`}
                </Text>
              </View>
              <View style={styles.startingRosterHeaderRight}>
                <View style={styles.startingRosterOvrBadge}>
                  <Text style={styles.startingRosterOvrText}>{teamOvr} GEN</Text>
                </View>
                <Feather
                  name={showStartingRosterList ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#8B8B9A"
                />
              </View>
            </TouchableOpacity>

            {showStartingRosterList && (
              <View style={styles.startingRosterBody}>
                {/* 1. Gardien */}
                {startersByLine.gk.length > 0 && (
                  <View style={styles.lineSection}>
                    <Text style={styles.lineSectionTitle}>GARDIEN DE BUT ({startersByLine.gk.length})</Text>
                    {startersByLine.gk.map((player) => (
                      <View key={player.id} style={styles.rosterLinePlayer}>
                        <View style={[styles.posBadgeMini, { backgroundColor: '#FF9F0A' }]}>
                          <Text style={styles.posBadgeMiniText}>{player.pos}</Text>
                        </View>
                        <Text style={styles.rosterPlayerNum}>#{player.num}</Text>
                        <Text style={styles.rosterPlayerName}>{player.name}</Text>
                        <View style={styles.rosterPlayerRight}>
                          <Text style={styles.rosterPlayerOvr}>{player.ovr} OVR</Text>
                          <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. Défense */}
                {startersByLine.def.length > 0 && (
                  <View style={styles.lineSection}>
                    <Text style={styles.lineSectionTitle}>LIGNE DÉFENSIVE ({startersByLine.def.length})</Text>
                    {startersByLine.def.map((player) => (
                      <View key={player.id} style={styles.rosterLinePlayer}>
                        <View style={[styles.posBadgeMini, { backgroundColor: '#0A84FF' }]}>
                          <Text style={styles.posBadgeMiniText}>{player.pos}</Text>
                        </View>
                        <Text style={styles.rosterPlayerNum}>#{player.num}</Text>
                        <Text style={styles.rosterPlayerName}>{player.name}</Text>
                        <View style={styles.rosterPlayerRight}>
                          <Text style={styles.rosterPlayerOvr}>{player.ovr} OVR</Text>
                          <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. Milieu */}
                {startersByLine.mid.length > 0 && (
                  <View style={styles.lineSection}>
                    <Text style={styles.lineSectionTitle}>MILIEU DE TERRAIN ({startersByLine.mid.length})</Text>
                    {startersByLine.mid.map((player) => (
                      <View key={player.id} style={styles.rosterLinePlayer}>
                        <View style={[styles.posBadgeMini, { backgroundColor: '#30D158' }]}>
                          <Text style={styles.posBadgeMiniText}>{player.pos}</Text>
                        </View>
                        <Text style={styles.rosterPlayerNum}>#{player.num}</Text>
                        <Text style={styles.rosterPlayerName}>{player.name}</Text>
                        <View style={styles.rosterPlayerRight}>
                          <Text style={styles.rosterPlayerOvr}>{player.ovr} OVR</Text>
                          <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 4. Attaque */}
                {startersByLine.att.length > 0 && (
                  <View style={styles.lineSection}>
                    <Text style={styles.lineSectionTitle}>LIGNE D'ATTAQUE ({startersByLine.att.length})</Text>
                    {startersByLine.att.map((player) => (
                      <View key={player.id} style={styles.rosterLinePlayer}>
                        <View style={[styles.posBadgeMini, { backgroundColor: '#FF453A' }]}>
                          <Text style={styles.posBadgeMiniText}>{player.pos}</Text>
                        </View>
                        <Text style={styles.rosterPlayerNum}>#{player.num}</Text>
                        <Text style={styles.rosterPlayerName}>{player.name}</Text>
                        <View style={styles.rosterPlayerRight}>
                          <Text style={styles.rosterPlayerOvr}>{player.ovr} OVR</Text>
                          <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => cyclePlayerRsvp(player.id)}
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
                  <Feather
                    name="refresh-cw"
                    size={9}
                    color={
                      player.rsvp === 'present'
                        ? '#30D158'
                        : player.rsvp === 'pending'
                        ? '#FF9F0A'
                        : player.rsvp === 'absent'
                        ? '#FF453A'
                        : '#BF5AF2'
                    }
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
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
  tacticalControlPanel: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 8,
    marginBottom: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  controlLabel: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
    width: 64,
  },
  controlScroll: {
    gap: 6,
  },
  formatPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  formatPillActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
  },
  formatPillText: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formatPillTextActive: {
    color: '#0A84FF',
  },
  formationPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
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
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formationPillTextActive: {
    color: '#C5A059',
  },
  actionAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  aiActionBtnCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#C5A059',
    borderRadius: 8,
    paddingVertical: 7,
  },
  aiActionBtnLoading: {
    opacity: 0.7,
  },
  aiActionBtnTextCompact: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  lineupStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  lineupStatusText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  startingRosterCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  startingRosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startingRosterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startingRosterTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  startingRosterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startingRosterOvrBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  startingRosterOvrText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  startingRosterBody: {
    marginTop: 10,
    gap: 10,
  },
  lineSection: {
    gap: 4,
  },
  lineSectionTitle: {
    color: '#8B8B9A',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rosterLinePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  posBadgeMini: {
    width: 28,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  rosterPlayerNum: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    width: 22,
  },
  rosterPlayerName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rosterPlayerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rosterPlayerOvr: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  rsvpStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
});
