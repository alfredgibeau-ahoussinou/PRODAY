import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { User, getVerificationBadge, canContactMinors } from '../models/User';
import { ROLE_LABELS } from '../utils/roleCapabilities';
import { Icon } from './ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface ProfileCardProps {
  user: User;
  onContact?: (user: User) => void;
  onViewProfile?: (user: User) => void;
  style?: ViewStyle;
  compact?: boolean;
}

const badgeColors = {
  green: colors.success,
  orange: colors.warning,
  red: colors.error,
  gray: colors.textMuted,
} as const;

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onContact,
  onViewProfile,
  style,
  compact = false,
}) => {
  const badge = getVerificationBadge(user);
  const canContact = canContactMinors(user);

  return (
    <TouchableOpacity
      style={[styles.card, shadows.card, style]}
      onPress={() => onViewProfile?.(user)}
      activeOpacity={0.85}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>
            {user.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text style={styles.role}>
          {getRoleLabel(user)} · {user.city ?? 'France'}
        </Text>
        {user.role === 'player' && (
          <View style={styles.statsRow}>
            {user.profile.position && <StatChip label={user.profile.position} />}
            {user.profile.level && <StatChip label={user.profile.level} />}
            {user.profile.season_stats &&
              (user.profile.season_stats.goals > 0 ||
                user.profile.season_stats.assists > 0) && (
                <StatChip
                  label={`${user.profile.season_stats.goals} buts · ${user.profile.season_stats.assists} pd`}
                />
              )}
          </View>
        )}
        {badge.color !== 'gray' && (
          <Text style={[styles.verificationLabel, { color: badgeColors[badge.color] }]}>
            {badge.label}
          </Text>
        )}
      </View>

      {!compact && onContact && (
        <TouchableOpacity
          style={[styles.contactButton, !canContact && styles.contactButtonDisabled]}
          onPress={() => canContact && onContact(user)}
          disabled={!canContact}
        >
          {canContact ? (
            <Text style={styles.contactButtonText}>Contacter</Text>
          ) : (
            <Icon name="lock" size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const StatChip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

function getRoleLabel(user: User): string {
  return ROLE_LABELS[user.role] ?? user.role;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    marginRight: spacing.md,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: colors.bluePrimary, fontSize: 22, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  role: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  chip: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.blueBright,
  },
  chipText: { color: colors.bluePrimary, fontSize: 11, fontWeight: '600' },
  verificationLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  contactButton: {
    backgroundColor: colors.bluePrimary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
  },
  contactButtonDisabled: { backgroundColor: colors.textMuted },
  contactButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default ProfileCard;
