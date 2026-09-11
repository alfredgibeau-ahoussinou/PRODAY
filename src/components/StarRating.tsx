import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import { Icon } from './ui/Icon';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md' }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < full || (i === full && half);
          return (
            <Icon
              key={i}
              name={filled ? 'star' : 'star-outline'}
              size={iconSize}
              color={filled ? c.accent : c.border}
            />
          );
        })}
      </View>
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stars: { flexDirection: 'row', gap: 2 },
    value: { color: c.textSecondary, fontWeight: '700', fontSize: 14 },
    valueSm: { fontSize: 12 },
  });
}
