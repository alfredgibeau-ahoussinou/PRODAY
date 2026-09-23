import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { getVerificationBadge } from '../models/User';
import { StarRating } from './StarRating';
import { Icon } from './ui/Icon';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';

interface CoachListCardProps {
  user: User;
  onPress: (user: User) => void;
  bookmarked?: boolean;
  onBookmark?: (user: User) => void;
}

export const CoachListCard: React.FC<CoachListCardProps> = ({
  user,
  onPress,
  bookmarked,
  onBookmark,
}) => {
  const { colors } = useAppTheme();
  const badge = getVerificationBadge(user);
  const p = user.profile;
  const verified = user.is_verified && badge.color === 'green';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadows.card,
      ]}
      onPress={() => onPress(user)}
      activeOpacity={0.9}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.initial, { color: colors.brand }]}>
          {user.display_name.charAt(0)}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]}>{user.display_name}</Text>
          {verified && (
            <View style={styles.verifiedChip}>
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
        <Text style={[styles.title, { color: colors.brand }]}>
          {p.job_title ?? (user.role === 'agent' ? 'Agent' : 'Coach')}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {p.years_experience ? `${p.years_experience} ans exp. · ` : ''}
          {user.city ?? 'France'}
        </Text>
        {p.rating != null && <StarRating rating={p.rating} size="sm" />}
      </View>
      {onBookmark && (
        <TouchableOpacity onPress={() => onBookmark(user)} style={styles.bookmark} accessibilityRole="button" accessibilityLabel={bookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <Icon
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? colors.brand : colors.border}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initial: { fontSize: 22, fontWeight: '800' },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700' },
  verifiedChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { color: '#059669', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 2 },
  bookmark: { padding: spacing.sm },
});
