import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

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
  <View style={[styles.card, shadows.card]}>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  club: { color: colors.text, fontSize: 16, fontWeight: '700' },
  line: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  date: { color: colors.brand, fontSize: 12, marginTop: 6, fontWeight: '600' },
  btn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: colors.brand, fontWeight: '700' },
});
