import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';
import { FutPlayer } from '../../components/coach/CoachFutPlayerCard';
import {
  CoachPitchView,
  MatchFormatKey,
  MATCH_FORMATS_CONFIG,
  TacticalCategory,
  TacticalSystem,
  ALL_TACTICAL_SYSTEMS,
  TACTICAL_SYSTEMS_BY_ID,
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

  const [isTacticalModalVisible, setIsTacticalModalVisible] = useState(false);
  const [tacticalCategory, setTacticalCategory] = useState<TacticalCategory>('all');
  const [tacticalSearch, setTacticalSearch] = useState('');

  // Guided Progressive Wizard Modal (3 Steps)
  const [isWizardModalVisible, setIsWizardModalVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isFormatModalVisible, setIsFormatModalVisible] = useState(false);

  const formatConfig = MATCH_FORMATS_CONFIG[format];
  const targetStartersCount = formatConfig.starterCount;

  const currentSystem = TACTICAL_SYSTEMS_BY_ID[formation];

  const selectedPlayer = useMemo(() => {
    if (selectedStarterId) return squad.find((p) => p.id === selectedStarterId) || null;
    if (selectedBenchId) return squad.find((p) => p.id === selectedBenchId) || null;
    return null;
  }, [selectedStarterId, selectedBenchId, squad]);

  const displayFormations = useMemo(() => {
    const popularFormations = formatConfig.formations.slice(0, 5);
    if (!popularFormations.includes(formation) && formatConfig.formations.includes(formation)) {
      return [...popularFormations, formation];
    }
    return popularFormations;
  }, [formatConfig, formation]);

  const filteredSystems = useMemo(() => {
    return ALL_TACTICAL_SYSTEMS.filter((sys) => {
      // Category filter
      if (tacticalCategory !== 'all') {
        if (tacticalCategory === 'small-sided') {
          if (sys.format === '11v11') return false;
        } else if (sys.category !== tacticalCategory) {
          return false;
        }
      }
      // Search query filter
      if (tacticalSearch.trim().length > 0) {
        const query = tacticalSearch.toLowerCase().trim();
        const matchesName = sys.name.toLowerCase().includes(query);
        const matchesDesc = sys.description.toLowerCase().includes(query);
        const matchesStyle = sys.style.toLowerCase().includes(query);
        const matchesTeams = sys.famousTeams.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesStyle || matchesTeams;
      }
      return true;
    });
  }, [tacticalCategory, tacticalSearch]);

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
      {/* 1. Minimal Apple Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Composition</Text>
            <Text style={styles.headerSubtitle}>
              {formatConfig.name} · Dimanche 15:00 vs RC France
            </Text>
          </View>
          <TouchableOpacity
            style={styles.wizardHeaderBtn}
            onPress={() => {
              triggerHaptic();
              setWizardStep(1);
              setIsWizardModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="wizard-hat" size={13} color="#C5A059" />
            <Text style={styles.wizardHeaderBtnText}>Mode Guidé</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Apple Segmented Control Bar */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'composition' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('composition');
            }}
          >
            <MaterialCommunityIcons
              name="soccer-field"
              size={13}
              color={activeTab === 'composition' ? '#FFFFFF' : '#8B8B9A'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'composition' && styles.segmentBtnTextActive,
              ]}
            >
              Terrain
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'convocations' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('convocations');
            }}
          >
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={13}
              color={activeTab === 'convocations' ? '#FFFFFF' : '#8B8B9A'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'convocations' && styles.segmentBtnTextActive,
              ]}
            >
              Feuille
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'classement' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic();
              setActiveTab('classement');
            }}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={13}
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

      {/* TAB 1: TERRAIN FUT & DISPOSITIF TACTIQUE (APPLE SIMPLICITY) */}
      {activeTab === 'composition' && (
        <>
          {/* Apple Minimalist Tactical Command Bar (Single-Row Capsule) */}
          <View style={styles.tacticalBarUnified}>
            {/* Format Picker Pill */}
            <TouchableOpacity
              style={styles.formatPillUnified}
              onPress={() => {
                triggerHaptic();
                setIsFormatModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="soccer" size={13} color="#C5A059" />
              <Text style={styles.formatPillUnifiedText}>{formatConfig.name}</Text>
              <Ionicons name="chevron-down" size={11} color="#8B8B9A" />
            </TouchableOpacity>

            {/* Formation / Tactical Library Capsule */}
            <TouchableOpacity
              style={styles.formationPillUnified}
              onPress={() => {
                triggerHaptic();
                setIsTacticalModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="strategy" size={13} color="#C5A059" />
              <Text style={styles.formationPillUnifiedText} numberOfLines={1}>
                {currentSystem ? currentSystem.name : formation}
              </Text>
              <Ionicons name="chevron-down" size={11} color="#8B8B9A" />
            </TouchableOpacity>

            {/* 1-Tap AI Suggestion Button */}
            <TouchableOpacity
              style={[styles.aiPillUnified, isAiGenerating && styles.aiPillUnifiedLoading]}
              onPress={generateAiLineup}
              activeOpacity={0.8}
              disabled={isAiGenerating}
            >
              {isAiGenerating ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="magic-staff" size={12} color="#000000" />
                  <Text style={styles.aiPillUnifiedText}>XI IA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Report Toast (Clean & Dismissible) */}
          {aiReport && (
            <View style={styles.aiReportToast}>
              <View style={styles.aiReportToastLeft}>
                <Ionicons name="checkmark-circle" size={13} color="#30D158" />
                <Text style={styles.aiReportToastText} numberOfLines={1}>
                  {aiReport.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAiReport(null)}>
                <Ionicons name="close" size={14} color="#8B8B9A" />
              </TouchableOpacity>
            </View>
          )}

          {/* Active Player Swap Feedback Banner (Apple Floating Notification) */}
          {selectedPlayer && (
            <View style={styles.activeSwapBanner}>
              <View style={styles.activeSwapLeft}>
                <View style={styles.swapIconHalo}>
                  <MaterialCommunityIcons name="swap-horizontal-bold" size={14} color="#30D158" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeSwapTitle}>Permutation en cours</Text>
                  <Text style={styles.activeSwapDesc}>
                    #{selectedPlayer.num} {selectedPlayer.name} ({selectedPlayer.pos}) · Touchez un joueur pour échanger
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelSwapBtn}
                onPress={() => {
                  triggerHaptic();
                  setSelectedStarterId(null);
                  setSelectedBenchId(null);
                }}
              >
                <Text style={styles.cancelSwapText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interactive FIFA-Inspired Pitch View (Adapts to format) */}
          <CoachPitchView
            starters={starters}
            format={format}
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

      {/* TAB 2: FEUILLE DE MATCH OFFICIELLE & CONVOCATIONS */}
      {activeTab === 'convocations' && (
        <>
          {/* Starting XI Partitioned Breakdown by Lines */}
          <View style={styles.startingRosterCard}>
            <View style={styles.startingRosterHeader}>
              <View style={styles.startingRosterHeaderLeft}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={16} color="#C5A059" />
                <Text style={styles.startingRosterTitle}>
                  {format === '11v11'
                    ? 'Feuille de Match · XI Titulaire Officiel (11 Joueurs)'
                    : `Feuille de Match · ${targetStartersCount} Titulaires`}
                </Text>
              </View>
              <View style={styles.startingRosterHeaderRight}>
                <View style={styles.startingRosterOvrBadge}>
                  <Text style={styles.startingRosterOvrText}>{teamOvr} GEN</Text>
                </View>
              </View>
            </View>

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
          </View>

          {/* RSVP Presence Barometer Bar */}
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

          {/* Convocations & RSVP Interactive List */}
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

      {/* TAB 3: CLASSEMENT OFFICIEL FFF & FLUX EN DIRECT */}
      {activeTab === 'classement' && (
        <CoachStandingsTable compact={false} />
      )}

      {/* CATEGORIZED TACTICAL LIBRARY MODAL (57+ SYSTEMS) */}
      <Modal
        visible={isTacticalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsTacticalModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Bibliothèque Tactique</Text>
              <Text style={styles.modalSubtitle}>
                {filteredSystems.length} systèmes • Base mondiale ProDay
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsTacticalModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.modalSearchContainer}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Rechercher (ex: Bielsa, 3-2-4-1, Diamond, Faux 9...)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={tacticalSearch}
              onChangeText={setTacticalSearch}
              clearButtonMode="while-editing"
            />
            {tacticalSearch.length > 0 && (
              <TouchableOpacity onPress={() => setTacticalSearch('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Chips */}
          <View style={styles.modalCategoryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalCategoryScroll}>
              {[
                { key: 'all', label: `Tous (${ALL_TACTICAL_SYSTEMS.length})` },
                { key: 'defense-4', label: 'Défense à 4 (19)' },
                { key: 'defense-3-5', label: 'Défense à 3 & 5 (14)' },
                { key: 'historical-hybrid', label: 'Historiques & Hybrides (6)' },
                { key: 'small-sided', label: 'Formats Réduits (20)' },
              ].map((cat) => {
                const isSelected = tacticalCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    onPress={() => {
                      triggerHaptic();
                      setTacticalCategory(cat.key as TacticalCategory);
                    }}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Systems List */}
          <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
            {filteredSystems.map((sys) => {
              const isSelected = formation === sys.id;
              return (
                <TouchableOpacity
                  key={sys.id}
                  style={[styles.tacticalCard, isSelected && styles.tacticalCardActive]}
                  onPress={() => {
                    triggerHaptic();
                    if (sys.format !== format) {
                      setFormat(sys.format);
                    }
                    setFormation(sys.id);
                    setIsTacticalModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.tacticalCardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.tacticalCardTitle, isSelected && styles.tacticalCardTitleActive]}>
                        {sys.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        <View style={styles.formatBadge}>
                          <Text style={styles.formatBadgeText}>{sys.categoryLabel}</Text>
                        </View>
                        <View style={styles.styleBadge}>
                          <Text style={styles.styleBadgeText}>{sys.style}</Text>
                        </View>
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#000000" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                    )}
                  </View>

                  <Text style={styles.tacticalCardDesc}>{sys.description}</Text>

                  {sys.famousTeams && sys.famousTeams.length > 0 && (
                    <View style={styles.famousTeamsRow}>
                      <MaterialCommunityIcons name="trophy-outline" size={12} color="#FFD60A" style={{ marginRight: 4 }} />
                      <Text style={styles.famousTeamsText}>
                        {sys.famousTeams.join(' • ')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* 3. FORMAT SELECTION MODAL (APPLE ACTION SHEET / BOTTOM SHEET) */}
      <Modal
        visible={isFormatModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsFormatModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formatModalContainer}>
            <View style={styles.formatModalHeader}>
              <View>
                <Text style={styles.formatModalTitle}>Format de Match</Text>
                <Text style={styles.formatModalSubtitle}>Choisissez la formule de jeu</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFormatModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formatModalGrid}>
              {FORMAT_OPTIONS.map((fKey) => {
                const isSelected = format === fKey;
                const cfg = MATCH_FORMATS_CONFIG[fKey];
                return (
                  <TouchableOpacity
                    key={fKey}
                    style={[styles.formatGridCard, isSelected && styles.formatGridCardActive]}
                    onPress={() => {
                      handleSelectFormat(fKey);
                      setIsFormatModalVisible(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.formatGridCardLeft}>
                      <MaterialCommunityIcons
                        name={cfg.isFutsal ? 'floor-plan' : 'soccer-field'}
                        size={20}
                        color={isSelected ? '#FFD700' : '#8B8B9A'}
                      />
                      <View>
                        <Text style={[styles.formatGridCardTitle, isSelected && styles.formatGridCardTitleActive]}>
                          {cfg.name}
                        </Text>
                        <Text style={styles.formatGridCardSub}>
                          {cfg.starterCount} titulaires · {cfg.formations.length} formations
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#30D158" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. PROGRESSIVE MATCHDAY PREPARATION WIZARD MODAL (APPLE STEP-BY-STEP) */}
      <Modal
        visible={isWizardModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsWizardModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Wizard Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Préparation Guidée du Match</Text>
              <Text style={styles.modalSubtitle}>
                Étape {wizardStep}/3 · Assistant pas-à-pas ProDay
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsWizardModalVisible(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Stepper Progress Bar */}
          <View style={styles.wizardStepperRow}>
            {[
              { step: 1, label: '1. Dispositif' },
              { step: 2, label: '2. Titulaires' },
              { step: 3, label: '3. Validation' },
            ].map((s) => {
              const isCurrent = wizardStep === s.step;
              const isDone = wizardStep > s.step;
              return (
                <TouchableOpacity
                  key={s.step}
                  style={[styles.wizardStepChip, (isCurrent || isDone) && styles.wizardStepChipActive]}
                  onPress={() => setWizardStep(s.step as 1 | 2 | 3)}
                >
                  <Text style={[styles.wizardStepText, (isCurrent || isDone) && styles.wizardStepTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Step 1: Format & Dispositif */}
          {wizardStep === 1 && (
            <ScrollView style={styles.wizardContentScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.wizardSectionTitle}>Choisissez le format de jeu :</Text>
              <View style={styles.wizardFormatGrid}>
                {FORMAT_OPTIONS.map((fKey) => {
                  const cfg = MATCH_FORMATS_CONFIG[fKey];
                  const isSelected = format === fKey;
                  return (
                    <TouchableOpacity
                      key={fKey}
                      style={[styles.wizardFormatCard, isSelected && styles.wizardFormatCardActive]}
                      onPress={() => handleSelectFormat(fKey)}
                    >
                      <Text style={[styles.wizardFormatCardTitle, isSelected && styles.wizardFormatCardTitleActive]}>
                        {cfg.name}
                      </Text>
                      <Text style={styles.wizardFormatCardSub}>
                        {cfg.starterCount} titulaires · {cfg.formations.length} formations
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.wizardSectionTitle, { marginTop: 16 }]}>
                Sélectionnez le système tactique de départ :
              </Text>
              <View style={styles.wizardSystemsList}>
                {formatConfig.formations.map((fKey) => {
                  const sys = TACTICAL_SYSTEMS_BY_ID[fKey];
                  const isSelected = formation === fKey;
                  return (
                    <TouchableOpacity
                      key={fKey}
                      style={[styles.wizardSystemCard, isSelected && styles.wizardSystemCardActive]}
                      onPress={() => {
                        triggerHaptic();
                        setFormation(fKey);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.wizardSystemCardName, isSelected && styles.wizardSystemCardNameActive]}>
                          {sys ? sys.name : fKey}
                        </Text>
                        <Text style={styles.wizardSystemCardStyle}>
                          {sys ? sys.style : 'Animation classique'}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#30D158" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Step 2: Effectif Titulaire & Ajustements */}
          {wizardStep === 2 && (
            <ScrollView style={styles.wizardContentScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.wizardAiBanner}>
                <MaterialCommunityIcons name="magic-staff" size={18} color="#C5A059" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wizardAiTitle}>Optimisation IA de la Forme</Text>
                  <Text style={styles.wizardAiDesc}>
                    Titularise les joueurs au sommet de leur forme et préserve les joueurs fatigués.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.wizardAiBtn}
                  onPress={generateAiLineup}
                  disabled={isAiGenerating}
                >
                  <Text style={styles.wizardAiBtnText}>Optimiser</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.wizardSectionTitle}>
                Titulaires retenus ({starters.length}/{targetStartersCount}) :
              </Text>
              <View style={styles.wizardStartersGrid}>
                {starters.map((p) => (
                  <View key={p.id} style={styles.wizardPlayerRow}>
                    <View style={styles.wizardPlayerPos}>
                      <Text style={styles.wizardPlayerPosText}>{p.pos}</Text>
                    </View>
                    <Text style={styles.wizardPlayerName}>#{p.num} {p.name}</Text>
                    <Text style={styles.wizardPlayerOvr}>{p.ovr} OVR</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.wizardSectionTitle, { marginTop: 14 }]}>
                Banc des remplaçants ({subs.length} joueurs disponibles) :
              </Text>
              <Text style={styles.wizardBenchNote}>
                Les permutations fines peuvent s'effectuer directement sur le terrain 2D à l'issue de l'assistant.
              </Text>
            </ScrollView>
          )}

          {/* Step 3: Validation & Homologation */}
          {wizardStep === 3 && (
            <View style={styles.wizardStep3Container}>
              <View style={styles.wizardRecapCard}>
                <View style={styles.wizardRecapHeader}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="#30D158" />
                  <Text style={styles.wizardRecapTitle}>Feuille de Match Prête</Text>
                </View>

                <View style={styles.wizardRecapRow}>
                  <Text style={styles.wizardRecapLabel}>Format sélectionné :</Text>
                  <Text style={styles.wizardRecapVal}>{formatConfig.name}</Text>
                </View>

                <View style={styles.wizardRecapRow}>
                  <Text style={styles.wizardRecapLabel}>Système tactique :</Text>
                  <Text style={styles.wizardRecapVal}>{currentSystem ? currentSystem.name : formation}</Text>
                </View>

                <View style={styles.wizardRecapRow}>
                  <Text style={styles.wizardRecapLabel}>Titulaires validés :</Text>
                  <Text style={styles.wizardRecapVal}>{starters.length} joueurs ({teamOvr} GEN)</Text>
                </View>

                <View style={styles.wizardRecapRow}>
                  <Text style={styles.wizardRecapLabel}>Remplaçants sur le banc :</Text>
                  <Text style={styles.wizardRecapVal}>{subs.length} joueurs</Text>
                </View>

                <View style={styles.wizardOfficialBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#C5A059" />
                  <Text style={styles.wizardOfficialBadgeText}>
                    Synchronisé avec le flux FFF officiel · Homologation garantie
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.wizardConfirmFinalBtn}
                onPress={() => {
                  triggerHaptic();
                  setIsWizardModalVisible(false);
                  Alert.alert(
                    'Feuille de Match Validée',
                    'Le dispositif tactique et les titulaires ont été enregistrés avec succès. Le terrain 2D est actualisé.'
                  );
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.wizardConfirmFinalBtnText}>Appliquer et Retourner au Terrain</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wizard Footer Navigation */}
          <View style={styles.wizardFooter}>
            {wizardStep > 1 ? (
              <TouchableOpacity
                style={styles.wizardBackBtn}
                onPress={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3)}
              >
                <Feather name="arrow-left" size={14} color="#FFFFFF" />
                <Text style={styles.wizardBackBtnText}>Précédent</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}

            {wizardStep < 3 && (
              <TouchableOpacity
                style={styles.wizardNextBtn}
                onPress={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3)}
              >
                <Text style={styles.wizardNextBtnText}>Étape suivante</Text>
                <Feather name="arrow-right" size={14} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wizardHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  wizardHeaderBtnText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1F1F27',
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
  tacticalBarUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  formatPillUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  formatPillUnifiedText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formationPillUnified: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  formationPillUnifiedText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
    flex: 1,
  },
  aiPillUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  aiPillUnifiedLoading: {
    opacity: 0.7,
  },
  aiPillUnifiedText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  aiReportToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  aiReportToastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  aiReportToastText: {
    color: '#30D158',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formatModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#16161E',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  formatModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  formatModalSubtitle: {
    color: '#8B8B9A',
    fontSize: 11.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  formatModalGrid: {
    gap: 8,
  },
  formatGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E28',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-between',
  },
  formatGridCardActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  formatGridCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatGridCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formatGridCardTitleActive: {
    color: '#FFD700',
  },
  formatGridCardSub: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontFamily: '-apple-system',
  },
  tacticalControlPanel: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 10,
    marginBottom: 10,
  },
  popularRow: {
    marginBottom: 8,
  },
  activeSwapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  activeSwapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  swapIconHalo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(48, 209, 88, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSwapTitle: {
    color: '#30D158',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  activeSwapDesc: {
    color: '#E5E5EA',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  cancelSwapBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  cancelSwapText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  controlRowVertical: {
    marginBottom: 6,
  },
  controlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  openLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  openLibraryBtnText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  morePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
  },
  morePillText: {
    color: '#C5A059',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
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
  tacticalSystemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    marginBottom: 8,
  },
  tacticalSystemBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  tacticalSystemBannerTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  tacticalSystemBannerSubtitle: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  tacticalSystemBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tacticalSystemBannerCategory: {
    color: '#C5A059',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
    textTransform: 'uppercase',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0E',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    color: '#8B8B9A',
    fontSize: 11.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141418',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: '-apple-system',
    padding: 0,
  },
  modalCategoryRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalCategoryScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#16161D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  catChipText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  catChipTextActive: {
    color: '#C5A059',
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  tacticalCard: {
    backgroundColor: '#14141A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tacticalCardActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderColor: '#C5A059',
  },
  tacticalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tacticalCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  tacticalCardTitleActive: {
    color: '#C5A059',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  formatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  formatBadgeText: {
    color: '#A0A0B0',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  styleBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  styleBadgeText: {
    color: '#0A84FF',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tacticalCardDesc: {
    color: '#8B8B9A',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginTop: 4,
  },
  famousTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  famousTeamsText: {
    color: '#FFD60A',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
    flex: 1,
  },
  wizardStepperRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  wizardStepChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  wizardStepChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  wizardStepText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  wizardStepTextActive: {
    color: '#C5A059',
    fontWeight: '800',
  },
  wizardContentScroll: {
    flex: 1,
    padding: 16,
  },
  wizardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  wizardFormatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wizardFormatCard: {
    width: '48%',
    backgroundColor: '#16161C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
  },
  wizardFormatCardActive: {
    borderColor: '#C5A059',
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  wizardFormatCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardFormatCardTitleActive: {
    color: '#C5A059',
  },
  wizardFormatCardSub: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  wizardSystemsList: {
    gap: 6,
    paddingBottom: 24,
  },
  wizardSystemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
  },
  wizardSystemCardActive: {
    borderColor: '#30D158',
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
  },
  wizardSystemCardName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  wizardSystemCardNameActive: {
    color: '#30D158',
  },
  wizardSystemCardStyle: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontFamily: '-apple-system',
  },
  wizardAiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 12,
    marginBottom: 14,
  },
  wizardAiTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  wizardAiDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  wizardAiBtn: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  wizardAiBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardStartersGrid: {
    gap: 6,
  },
  wizardPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161C',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  wizardPlayerPos: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  wizardPlayerPosText: {
    color: '#FFD700',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardPlayerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
    flex: 1,
  },
  wizardPlayerOvr: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardBenchNote: {
    color: '#8B8B9A',
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: '-apple-system',
  },
  wizardStep3Container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  wizardRecapCard: {
    backgroundColor: '#16161C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  wizardRecapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  wizardRecapTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardRecapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  wizardRecapLabel: {
    color: '#8B8B9A',
    fontSize: 12,
    fontFamily: '-apple-system',
  },
  wizardRecapVal: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  wizardOfficialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  wizardOfficialBadgeText: {
    color: '#C5A059',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
    flex: 1,
  },
  wizardConfirmFinalBtn: {
    backgroundColor: '#30D158',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  wizardConfirmFinalBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  wizardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  wizardBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  wizardBackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  wizardNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  wizardNextBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
});
