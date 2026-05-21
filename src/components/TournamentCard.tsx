import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Tournament } from '../models/Tournament';

interface TournamentCardProps {
  tournament: Tournament;
  onPress?: (t: Tournament) => void;
  onRegister?: (t: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onPress,
  onRegister,
}) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress?.(tournament)}>
    <Text style={styles.name}>{tournament.name}</Text>
    <Text style={styles.meta}>
      {tournament.city} · {formatDate(tournament.date_start)}
    </Text>
    <Text style={styles.categories}>{tournament.categories.join(' · ')}</Text>
    {tournament.status === 'OPEN' && onRegister && (
      <TouchableOpacity
        style={styles.btn}
        onPress={() => onRegister(tournament)}
      >
        <Text style={styles.btnText}>Inscription</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
  },
  name: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  meta: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  categories: { color: '#3B82F6', fontSize: 12, marginTop: 8 },
  btn: {
    marginTop: 12,
    backgroundColor: '#1A56DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: '#F8FAFC', fontWeight: '700' },
});
