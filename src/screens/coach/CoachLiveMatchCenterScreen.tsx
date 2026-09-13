import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LiveEvent {
  id: string;
  minute: number;
  type: 'goal' | 'assist' | 'yellow' | 'red' | 'sub' | 'shot';
  team: 'home' | 'away';
  text: string;
  officialFeed?: boolean;
}

interface MatchStat {
  label: string;
  home: number | string;
  away: number | string;
  homeRatio?: number; // 0..1
}

export const CoachLiveMatchCenterScreen: React.FC = () => {
  const [seconds, setSeconds] = useState(3840); // 64:00
  const [isRunning, setIsRunning] = useState(true);
  const [period, setPeriod] = useState<'1MT' | '2MT' | 'FIN'>('2MT');
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);

  // Automated Official League Data Feed state
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'voice'>('timeline');

  // Voice Scouting Notes (Innovation)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState(
    'Lucas doit resserrer son marquage sur le numéro 10 adverse à la perte de balle. Prévoir un travail de cadrage axial à la séance de mardi.'
  );
  const [drillConverted, setDrillConverted] = useState(false);

  // Live match events
  const [events, setEvents] = useState<LiveEvent[]>([
    { id: 'e1', minute: 23, type: 'goal', team: 'home', text: 'But de Yanis B. (Passe décisive de Rayan K.)', officialFeed: true },
    { id: 'e2', minute: 41, type: 'yellow', team: 'away', text: 'Carton Jaune pour Adv 4 (Tacle appuyé)', officialFeed: true },
    { id: 'e3', minute: 52, type: 'goal', team: 'away', text: 'Égalisation de RC France (Frappe 18m)', officialFeed: true },
    { id: 'e4', minute: 61, type: 'goal', team: 'home', text: 'But de Lucas M. (Transition offensive rapide)', officialFeed: true },
  ]);

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  // Chronometer timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const showFffCertificationInfo = () => {
    triggerHaptic();
    Alert.alert(
      'Feuille de Match Homologuée FFF',
      'Cette rencontre officielle est synchronisée en direct avec les flux de la fédération. Les scores, cartons et buts sont certifiés par le corps arbitral et ne peuvent faire l’objet d’aucune altération manuelle.'
    );
  };

  const toggleRecording = () => {
    triggerHaptic();
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceNote(
          'Dédoublement systématique de leur latéral gauche non suivi. Insister sur la couverture du second poteau à la prochaine séance.'
        );
        setDrillConverted(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const convertNoteToDrill = () => {
    triggerHaptic();
    setDrillConverted(true);
    Alert.alert(
      'Atelier d’Entraînement Créé',
      'La note vocale a été transformée en exercice : "Circuit Transition Défensive & Cadrage Axial", injecté directement dans votre Planificateur de Séances.'
    );
  };

  const officialStats: MatchStat[] = [
    { label: 'Possession de Balle', home: '58%', away: '42%', homeRatio: 0.58 },
    { label: 'Tirs Totaux', home: 12, away: 7, homeRatio: 12 / 19 },
    { label: 'Tirs Cadrés', home: 6, away: 3, homeRatio: 6 / 9 },
    { label: 'Corners', home: 5, away: 2, homeRatio: 5 / 7 },
    { label: 'Fautes Commises', home: 8, away: 11, homeRatio: 8 / 19 },
    { label: 'Hors-jeu', home: 1, away: 3, homeRatio: 1 / 4 },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header: Apple Design & Official League Synchronization Status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Match Center Live</Text>
            <Text style={styles.headerSubtitle}>R1 Poule B · J17 · Stade d’Honneur</Text>
          </View>

          {/* Badge Homologation FFF Officiel */}
          <TouchableOpacity
            style={styles.overrideToggleBtn}
            onPress={showFffCertificationInfo}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="shield-check"
              size={13}
              color="#30D158"
            />
            <Text style={styles.overrideToggleText}>
              Homologué FFF
            </Text>
          </TouchableOpacity>
        </View>

        {/* Automated League Feed Status Bar */}
        <View style={styles.feedStatusBar}>
          <View style={styles.feedStatusLeft}>
            <View style={styles.feedDot} />
            <Text style={styles.feedStatusText}>
              🟢 Flux Officiel FFF en Direct · Feuille de match scellée (J17)
            </Text>
          </View>
          <Text style={styles.feedStatusMeta}>Arbitrage officiel</Text>
        </View>
      </View>

      {/* 2. Scoreboard Hero Centerpiece */}
      <View style={styles.scoreHero}>
        <View style={styles.periodRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT · {period}</Text>
          </View>
          <Text style={styles.chronoText}>{formatTime(seconds)}</Text>
          <TouchableOpacity
            style={styles.chronoControlBtn}
            onPress={() => {
              triggerHaptic();
              setIsRunning(!isRunning);
            }}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Big Score Display */}
        <View style={styles.scoreBoardRow}>
          <View style={styles.scoreTeam}>
            <Text numberOfLines={1} style={styles.scoreTeamName}>FC ProDay</Text>
            <Text style={styles.scoreTeamLoc}>1er (38 pts)</Text>
          </View>

          <View style={styles.scoreDigitsBox}>
            <Text style={styles.scoreDigit}>{homeScore}</Text>
            <Text style={styles.scoreDash}>-</Text>
            <Text style={styles.scoreDigit}>{awayScore}</Text>
          </View>

          <View style={styles.scoreTeam}>
            <Text numberOfLines={1} style={styles.scoreTeamName}>RC France</Text>
            <Text style={styles.scoreTeamLoc}>2e (35 pts)</Text>
          </View>
        </View>

        {/* Live Standings Impact Strip */}
        <View style={styles.standingsImpactStrip}>
          <MaterialCommunityIcons name="trending-up" size={14} color="#30D158" />
          <Text style={styles.standingsImpactText}>
            Impact Direct : FC ProDay conforte sa 1ère place (41 pts) · +6 pts d’avance
          </Text>
        </View>

        {/* Official FFF Verification Strip & Coach Scouting Access */}
        <View style={styles.quickActionStrip}>
          <View style={styles.officialLockBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={13} color="#30D158" />
            <Text style={styles.officialLockText}>
              Feuille officielle FFF scellée · Arbitrage officiel
            </Text>
          </View>

          <TouchableOpacity
            style={styles.scoutingQuickBtn}
            onPress={() => {
              triggerHaptic();
              setActiveTab('voice');
            }}
          >
            <Feather name="mic" size={12} color="#C5A059" />
            <Text style={styles.scoutingQuickBtnText}>Scouting Live</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Apple Segmented Control Bar */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'timeline' && styles.segmentBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('timeline');
          }}
        >
          <MaterialCommunityIcons
            name="timeline-clock-outline"
            size={13}
            color={activeTab === 'timeline' ? '#FFFFFF' : '#8B8B9A'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'timeline' && styles.segmentBtnTextActive]}>
            Fil du Match ({events.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'stats' && styles.segmentBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('stats');
          }}
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={13}
            color={activeTab === 'stats' ? '#FFFFFF' : '#8B8B9A'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'stats' && styles.segmentBtnTextActive]}>
            Stats FFF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'voice' && styles.segmentBtnActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('voice');
          }}
        >
          <MaterialCommunityIcons
            name="microphone-outline"
            size={13}
            color={activeTab === 'voice' ? '#FFFFFF' : '#8B8B9A'}
          />
          <Text style={[styles.segmentBtnText, activeTab === 'voice' && styles.segmentBtnTextActive]}>
            Dictée Coach
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: OFFICIAL MATCH TIMELINE */}
      {activeTab === 'timeline' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#30D158" />
            <Text style={styles.cardTitle}>Faits de Jeu & Homologation FFF</Text>
          </View>

          <View style={styles.timelineList}>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={styles.eventMinBadge}>
                  <Text style={styles.eventMinText}>{ev.minute}’</Text>
                </View>

                <View style={styles.eventIconWrap}>
                  <MaterialCommunityIcons
                    name={
                      ev.type === 'goal'
                        ? 'soccer'
                        : ev.type === 'yellow'
                        ? 'card'
                        : ev.type === 'sub'
                        ? 'swap-vertical'
                        : 'bell-outline'
                    }
                    size={15}
                    color={
                      ev.type === 'goal'
                        ? '#30D158'
                        : ev.type === 'yellow'
                        ? '#FFD60A'
                        : '#0A84FF'
                    }
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.eventText}>{ev.text}</Text>
                  <Text style={styles.eventMeta}>
                    {ev.officialFeed ? 'Homologué Arbitre FFF' : 'Saisie Coach Locale'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: OFFICIAL MATCH STATS (FFF DATA SYNC) */}
      {activeTab === 'stats' && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-box-outline" size={16} color="#C5A059" />
            <Text style={styles.cardTitle}>Statistiques Officielles en Direct</Text>
          </View>

          <View style={styles.statsList}>
            {officialStats.map((st, i) => (
              <View key={i} style={styles.statItem}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statValueHome}>{st.home}</Text>
                  <Text style={styles.statLabel}>{st.label}</Text>
                  <Text style={styles.statValueAway}>{st.away}</Text>
                </View>

                {st.homeRatio !== undefined && (
                  <View style={styles.statBarTrack}>
                    <View style={[styles.statBarFillHome, { width: `${st.homeRatio * 100}%` }]} />
                    <View style={[styles.statBarFillAway, { width: `${(1 - st.homeRatio) * 100}%` }]} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 3: VOICE-TO-TEXT LIVE SCOUTING & DRILL CONVERTER */}
      {activeTab === 'voice' && (
        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <View style={styles.voiceHeaderLeft}>
              <MaterialCommunityIcons name="microphone-message" size={18} color="#0A84FF" />
              <View>
                <Text style={styles.voiceTitle}>Dictée de Banc & Ateliers IA</Text>
                <Text style={styles.voiceSubtitle}>Remarques tactiques transformées en exercices</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnRecording]}
              activeOpacity={0.8}
              onPress={toggleRecording}
            >
              <Ionicons name={isRecording ? 'radio' : 'mic'} size={15} color="#FFFFFF" />
              <Text style={styles.micBtnText}>{isRecording ? 'Écoute...' : 'Dicter'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transcriptionBox}>
            <Feather name="message-square" size={13} color="#C5A059" style={{ marginTop: 2 }} />
            <Text style={styles.transcriptionText}>« {voiceNote} »</Text>
          </View>

          <TouchableOpacity
            style={[styles.convertDrillBtn, drillConverted && styles.convertDrillBtnDone]}
            activeOpacity={0.8}
            onPress={convertNoteToDrill}
          >
            <MaterialCommunityIcons
              name={drillConverted ? 'check-circle' : 'auto-fix'}
              size={16}
              color={drillConverted ? '#30D158' : '#000000'}
            />
            <Text style={[styles.convertDrillText, drillConverted && { color: '#30D158' }]}>
              {drillConverted
                ? 'Exercice IA injecté dans le Planificateur'
                : 'Convertir en Exercice d’Entraînement'}
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginTop: 1,
  },
  overrideToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  overrideToggleBtnActive: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  overrideToggleText: {
    color: '#30D158',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  overrideToggleTextActive: {
    color: '#FFD700',
  },
  feedStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  feedStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  feedDotManual: {
    backgroundColor: '#FFD700',
  },
  feedStatusText: {
    color: '#E5E5EA',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  feedStatusMeta: {
    color: '#8B8B9A',
    fontSize: 9.5,
    fontFamily: '-apple-system',
  },
  scoreHero: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF453A',
  },
  liveText: {
    color: '#FF453A',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  chronoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  chronoControlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreTeam: {
    flex: 1,
    alignItems: 'center',
  },
  scoreTeamName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  scoreTeamLoc: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  scoreDigitsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F0F14',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scoreDigit: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: '-apple-system',
  },
  scoreDash: {
    color: '#8B8B9A',
    fontSize: 20,
    fontWeight: '600',
  },
  standingsImpactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  standingsImpactText: {
    color: '#30D158',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  quickActionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  officialLockBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  officialLockText: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  scoutingQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  scoutingQuickBtnText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  quickEventBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickEventText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
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
  card: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  timelineList: {
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  eventMinBadge: {
    backgroundColor: '#1E1E28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  eventMinText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  eventIconWrap: {
    width: 22,
    alignItems: 'center',
  },
  eventText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  eventMeta: {
    color: '#8B8B9A',
    fontSize: 9.5,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  statsList: {
    gap: 12,
  },
  statItem: {
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValueHome: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
    width: 40,
  },
  statLabel: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
    textAlign: 'center',
    flex: 1,
  },
  statValueAway: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
    width: 40,
    textAlign: 'right',
  },
  statBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statBarFillHome: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  statBarFillAway: {
    height: '100%',
    backgroundColor: '#0A84FF',
  },
  voiceCard: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    padding: 14,
    marginBottom: 10,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  voiceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  voiceTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  voiceSubtitle: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0A84FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  micBtnRecording: {
    backgroundColor: '#FF453A',
  },
  micBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  transcriptionBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1C1C24',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  transcriptionText: {
    flex: 1,
    color: '#D1D1D6',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    fontFamily: '-apple-system',
  },
  convertDrillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 9,
  },
  convertDrillBtnDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: '#30D158',
  },
  convertDrillText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
});
