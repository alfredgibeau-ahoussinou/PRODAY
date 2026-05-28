import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { User, UserRole } from '../../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../../models/User';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

const ROLE_LABEL: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  physio: 'Kinésithérapeute',
};

function needsVerificationReview(user: User): boolean {
  if (user.verification_status !== 'PENDING') return false;
  if (user.role === 'player') return true;
  return ROLES_REQUIRING_VERIFICATION.includes(user.role);
}

interface AdminUserCardProps {
  user: User;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  documentsCount?: number;
  approving?: boolean;
}

export const AdminUserCard: React.FC<AdminUserCardProps> = ({
  user,
  onApprove,
  onReject,
  onEdit,
  onToggleActive,
  onDelete,
  documentsCount,
  approving,
}) => {
  const initial = user.display_name.trim().charAt(0).toUpperCase() || '?';
  const showVerify = needsVerificationReview(user);

  return (
    <View style={styles.card}>
      <View style={styles.accentStripe} />
      <View style={styles.body}>
        <View style={styles.headRow}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPh}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
          <View style={styles.headCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {user.display_name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{ROLE_LABEL[user.role]}</Text>
              </View>
              {user.city ? (
                <Text style={styles.city}>{user.city}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {user.verification_status !== 'NOT_REQUIRED' && (
          <View
            style={[
              styles.statusRow,
              user.verification_status === 'VERIFIED' && styles.statusOk,
              user.verification_status === 'PENDING' && styles.statusPending,
              user.verification_status === 'REJECTED' && styles.statusBad,
            ]}
          >
            <Icon name="shield" size={14} color={colors.accent} />
            <Text style={styles.statusText}>Vérification · {user.verification_status}</Text>
            {documentsCount !== undefined && documentsCount > 0 ? (
              <Text style={styles.docCount}> · {documentsCount} doc(s)</Text>
            ) : null}
          </View>
        )}

        {user.is_active === false && (
          <View style={styles.inactiveBanner}>
            <Text style={styles.inactiveText}>Compte désactivé</Text>
          </View>
        )}

        <View style={styles.actions}>
          {onEdit ? (
            <AdminAction icon="settings" label="Modifier" onPress={onEdit} />
          ) : null}
          {showVerify && onApprove && onReject ? (
            <>
              <AdminAction
                icon="checkmark-circle"
                label={approving ? '…' : 'Confirmer'}
                onPress={onApprove}
                primary
                disabled={approving}
              />
              <AdminAction
                icon="close"
                label="Rejeter"
                onPress={onReject}
                disabled={approving}
              />
            </>
          ) : null}
          {onToggleActive ? (
            <AdminAction
              icon={user.is_active === false ? 'checkmark-circle' : 'warning'}
              label={user.is_active === false ? 'Activer' : 'Désactiver'}
              onPress={onToggleActive}
            />
          ) : null}
          {onDelete ? (
            <AdminAction icon="close" label="Supprimer" onPress={onDelete} danger />
          ) : null}
        </View>
      </View>
    </View>
  );
};

const AdminAction: React.FC<{
  icon: 'checkmark-circle' | 'close' | 'warning' | 'settings';
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onPress, primary, danger, disabled }) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      primary && styles.actionPrimary,
      danger && styles.actionDanger,
      disabled && styles.actionDisabled,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <Icon
      name={icon}
      size={14}
      color={primary || danger ? colors.brandInverse : colors.text}
    />
    <Text
      style={[
        styles.actionLabel,
        (primary || danger) && styles.actionLabelLight,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentStripe: { width: 4, backgroundColor: colors.accent },
  body: { flex: 1, padding: spacing.md },
  headRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.accent },
  avatarPh: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatarLetter: { color: colors.brandInverse, fontSize: 22, fontWeight: '900' },
  headCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '900', color: colors.text },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  roleBadge: { backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: colors.accent },
  city: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  statusOk: { backgroundColor: colors.accentSoft },
  statusPending: { backgroundColor: colors.warningBg },
  statusBad: { backgroundColor: colors.errorBg },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  docCount: { fontSize: 11, fontWeight: '700', color: colors.accent },
  inactiveBanner: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warningBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactiveText: { fontSize: 11, fontWeight: '800', color: colors.warning },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionDanger: { backgroundColor: colors.ink, borderColor: colors.ink },
  actionDisabled: { opacity: 0.5 },
  actionLabel: { fontSize: 11, fontWeight: '800', color: colors.text },
  actionLabelLight: { color: colors.brandInverse },
});
