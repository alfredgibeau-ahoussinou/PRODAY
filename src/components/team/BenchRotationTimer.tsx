import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface MatchPlayerTime {
  id: string;
  name: string;
  number?: number;
  position?: string;
  isOnPitch: boolean;
  minutesPlayed: number;
  secondsPlayed: number;
  lastSubstitutedAt?: number;
}

interface BenchRotationTimerProps {
  visible: boolean;
  onClose: () => void;
  matchTitle?: string;
  initialPlayers?: Array<{ id: string; name: string; number?: number; position?: string }>;
  targetMinutesPerPlayer?: number;
}

export const BenchRotationTimer: React.FC<BenchRotationTimerProps> = ({
  visible,
  onClose,
  matchTitle = 'Match en direct',
  initialPlayers = [],
  targetMinutesPerPlayer = 25,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [half, setHalf] = useState<1 | 2>(1);
  const [selectedOnPitch, setSelectedOnPitch] = useState<string | null>(null);
  const [selectedOnBench, setSelectedOnBench] = useState<string | null>(null);

  const [players, setPlayers] = useState<MatchPlayerTime[]>(() => {
    if (initialPlayers.length > 0) {
      return initialPlayers.map((p, idx) => ({
        id: p.id,
        name: p.name,
        number: p.number ?? idx + 1,
        position: p.position ?? 'JOUEUR',
        isOnPitch: idx < 11,
        minutesPlayed: 0,
        secondsPlayed: 0,
      }));
    }
    return [
      { id: '1', name: 'Hugo Lloris', number: 1, position: 'G', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '2', name: 'Benjamin Pavard', number: 2, position: 'D', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '3', name: 'Raphaël Varane', number: 4, position: 'D', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '4', name: 'Dayot Upamecano', number: 5, position: 'D', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '5', name: 'Théo Hernandez', number: 22, position: 'D', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '6', name: 'Aurélien Tchouaméni', number: 8, position: 'M', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '7', name: 'Adrien Rabiot', number: 14, position: 'M', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '8', name: 'Antoine Griezmann', number: 7, position: 'M', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '9', name: 'Ousmane Dembélé', number: 11, position: 'A', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '10', name: 'Olivier Giroud', number: 9, position: 'A', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '11', name: 'Kylian Mbappé', number: 10, position: 'A', isOnPitch: true, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '12', name: 'Eduardo Camavinga', number: 12, position: 'M', isOnPitch: false, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '13', name: 'Kingsley Coman', number: 20, position: 'A', isOnPitch: false, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '14', name: 'Youssouf Fofana', number: 13, position: 'M', isOnPitch: false, minutesPlayed: 0, secondsPlayed: 0 },
      { id: '15', name: 'Ibrahima Konaté', number: 24, position: 'D', isOnPitch: false, minutesPlayed: 0, secondsPlayed: 0 },
    ];
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setMatchSeconds((s) => s + 1);
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.isOnPitch) {
              const totalSec = p.secondsPlayed + 1;
              return {
                ...p,
                secondsPlayed: totalSec,
                minutesPlayed: Math.floor(totalSec / 60),
              };
            }
            return p;
          })
        );
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    Alert.alert('Réinitialiser le chronomètre', 'Voulez-vous remettre à zéro le temps de jeu de tous les joueurs ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => {
          setIsRunning(false);
          setMatchSeconds(0);
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              minutesPlayed: 0,
              secondsPlayed: 0,
            }))
          );
        },
      },
    ]);
  };

  const handleSub = () => {
    if (!selectedOnPitch || !selectedOnBench) {
      Alert.alert('Sélection requise', 'Sélectionnez un joueur sur le terrain et un remplaçant sur le banc pour effectuer le changement.');
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === selectedOnPitch) {
          return { ...p, isOnPitch: false, lastSubstitutedAt: Date.now() };
        }
        if (p.id === selectedOnBench) {
          return { ...p, isOnPitch: true, lastSubstitutedAt: Date.now() };
        }
        return p;
      })
    );

    setSelectedOnPitch(null);
    setSelectedOnBench(null);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pitchPlayers = players.filter((p) => p.isOnPitch);
  const benchPlayers = players.filter((p) => !p.isOnPitch);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{matchTitle}</Text>
              <Text style={styles.subtitle}>Gestion des rotations & Temps de jeu équitable</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Master Chrono Display */}
          <View style={styles.chronoCard}>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{half === 1 ? '1ère Mi-temps' : '2ème Mi-temps'}</Text>
            </View>
            <Text style={styles.timerNumber}>{formatTimer(matchSeconds)}</Text>
            <View style={styles.timerControls}>
              <TouchableOpacity
                style={[styles.actionBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
                onPress={toggleTimer}
              >
                <MaterialCommunityIcons
                  name={isRunning ? 'pause' : 'play'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionBtnText}>{isRunning ? 'PAUSE' : 'LANCER'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.periodToggleBtn}
                onPress={() => setHalf(half === 1 ? 2 : 1)}
              >
                <MaterialCommunityIcons name="sync" size={18} color="#0284C7" />
                <Text style={styles.periodToggleText}>Mi-temps {half === 1 ? '2' : '1'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
                <MaterialCommunityIcons name="refresh" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Substitution Action Bar if both selected */}
          {selectedOnPitch && selectedOnBench && (
            <View style={styles.subBanner}>
              <View style={styles.subNames}>
                <Text style={styles.subOutText}>
                  Sort : {players.find((p) => p.id === selectedOnPitch)?.name}
                </Text>
                <Text style={styles.subInText}>
                  Entre : {players.find((p) => p.id === selectedOnBench)?.name}
                </Text>
              </View>
              <TouchableOpacity style={styles.confirmSubBtn} onPress={handleSub}>
                <MaterialCommunityIcons name="swap-horizontal-bold" size={22} color="#FFFFFF" />
                <Text style={styles.confirmSubText}>Valider Changement</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.scrollArea}>
            {/* Pitch Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="soccer-field" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>SUR LE TERRAIN ({pitchPlayers.length})</Text>
              </View>
              <Text style={styles.sectionHint}>Tapez un joueur pour le faire sortir</Text>
            </View>

            {pitchPlayers.map((player) => {
              const isSelected = selectedOnPitch === player.id;
              const hasMetTarget = player.minutesPlayed >= targetMinutesPerPlayer;
              return (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerRow,
                    isSelected && styles.playerRowSelected,
                    hasMetTarget && styles.playerRowTargetMet,
                  ]}
                  onPress={() => setSelectedOnPitch(isSelected ? null : player.id)}
                >
                  <View style={styles.playerNumBadge}>
                    <Text style={styles.playerNumText}>{player.number ?? '-'}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPos}>{player.position}</Text>
                  </View>
                  <View style={styles.playerTimeBox}>
                    <MaterialCommunityIcons name="timer-outline" size={16} color="#059669" />
                    <Text style={styles.playerTimeText}>{player.minutesPlayed}' min</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Bench Section */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="seat" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>SUR LE BANC ({benchPlayers.length})</Text>
              </View>
              <Text style={styles.sectionHint}>Tapez un remplaçant pour le faire entrer</Text>
            </View>

            {benchPlayers.map((player) => {
              const isSelected = selectedOnBench === player.id;
              const lowPlayTime = player.minutesPlayed < targetMinutesPerPlayer / 2;
              return (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerRow,
                    styles.benchRow,
                    isSelected && styles.playerRowSelectedBench,
                  ]}
                  onPress={() => setSelectedOnBench(isSelected ? null : player.id)}
                >
                  <View style={[styles.playerNumBadge, styles.benchNumBadge]}>
                    <Text style={styles.benchNumText}>{player.number ?? '-'}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPos}>{player.position} (Banc)</Text>
                  </View>
                  <View style={styles.benchTimeBox}>
                    {lowPlayTime && (
                      <View style={styles.alertDot} />
                    )}
                    <Text style={styles.benchTimeText}>{player.minutesPlayed}' min</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  chronoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  periodText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timerNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  startBtn: {
    backgroundColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  periodToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  periodToggleText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 12,
  },
  subBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  subNames: {
    flex: 1,
  },
  subOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  subInText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  confirmSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  confirmSubText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerRowSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  playerRowSelectedBench: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  playerRowTargetMet: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  benchRow: {
    opacity: 0.85,
  },
  playerNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  benchNumBadge: {
    backgroundColor: '#475569',
  },
  benchNumText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerPos: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  playerTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  playerTimeText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
  },
  benchTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benchTimeText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});
