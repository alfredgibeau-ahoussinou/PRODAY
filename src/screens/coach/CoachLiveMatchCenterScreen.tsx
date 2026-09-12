import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface LiveEvent {
  id: string;
  minute: number;
  type: 'goal' | 'assist' | 'yellow' | 'red' | 'sub' | 'shot';
  team: 'home' | 'away';
  text: string;
}

interface TagMetric {
  id: string;
  label: string;
  count: number;
  color: string;
}

export const CoachLiveMatchCenterScreen: React.FC = () => {
  const [seconds, setSeconds] = useState(3840); // 64:00
  const [isRunning, setIsRunning] = useState(true);
  const [period, setPeriod] = useState<'1MT' | '2MT' | 'FIN'>('2MT');
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);

  // Nacsport-style live tagging matrix
  const [tags, setTags] = useState<TagMetric[]>([
    { id: 'press', label: 'Pressing Haut Réussi', count: 14, color: '#30D158' },
    { id: 'perte', label: 'Perte Dangereuse', count: 5, color: '#FF453A' },
    { id: 'trans', label: 'Transition Rapide', count: 9, color: '#0A84FF' },
    { id: 'cpa', label: 'Occasion CPA', count: 6, color: '#C5A059' },
    { id: 'duel', label: 'Duel Aérien Gagné', count: 18, color: '#BF5AF2' },
  ]);

  // Live match events
  const [events, setEvents] = useState<LiveEvent[]>([
    { id: 'e1', minute: 23, type: 'goal', team: 'home', text: 'But de Yanis B. (Passe de Rayan K.)' },
    { id: 'e2', minute: 41, type: 'yellow', team: 'away', text: 'Carton Jaune pour Adv 4 (Tacle appuyé)' },
    { id: 'e3', minute: 52, type: 'goal', team: 'away', text: 'Égalisation de RC France (Frappe 18m)' },
    { id: 'e4', minute: 61, type: 'goal', team: 'home', text: 'But de Lucas M. (Transition rapide)' },
  ]);

  // Voice Scouting Notes (Innovation)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState(
    'Lucas doit resserrer son marquage sur le numéro 10 adverse à la perte de balle. Prévoir un travail de cadrage axial à la séance de mardi.'
  );
  const [drillConverted, setDrillConverted] = useState(false);

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

  const incrementTag = (id: string) => {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, count: t.count + 1 } : t))
    );
  };

  const addEvent = (type: LiveEvent['type'], team: 'home' | 'away', text: string) => {
    const min = Math.floor(seconds / 60);
    setEvents((prev) => [
      { id: Date.now().toString(), minute: min, type, team, text },
      ...prev,
    ]);
    if (type === 'goal') {
      if (team === 'home') setHomeScore((s) => s + 1);
      else setAwayScore((s) => s + 1);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceNote(
          'Dédoublement systématique de leur latéral gauche non suivi. Insister sur la couverture du second poteau.'
        );
        setDrillConverted(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const convertNoteToDrill = () => {
    setDrillConverted(true);
    Alert.alert(
      'Atelier d’Entraînement Créé',
      'La note vocale a été analysée par l’IA et transformée en exercice : "Circuit Transition Défensive & Cadrage Axial", ajouté au Planificateur de Séances.'
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Scoreboard Hero & Live Stopwatch */}
      <View style={styles.scoreHero}>
        <View style={styles.periodRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT · {period}</Text>
          </View>
          <Text style={styles.chronoText}>{formatTime(seconds)}</Text>
          <TouchableOpacity
            style={styles.chronoControlBtn}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Big Score Display */}
        <View style={styles.scoreBoardRow}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamName}>FC ProDay</Text>
            <Text style={styles.scoreTeamLoc}>Domicile</Text>
          </View>

          <View style={styles.scoreDigitsBox}>
            <Text style={styles.scoreDigit}>{homeScore}</Text>
            <Text style={styles.scoreDash}>-</Text>
            <Text style={styles.scoreDigit}>{awayScore}</Text>
          </View>

          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamName}>RC France</Text>
            <Text style={styles.scoreTeamLoc}>Extérieur</Text>
          </View>
        </View>

        {/* Instant Goal / Card Quick Action Buttons */}
        <View style={styles.quickEventRow}>
          <TouchableOpacity
            style={[styles.quickEventBtn, { backgroundColor: 'rgba(48, 209, 88, 0.2)' }]}
            onPress={() => addEvent('goal', 'home', 'But de Yanis B.')}
          >
            <MaterialCommunityIcons name="soccer" size={16} color="#30D158" />
            <Text style={[styles.quickEventText, { color: '#30D158' }]}>+ But ProDay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickEventBtn, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}
            onPress={() => addEvent('goal', 'away', 'But de RC France')}
          >
            <MaterialCommunityIcons name="soccer" size={16} color="#FF453A" />
            <Text style={[styles.quickEventText, { color: '#FF453A' }]}>+ But Adv</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickEventBtn, { backgroundColor: 'rgba(255, 214, 10, 0.2)' }]}
            onPress={() => addEvent('yellow', 'home', 'Carton Jaune')}
          >
            <MaterialCommunityIcons name="card-outline" size={16} color="#FFD60A" />
            <Text style={[styles.quickEventText, { color: '#FFD60A' }]}>Carton</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickEventBtn, { backgroundColor: 'rgba(10, 132, 255, 0.2)' }]}
            onPress={() => addEvent('sub', 'home', 'Changement')}
          >
            <MaterialCommunityIcons name="swap-vertical" size={16} color="#0A84FF" />
            <Text style={[styles.quickEventText, { color: '#0A84FF' }]}>Changement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Nacsport-Style Live Tagging Matrix */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="tag-multiple-outline" size={18} color="#C5A059" />
          <Text style={styles.cardTitle}>Matrice de Live-Tagging Vidéo (Nacsport Pro)</Text>
        </View>
        <Text style={styles.cardSubtitle}>Appuyez pour indexer l’action avec le timestamp du match</Text>

        <View style={styles.tagsGrid}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagButton, { borderColor: tag.color }]}
              activeOpacity={0.7}
              onPress={() => incrementTag(tag.id)}
            >
              <View style={[styles.tagBadgeCount, { backgroundColor: tag.color }]}>
                <Text style={styles.tagBadgeCountText}>{tag.count}</Text>
              </View>
              <Text style={styles.tagLabel}>{tag.label}</Text>
              <MaterialCommunityIcons name="plus" size={14} color={tag.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Voice-to-Text Live Scouting & Drill Auto-Converter (INNOVATION) */}
      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <View style={styles.voiceHeaderLeft}>
            <MaterialCommunityIcons name="microphone-message" size={20} color="#0A84FF" />
            <View>
              <Text style={styles.voiceTitle}>Scouting Vocal Direct & Convertisseur d’Ateliers</Text>
              <Text style={styles.voiceSubtitle}>Dictée vocale transcrite et connectée aux entraînements</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnRecording]}
            activeOpacity={0.8}
            onPress={toggleRecording}
          >
            <Ionicons name={isRecording ? 'radio' : 'mic'} size={18} color="#FFFFFF" />
            <Text style={styles.micBtnText}>{isRecording ? 'Écoute...' : 'Dicter'}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Speech-to-Text Transcription Bubble */}
        <View style={styles.transcriptionBox}>
          <Feather name="message-square" size={14} color="#C5A059" style={{ marginTop: 2 }} />
          <Text style={styles.transcriptionText}>« {voiceNote} »</Text>
        </View>

        {/* 1-Tap Auto-Convert Button */}
        <TouchableOpacity
          style={[styles.convertDrillBtn, drillConverted && styles.convertDrillBtnDone]}
          activeOpacity={0.8}
          onPress={convertNoteToDrill}
        >
          <MaterialCommunityIcons
            name={drillConverted ? 'check-circle' : 'auto-fix'}
            size={18}
            color={drillConverted ? '#30D158' : '#000000'}
          />
          <Text style={[styles.convertDrillText, drillConverted && { color: '#30D158' }]}>
            {drillConverted
              ? 'Exercice IA créé dans le planificateur'
              : 'Générer l’exercice d’entraînement adapté'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Match Feed Timeline */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="timeline-clock-outline" size={18} color="#8B8B9A" />
          <Text style={styles.cardTitle}>Fil du Match & Faits de Jeu</Text>
        </View>

        {events.map((ev) => (
          <View key={ev.id} style={styles.eventRow}>
            <View style={styles.eventMinBadge}>
              <Text style={styles.eventMinText}>{ev.minute}’</Text>
            </View>
            <View style={styles.eventIcon}>
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
                size={16}
                color={
                  ev.type === 'goal'
                    ? '#30D158'
                    : ev.type === 'yellow'
                    ? '#FFD60A'
                    : '#0A84FF'
                }
              />
            </View>
            <Text style={styles.eventText}>{ev.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreHero: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  chronoControlBtn: {
    backgroundColor: '#1C1C22',
    padding: 6,
    borderRadius: 8,
  },
  scoreBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  scoreTeam: {
    alignItems: 'center',
    width: 100,
  },
  scoreTeamName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
    textAlign: 'center',
  },
  scoreTeamLoc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  scoreDigitsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreDigit: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: '-apple-system',
  },
  scoreDash: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B8B9A',
  },
  quickEventRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickEventBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickEventText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  card: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  cardSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  tagBadgeCount: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tagLabel: {
    color: '#E5E5EA',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  voiceCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    padding: 14,
    marginBottom: 14,
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
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  micBtnRecording: {
    backgroundColor: '#FF453A',
  },
  micBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  transcriptionBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1C1C22',
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
    paddingVertical: 10,
  },
  convertDrillBtnDone: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: '#30D158',
  },
  convertDrillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
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
    backgroundColor: '#1C1C22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventMinText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '700',
  },
  eventIcon: {
    width: 22,
    alignItems: 'center',
  },
  eventText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: '-apple-system',
  },
});
