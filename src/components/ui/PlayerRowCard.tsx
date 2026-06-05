import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon } from './Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

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
  const { colors } = useAppTheme();
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
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
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
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{user.display_name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{meta}</Text>
        {p.level ? (
          <Text style={[styles.level, { color: colors.brand }]}>{p.level}</Text>
        ) : null}
      </View>
      {onBookmark && (
        <TouchableOpacity onPress={onBookmark} hitSlop={12}>
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
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 2 },
  level: { fontSize: 12, marginTop: 2, fontWeight: '600' },
});
