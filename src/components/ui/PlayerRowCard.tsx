import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

interface PlayerRowCardProps {
  user: User;
  onPress: (user: User) => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

export const PlayerRowCard: React.FC<PlayerRowCardProps> = ({
  user,
  onPress,
  bookmarked,
  onBookmark,
}) => {
  const p = user.profile;
  const meta = [
    p.position,
    p.age ? `${p.age} ans` : null,
    user.city,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={[styles.card, shadows.card]}
      onPress={() => onPress(user)}
      activeOpacity={0.9}
    >
      <View style={styles.avatar}>
        <Text style={styles.initial}>{user.display_name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.meta}>{meta}</Text>
        {p.level ? <Text style={styles.level}>{p.level}</Text> : null}
      </View>
      {onBookmark && (
        <TouchableOpacity onPress={onBookmark} hitSlop={12}>
          <Text style={bookmarked ? styles.starOn : styles.starOff}>
            {bookmarked ? '★' : '☆'}
          </Text>
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
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initial: { fontSize: 22, fontWeight: '800', color: colors.brand },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  level: { fontSize: 12, color: colors.brand, marginTop: 2, fontWeight: '600' },
  starOn: { fontSize: 22, color: '#FBBF24' },
  starOff: { fontSize: 22, color: colors.border },
});
