import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';

interface SquadMember {
  id: string;
  num: number;
  name: string;
  role: 'starter' | 'sub' | 'unselected';
  pos: 'GB' | 'LD' | 'DC' | 'LG' | 'MDC' | 'MC' | 'MO' | 'AD' | 'AG' | 'BU';
  rsvp: 'present' | 'absent' | 'pending' | 'injured';
  rating: number; // 0-10
  fatigueRisk: boolean;
}

const INITIAL_SQUAD: SquadMember[] = [
  { id: '1', num: 1, name: 'Hugo L.', role: 'starter', pos: 'GB', rsvp: 'present', rating: 7.8, fatigueRisk: false },
  { id: '2', num: 2, name: 'Malik B.', role: 'starter', pos: 'LD', rsvp: 'present', rating: 7.2, fatigueRisk: false },
  { id: '3', num: 4, name: 'Axel P.', role: 'starter', pos: 'DC', rsvp: 'present', rating: 8.1, fatigueRisk: false },
  { id: '4', num: 5, name: 'Kévin D.', role: 'starter', pos: 'DC', rsvp: 'present', rating: 7.6, fatigueRisk: false },
  { id: '5', num: 3, name: 'Enzo S.', role: 'starter', pos: 'LG', rsvp: 'present', rating: 7.4, fatigueRisk: false },
  { id: '6', num: 6, name: 'Thomas D.', role: 'starter', pos: 'MDC', rsvp: 'present', rating: 7.9, fatigueRisk: true },
  { id: '7', num: 8, name: 'Mathis R.', role: 'starter', pos: 'MC', rsvp: 'present', rating: 8.3, fatigueRisk: false },
  { id: '8', num: 10, name: 'Rayan K.', role: 'starter', pos: 'MO', rsvp: 'present', rating: 8.7, fatigueRisk: false },
  { id: '9', num: 7, name: 'Lucas M.', role: 'starter', pos: 'AD', rsvp: 'present', rating: 8.0, fatigueRisk: true },
  { id: '10', num: 9, name: 'Yanis B.', role: 'starter', pos: 'BU', rsvp: 'present', rating: 8.5, fatigueRisk: false },
  { id: '11', num: 11, name: 'Sofiane T.', role: 'starter', pos: 'AG', rsvp: 'present', rating: 7.7, fatigueRisk: false },
  // Subs
  { id: '12', num: 12, name: 'Bastien F.', role: 'sub', pos: 'DC', rsvp: 'present', rating: 7.0, fatigueRisk: false },
  { id: '13', num: 14, name: 'Adrien V.', role: 'sub', pos: 'MC', rsvp: 'present', rating: 7.3, fatigueRisk: false },
  { id: '14', num: 16, name: 'Nassim G.', role: 'sub', pos: 'BU', rsvp: 'present', rating: 7.5, fatigueRisk: false },
  { id: '15', num: 18, name: 'Julien M.', role: 'sub', pos: 'GB', rsvp: 'present', rating: 6.9, fatigueRisk: false },
  { id: '16', num: 17, name: 'Florian C.', role: 'sub', pos: 'AD', rsvp: 'present', rating: 7.1, fatigueRisk: false },
  // Pending / Absent
  { id: '17', num: 19, name: 'Sami B.', role: 'unselected', pos: 'MC', rsvp: 'pending', rating: 6.8, fatigueRisk: false },
  { id: '18', num: 20, name: 'Romain L.', role: 'unselected', pos: 'LG', rsvp: 'injured', rating: 7.2, fatigueRisk: true },
  { id: '19', num: 21, name: 'Karim Z.', role: 'unselected', pos: 'BU', rsvp: 'absent', rating: 6.7, fatigueRisk: false },
];

