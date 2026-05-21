import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { getVerificationBadge } from '../models/User';
import { StarRating } from './StarRating';
import { Icon } from './ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

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
  const badge = getVerificationBadge(user);
  const p = user.profile;
  const verified = user.is_verified && badge.color === 'green';

  return (
    <TouchableOpacity
      style={[styles.card, shadows.card]}
      onPress={() => onPress(user)}
      activeOpacity={0.9}
    >
      <View style={styles.avatar}>
        <Text style={styles.initial}>{user.display_name.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.display_name}</Text>
          {verified && (
            <View style={styles.verifiedChip}>
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{p.job_title ?? (user.role === 'agent' ? 'Agent' : 'Coach')}</Text>
        <Text style={styles.meta}>
          {p.years_experience ? `${p.years_experience} ans exp. · ` : ''}
          {user.city ?? 'France'}
        </Text>
        {p.rating != null && <StarRating rating={p.rating} size="sm" />}
      </View>
      {onBookmark && (
        <TouchableOpacity onPress={() => onBookmark(user)} style={styles.bookmark}>
          <Icon
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? '#F59E0B' : colors.border}
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blueCyan + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initial: { fontSize: 22, fontWeight: '800', color: colors.bluePrimary },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  verifiedChip: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  title: { color: colors.bluePrimary, fontSize: 13, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bookmark: { padding: spacing.sm },
});
