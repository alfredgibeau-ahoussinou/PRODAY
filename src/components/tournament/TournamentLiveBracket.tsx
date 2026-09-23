import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface BracketMatch {
  id: string;
  stage: 'quarts' | 'demis' | 'finale';
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  winner?: 'A' | 'B';
  pitch: string;
  time: string;
}

interface TournamentLiveBracketProps {
  tournamentName?: string;
  sponsorName?: string;
  category?: string;
}

const DEFAULT_MATCHES: BracketMatch[] = [
  // Quarts
  {
    id: 'q1',
    stage: 'quarts',
    teamA: 'PRODAY FC',
    teamB: 'AS Meudon',
    scoreA: 3,
    scoreB: 1,
    winner: 'A',
    pitch: 'Terrain 1',
    time: '10:00',
  },
  {
    id: 'q2',
    stage: 'quarts',
    teamA: 'FC Versailles',
    teamB: 'US Créteil',
    scoreA: 2,
    scoreB: 2,
    winner: 'A', // tab
    pitch: 'Terrain 2',
    time: '10:00',
  },
  {
    id: 'q3',
    stage: 'quarts',
    teamA: 'RC Joinville',
    teamB: 'Boulogne AC',
    scoreA: 0,
    scoreB: 2,
    winner: 'B',
    pitch: 'Terrain 1',
    time: '10:45',
  },
  {
    id: 'q4',
    stage: 'quarts',
    teamA: 'Red Star FC',
    teamB: 'JA Drancy',
    scoreA: 1,
    scoreB: 0,
    winner: 'A',
    pitch: 'Terrain 2',
    time: '10:45',
  },
  // Demis
  {
    id: 'd1',
    stage: 'demis',
    teamA: 'PRODAY FC',
    teamB: 'FC Versailles',
    scoreA: 2,
    scoreB: 1,
    winner: 'A',
    pitch: 'Terrain Honneur',
    time: '14:00',
  },
  {
    id: 'd2',
    stage: 'demis',
    teamA: 'Boulogne AC',
    teamB: 'Red Star FC',
    scoreA: 1,
    scoreB: 3,
    winner: 'B',
    pitch: 'Terrain Honneur',
    time: '14:45',
  },
  // Finale
  {
    id: 'f1',
    stage: 'finale',
    teamA: 'PRODAY FC',
    teamB: 'Red Star FC',
    scoreA: 2,
    scoreB: 2,
    pitch: 'Terrain Honneur',
    time: '16:30',
  },
];

export const TournamentLiveBracket: React.FC<TournamentLiveBracketProps> = ({
  tournamentName = 'Tournoi National de Printemps ProDay',
  sponsorName = 'Crédit Mutuel & Intersport',
  category = 'U13 Élite',
}) => {
  const [selectedStage, setSelectedStage] = useState<'all' | 'quarts' | 'demis' | 'finale'>('all');

  const filteredMatches = DEFAULT_MATCHES.filter((m) => {
    if (selectedStage === 'all') return true;
    return m.stage === selectedStage;
  });

  const getStageLabel = (stage: BracketMatch['stage']) => {
    switch (stage) {
      case 'quarts':
        return '1/4 de Finale';
      case 'demis':
        return 'Demi-Finale';
      case 'finale':
        return 'Grande Finale 🏆';
    }
  };

  return (
    <View style={styles.card}>
      {/* Sponsor Header */}
      <View style={styles.sponsorBanner}>
        <MaterialCommunityIcons name="handshake-outline" size={16} color="#38BDF8" />
        <Text style={styles.sponsorText}>Tournoi soutenu par nos partenaires : {sponsorName}</Text>
      </View>

      {/* Tournament Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{tournamentName}</Text>
          <Text style={styles.category}>{category} • Phase finale en direct</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>EN DIRECT</Text>
        </View>
      </View>

      {/* Stages Tabs */}
      <View style={styles.stageTabs}>
        {(
          [
            { id: 'all', label: 'Tout' },
            { id: 'quarts', label: 'Quarts' },
            { id: 'demis', label: 'Demis' },
            { id: 'finale', label: 'Finale' },
          ] as const
        ).map((st) => (
          <TouchableOpacity
            key={st.id}
            style={[styles.tab, selectedStage === st.id && styles.tabActive]}
            onPress={() => setSelectedStage(st.id)}
          >
            <Text style={[styles.tabText, selectedStage === st.id && styles.tabTextActive]}>
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Match Cards */}
      <ScrollView style={styles.matchesList} nestedScrollEnabled>
        {filteredMatches.map((m) => {
          const isFinished = m.scoreA !== undefined && m.scoreB !== undefined;
          const isFinale = m.stage === 'finale';
          return (
            <View
              key={m.id}
              style={[styles.matchCard, isFinale && styles.finaleCard]}
            >
              <View style={styles.matchMeta}>
                <Text style={styles.stageTitle}>{getStageLabel(m.stage)}</Text>
                <Text style={styles.metaInfo}>
                  {m.pitch} • {m.time}
                </Text>
              </View>

              {/* Team A */}
              <View
                style={[
                  styles.teamRow,
                  m.winner === 'A' && styles.teamRowWinner,
                ]}
              >
                <View style={styles.teamIdentity}>
                  {m.winner === 'A' && (
                    <MaterialCommunityIcons name="check-bold" size={14} color="#10B981" />
                  )}
                  <Text
                    style={[
                      styles.teamName,
                      m.winner === 'A' && styles.teamNameWinner,
                    ]}
                  >
                    {m.teamA}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.scoreText,
                    m.winner === 'A' && styles.scoreTextWinner,
                  ]}
                >
                  {m.scoreA ?? '-'}
                </Text>
              </View>

              <View style={styles.matchDivider} />

              {/* Team B */}
              <View
                style={[
                  styles.teamRow,
                  m.winner === 'B' && styles.teamRowWinner,
                ]}
              >
                <View style={styles.teamIdentity}>
                  {m.winner === 'B' && (
                    <MaterialCommunityIcons name="check-bold" size={14} color="#10B981" />
                  )}
                  <Text
                    style={[
                      styles.teamName,
                      m.winner === 'B' && styles.teamNameWinner,
                    ]}
                  >
                    {m.teamB}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.scoreText,
                    m.winner === 'B' && styles.scoreTextWinner,
                  ]}
                >
                  {m.scoreB ?? '-'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  sponsorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  sponsorText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  category: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  stageTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0F172A',
  },
  tabActive: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  matchesList: {
    maxHeight: 340,
  },
  matchCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  finaleCard: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  matchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stageTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaInfo: {
    color: '#64748B',
    fontSize: 11,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  teamRowWinner: {
    opacity: 1,
  },
  teamIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  teamNameWinner: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scoreText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  scoreTextWinner: {
    color: '#10B981',
    fontWeight: '900',
  },
  matchDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
});
