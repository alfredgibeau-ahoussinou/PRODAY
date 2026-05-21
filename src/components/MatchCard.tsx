import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface FriendlyMatchPreview {
  id: string;
  club_name: string;
  category: string;
  level: string;
  date: Date;
  city: string;
  has_pitch: boolean;
}

interface MatchCardProps {
  match: FriendlyMatchPreview;
  onAccept?: (id: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onAccept }) => (
  <View style={styles.card}>
    <Text style={styles.club}>{match.club_name}</Text>
    <Text style={styles.line}>
      {match.category} {match.level} — {match.city}
    </Text>
    <Text style={styles.date}>
      {match.date.toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}
      {match.has_pitch ? ' · Terrain dispo' : ''}
    </Text>
    {onAccept && (
      <TouchableOpacity style={styles.btn} onPress={() => onAccept(match.id)}>
        <Text style={styles.btnText}>Proposer un créneau</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
  },
  club: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  line: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  date: { color: '#3B82F6', fontSize: 12, marginTop: 6 },
  btn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1A56DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: '#3B82F6', fontWeight: '700' },
});
