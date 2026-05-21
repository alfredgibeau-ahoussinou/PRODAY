import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Tournament } from '../models/Tournament';
import { colors, spacing, radius } from '../theme/designTokens';

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
  <TouchableOpacity style={styles.card} onPress={() => onPress?.(tournament)} activeOpacity={0.9}>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  categories: { color: colors.brand, fontSize: 12, marginTop: spacing.sm },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
});
