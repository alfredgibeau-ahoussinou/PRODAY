import React, { useMemo } from 'react';
import { useTranslation } from '../../context/LocaleContext';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { User, UserRole } from '../../models/User';
import { userNeedsAdminVerificationReview } from '../../utils/adminUserVerification';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { adminProductLineLabel } from '../../utils/adminProductLine';
import { getUserProductLine } from '../../utils/productLineAccess';
import { MEDICAL_CANONICAL_LABELS, resolveMedicalSpecialtyId } from '../../screens/signup/signupMedicalI18n';

function needsVerificationReview(user: User): boolean {
  return userNeedsAdminVerificationReview(user);
}

function healthSpecialtyLabel(user: User): string | null {
  if (user.role !== 'physio') return null;
  const raw = user.profile?.medical_specialty || user.profile?.job_title;
  if (!raw) return null;
  const id = resolveMedicalSpecialtyId(raw);
  return id ? MEDICAL_CANONICAL_LABELS[id] : raw;
}

interface AdminUserCardProps {
  user: User;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onViewDocuments?: () => void;
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
  onViewDocuments,
  onToggleActive,
  onDelete,
  documentsCount,
  approving,
}) => {
  const { t } = useTranslation();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const initial = user.display_name.trim().charAt(0).toUpperCase() || '?';
  const showVerify = needsVerificationReview(user);
  const productLine = getUserProductLine(user);
  const specialty = healthSpecialtyLabel(user);

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
                <Text style={styles.roleBadgeText}>
                  {specialty ?? getRoleLabel(user.role, t)}
                </Text>
              </View>
              <View style={styles.lineBadge}>
                <Text style={styles.lineBadgeText}>{adminProductLineLabel(productLine)}</Text>
              </View>
              {user.profile?.job_title && !specialty ? (
                <Text style={styles.city} numberOfLines={1}>
                  {user.profile.job_title}
                </Text>
              ) : null}
              {user.role === 'sponsor' ? (
                <View
                  style={[
                    styles.sponsorBadge,
                    user.sponsor_approved ? styles.sponsorOk : styles.sponsorWait,
                  ]}
                >
                  <Text style={styles.sponsorBadgeText}>
                    {user.sponsor_approved ? 'Campagnes OK' : 'Campagnes en attente'}
                  </Text>
                </View>
              ) : null}
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
            <Icon name="shield" size={14} color={c.brand} />
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
          {onViewDocuments ? (
            <AdminAction
              icon="document"
              label="Documents"
              onPress={onViewDocuments}
              styles={styles}
              c={c}
            />
          ) : null}
          {onEdit ? (
            <AdminAction icon="settings" label="Modifier" onPress={onEdit} styles={styles} c={c} />
          ) : null}
          {showVerify && onApprove && onReject ? (
            <>
              <AdminAction
                icon="checkmark-circle"
                label={approving ? '…' : 'Confirmer'}
                onPress={onApprove}
                primary
                disabled={approving}
                styles={styles}
                c={c}
              />
              <AdminAction
                icon="close"
                label="Rejeter"
                onPress={onReject}
                disabled={approving}
                styles={styles}
                c={c}
              />
            </>
          ) : null}
          {onToggleActive ? (
            <AdminAction
              icon={user.is_active === false ? 'checkmark-circle' : 'warning'}
              label={user.is_active === false ? t('admin.user.activate') : t('admin.user.deactivate')}
              onPress={onToggleActive}
              styles={styles}
              c={c}
            />
          ) : null}
          {onDelete ? (
            <AdminAction icon="close" label="Supprimer" onPress={onDelete} danger styles={styles} c={c} />
          ) : null}
        </View>
      </View>
    </View>
  );
};

type CardStyles = ReturnType<typeof createStyles>;

const AdminAction: React.FC<{
  icon: 'checkmark-circle' | 'close' | 'warning' | 'settings' | 'document';
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  styles: CardStyles;
  c: AppColors;
}> = ({ icon, label, onPress, primary, danger, disabled, styles, c }) => (
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
      color={primary || danger ? c.brandInverse : c.text}
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    accentStripe: { width: 4, backgroundColor: c.brand },
    body: { flex: 1, padding: spacing.md },
    headRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: c.brand },
    avatarPh: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.brand,
    },
    avatarLetter: { color: c.brandInverse, fontSize: 22, fontWeight: '900' },
    headCopy: { flex: 1, minWidth: 0 },
    name: { fontSize: 16, fontWeight: '900', color: c.text },
    email: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
    roleBadge: { backgroundColor: c.accentSoft, paddingHorizontal: 8, paddingVertical: 2 },
    roleBadgeText: { fontSize: 10, fontWeight: '800', color: c.brand },
    lineBadge: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: c.border,
    },
    lineBadgeText: { fontSize: 10, fontWeight: '800', color: c.textSecondary },
    sponsorBadge: { paddingHorizontal: 8, paddingVertical: 2 },
    sponsorOk: { backgroundColor: c.accentSoft },
    sponsorWait: { backgroundColor: c.warningBg },
    sponsorBadgeText: { fontSize: 10, fontWeight: '800', color: c.text },
    city: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceMuted,
    },
    statusOk: { backgroundColor: c.accentSoft },
    statusPending: { backgroundColor: c.warningBg },
    statusBad: { backgroundColor: c.errorBg },
    statusText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    docCount: { fontSize: 11, fontWeight: '700', color: c.brand },
    inactiveBanner: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: c.warningBg,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    inactiveText: { fontSize: 11, fontWeight: '800', color: c.warning },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    actionPrimary: { backgroundColor: c.brand, borderColor: c.brand },
    actionDanger: { backgroundColor: c.accent, borderColor: c.accent },
    actionDisabled: { opacity: 0.5 },
    actionLabel: { fontSize: 11, fontWeight: '800', color: c.text },
    actionLabelLight: { color: c.brandInverse },
  });
}
