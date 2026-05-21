// src/components/ProfileCard.tsx
// Carte profil joueur/coach avec badge de vérification ProDay

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileCardProps {
  user: User;
  onContact?: (user: User) => void;
  onViewProfile?: (user: User) => void;
  style?: ViewStyle;
  compact?: boolean;
}

// ─── Couleurs ProDay ──────────────────────────────────────────────────────────

const COLORS = {
  primary: '#1A56DB',
  primaryLight: '#3B82F6',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  green: '#22C55E',
  orange: '#F97316',
  red: '#EF4444',
  gray: '#64748B',
};

// ─── Composant ────────────────────────────────────────────────────────────────

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onContact,
  onViewProfile,
  style,
  compact = false,
}) => {
  const badge = getVerificationBadge(user);
  const canContact = canContactMinors(user);

  const badgeColor: Record<typeof badge.color, string> = {
    green: COLORS.green,
    orange: COLORS.orange,
    red: COLORS.red,
    gray: COLORS.gray,
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onViewProfile?.(user)}
      activeOpacity={0.85}
    >
      {/* Avatar + Badge */}
      <View style={styles.avatarContainer}>
        <Image
          source={
            user.avatar_url
              ? { uri: user.avatar_url }
              : require('../assets/default_avatar.png')
          }
          style={styles.avatar}
        />
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor[badge.color] },
          ]}
        />
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.display_name}
        </Text>

        <Text style={styles.role}>
          {getRoleLabel(user)} · {user.city ?? 'France'}
        </Text>

        {/* Stats joueur */}
        {user.role === 'player' && user.profile && (
          <View style={styles.statsRow}>
            {user.profile.position && (
              <StatChip label={user.profile.position} />
            )}
            {user.profile.level && (
              <StatChip label={user.profile.level} />
            )}
            {user.profile.category && (
              <StatChip label={user.profile.category} />
            )}
          </View>
        )}

        {/* Badge vérification */}
        {badge.color !== 'gray' && (
          <Text
            style={[styles.verificationLabel, { color: badgeColor[badge.color] }]}
          >
            {badge.label}
          </Text>
        )}
      </View>

      {/* CTA Contacter */}
      {!compact && onContact && (
        <TouchableOpacity
          style={[
            styles.contactButton,
            !canContact && styles.contactButtonDisabled,
          ]}
          onPress={() => canContact && onContact(user)}
          disabled={!canContact}
        >
          <Text style={styles.contactButtonText}>
            {canContact ? 'Contacter' : '🔒'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Sub-composant ────────────────────────────────────────────────────────────

const StatChip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(user: User): string {
  const labels: Record<User['role'], string> = {
    player: 'Joueur',
    coach: 'Coach',
    agent: 'Agent',
    organizer: 'Organisateur',
    sponsor: 'Sponsor',
  };
  return labels[user.role] ?? user.role;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  info: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  role: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  verificationLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
  },
  contactButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  contactButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProfileCard;
