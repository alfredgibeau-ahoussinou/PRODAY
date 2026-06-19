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
  scoutingScore?: number;
  scoutingLabel?: string;
  isOwnProfile?: boolean;
}

export const PlayerRowCard: React.FC<PlayerRowCardProps> = ({
  user,
  onPress,
  bookmarked,
  onBookmark,
  scoutingScore,
  scoutingLabel,
  isOwnProfile,
}) => {
  const { colors } = useAppTheme();
  const p = user.profile;
  const meta = [p.position, p.age ? `${p.age} ans` : null, user.city, p.level]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isOwnProfile ? colors.brand : colors.border,
        },
        shadows.card,
        isOwnProfile && { borderWidth: 1.5 },
      ]}
      onPress={() => onPress(user)}
      activeOpacity={0.9}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.initial, { color: colors.brand }]}>
          {user.display_name.charAt(0).toUpperCase()}
        </Text>
        {user.is_verified ? (
          <View style={[styles.verifiedDot, { backgroundColor: colors.brand }]} />
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {user.display_name}
          </Text>
          {isOwnProfile ? (
            <View style={[styles.ownBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.ownBadgeText, { color: colors.brand }]}>Mon profil</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
          {meta || 'Profil joueur ProDay'}
        </Text>
        {scoutingScore != null ? (
          <Text style={[styles.scouting, { color: colors.accent }]}>
            Match {scoutingScore}%
            {scoutingLabel ? ` · ${scoutingLabel}` : ''}
          </Text>
        ) : null}
      </View>

      {onBookmark ? (
        <TouchableOpacity onPress={onBookmark} hitSlop={12} style={styles.bookmarkBtn}>
          <Icon
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? '#F59E0B' : colors.textMuted}
          />
        </TouchableOpacity>
      ) : (
        <Icon name="chevron-forward" size={20} color={colors.textMuted} />
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
    gap: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  initial: { fontSize: 20, fontWeight: '800' },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  ownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ownBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  meta: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  scouting: { fontSize: 11, marginTop: 4, fontWeight: '700' },
  bookmarkBtn: { paddingLeft: spacing.xs },
});
