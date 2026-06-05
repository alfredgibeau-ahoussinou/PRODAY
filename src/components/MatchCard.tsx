import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';

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

export const MatchCard: React.FC<MatchCardProps> = ({ match, onAccept }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
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
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
    },
    club: { color: c.text, fontSize: 16, fontWeight: '700' },
    line: { color: c.textSecondary, fontSize: 13, marginTop: 4 },
    date: { color: c.brand, fontSize: 12, marginTop: 6, fontWeight: '600' },
    btn: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
      borderRadius: radius.md,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnText: { color: c.brand, fontWeight: '700' },
  });
}
