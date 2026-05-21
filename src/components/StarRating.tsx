import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/designTokens';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md' }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '★';
    if (i === full && half) return '★';
    return '☆';
  });

  return (
    <View style={styles.row}>
      <Text style={[styles.stars, size === 'sm' && styles.starsSm]}>{stars.join('')}</Text>
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { color: '#FBBF24', fontSize: 16, letterSpacing: 1 },
  starsSm: { fontSize: 13 },
  value: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  valueSm: { fontSize: 12 },
});