export const CoachSquadScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'convocations' | 'composition' | 'classement'>('composition');
  const [squad, setSquad] = useState<SquadMember[]>(INITIAL_SQUAD);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // RSVP statistics
  const presentCount = squad.filter((p) => p.rsvp === 'present').length;
  const pendingCount = squad.filter((p) => p.rsvp === 'pending').length;
  const absentCount = squad.filter((p) => p.rsvp === 'absent').length;
  const injuredCount = squad.filter((p) => p.rsvp === 'injured').length;

  const starters = squad.filter((p) => p.role === 'starter');
  const subs = squad.filter((p) => p.role === 'sub');

  const generateAiLineup = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      Alert.alert(
        'Composition Optimale IA Générée',
        'Le XI de départ a été optimisé selon les présences RSVP, la charge athlétique GPS et le profil de transition de RC France.'
      );
    }, 800);
  };

  const sendRsvpReminders = () => {
    Alert.alert(
      'Relances Automatiques Envoyées',
      `Notification Push et message WhatsApp envoyés aux ${pendingCount} joueur(s) n’ayant pas encore répondu.`
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header & Segment Tabs */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Effectif, Convocations & Composition</Text>
          <Text style={styles.headerSubtitle}>RC France · Dimanche 15:00</Text>
        </View>

        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'composition' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('composition')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'composition' && styles.segmentBtnTextActive]}>
              Composition IA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'convocations' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('convocations')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'convocations' && styles.segmentBtnTextActive]}>
              RSVP & Convocs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'classement' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('classement')}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'classement' && styles.segmentBtnTextActive]}>
              Classement
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. RSVP Barometer Summary */}
      <View style={styles.rsvpBarometerCard}>
        <View style={styles.rsvpBarometerTop}>
          <Text style={styles.rsvpTitle}>Statut des Réponses Convocations</Text>
          {pendingCount > 0 && (
            <TouchableOpacity style={styles.reminderBtn} onPress={sendRsvpReminders}>
              <MaterialCommunityIcons name="bell-ring-outline" size={14} color="#C5A059" />
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

      {/* TAB CONTENT: COMPOSITION IA */}
      {activeTab === 'composition' && (
        <>
          {/* AI Lineup Generator Trigger */}
          <View style={styles.aiGeneratorCard}>
            <View style={styles.aiGenTop}>
              <MaterialCommunityIcons name="star-four-points" size={18} color="#C5A059" />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiGenTitle}>Générateur de Composition IA</Text>
                <Text style={styles.aiGenDesc}>Évalue la forme athlétique, l’historique de notes et le style de RC France</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.aiGenActionBtn}
              activeOpacity={0.8}
              onPress={generateAiLineup}
            >
              <MaterialCommunityIcons name="magic-staff" size={16} color="#000000" />
              <Text style={styles.aiGenActionText}>
                {isAiGenerating ? 'Optimisation en cours...' : 'Générer XI de Départ Optimal'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Starters List (XI de Départ) */}
          <View style={styles.rosterCard}>
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>Titulaires ({starters.length}/11) · Système 4-3-3</Text>
              <View style={styles.validBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#30D158" />
                <Text style={styles.validBadgeText}>Complet</Text>
              </View>
            </View>

            {starters.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={styles.posBadge}>
                  <Text style={styles.posBadgeText}>{player.pos}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerMeta}>Note saison : {player.rating}/10</Text>
                </View>
                {player.fatigueRisk && (
                  <View style={styles.fatiguePill}>
                    <Feather name="alert-circle" size={12} color="#FF9F0A" />
                    <Text style={styles.fatigueText}>Charge haute</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.swapBtn}>
                  <MaterialCommunityIcons name="swap-vertical" size={18} color="#8B8B9A" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Remplaçants (Banc) */}
          <View style={styles.rosterCard}>
            <View style={styles.rosterHeader}>
              <Text style={styles.rosterTitle}>Remplaçants & Banc ({subs.length}/5)</Text>
            </View>

            {subs.map((player) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={[styles.posBadge, { backgroundColor: '#1C1C22' }]}>
                  <Text style={[styles.posBadgeText, { color: '#8B8B9A' }]}>{player.pos}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerMeta}>Note saison : {player.rating}/10</Text>
                </View>
                <TouchableOpacity style={styles.swapBtn}>
                  <MaterialCommunityIcons name="arrow-up-circle-outline" size={18} color="#0A84FF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {/* TAB CONTENT: CONVOCATIONS & RSVP */}
      {activeTab === 'convocations' && (
        <View style={styles.rosterCard}>
          <Text style={styles.rosterTitle}>Liste Complète des Convoqués ({squad.length})</Text>
          {squad.map((player) => (
            <View key={player.id} style={styles.playerRow}>
              <View style={styles.playerNum}>
                <Text style={styles.playerNumText}>#{player.num}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerMeta}>{player.pos} · {player.role === 'starter' ? 'Titulaire' : player.role === 'sub' ? 'Remplaçant' : 'Non retenu'}</Text>
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
                  {player.rsvp === 'present' ? 'Présent' : player.rsvp === 'pending' ? 'Attente' : player.rsvp === 'absent' ? 'Absent' : 'Blessé'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* TAB CONTENT: CLASSEMENT OFFICIEL */}
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  headerTitleWrap: {
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 12,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1C1C22',
  },
  segmentBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  rsvpBarometerCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  rsvpBarometerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rsvpTitle: {
    color: '#FFFFFF',
    fontSize: 13,
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
    fontSize: 11,
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
    paddingVertical: 8,
    borderRadius: 10,
  },
  rsvpCount: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  rsvpLabel: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  aiGeneratorCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    padding: 14,
    marginBottom: 14,
  },
  aiGenTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiGenTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiGenDesc: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  aiGenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingVertical: 10,
  },
  aiGenActionText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  rosterCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rosterTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validBadgeText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '600',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 10,
  },
  posBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadgeText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '800',
  },
  playerNum: {
    width: 30,
    alignItems: 'center',
  },
  playerNumText: {
    color: '#8B8B9A',
    fontSize: 12,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  playerMeta: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 2,
  },
  fatiguePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fatigueText: {
    color: '#FF9F0A',
    fontSize: 10,
    fontWeight: '600',
  },
  swapBtn: {
    padding: 6,
  },
  rsvpStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rsvpStatusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
});
