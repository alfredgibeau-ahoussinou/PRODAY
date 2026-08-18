import React, { useMemo } from 'react';
import { useTranslation } from '../../context/LocaleContext';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { userNeedsAdminVerificationReview } from '../../utils/adminUserVerification';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { AdminButton } from './AdminButton';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { adminProductLineLabel } from '../../utils/adminProductLine';
import { adminGenderLabel } from '../../utils/adminUserDisplay';
import { getUserProductLine } from '../../utils/productLineAccess';
import { MEDICAL_CANONICAL_LABELS, resolveMedicalSpecialtyId } from '../../screens/signup/signupMedicalI18n';
import { PlayerLevelBadgePill } from '../player/PlayerLevelBadgePill';

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
  const genderLabel = adminGenderLabel(user.profile?.gender);
  const showGender = user.role === 'player' || user.profile?.gender != null;

  return (
    <View style={[styles.card, showVerify && styles.cardPending]}>
      <View style={[styles.accentStripe, showVerify && styles.accentStripeAlert]} />
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
              {showGender ? (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>Genre · {genderLabel}</Text>
                </View>
              ) : null}
              {user.role === 'player' ? (
                <PlayerLevelBadgePill user={user} compact showVerified={false} />
              ) : null}
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
              {user.city ? <Text style={styles.city}>{user.city}</Text> : null}
            </View>
          </View>
          {onEdit ? (
            <PressableSpring onPress={onEdit} style={styles.quickEdit} scaleTo={0.92} haptic>
              <Icon name="settings" size={16} color={adminChrome.accentHot} />
            </PressableSpring>
          ) : null}
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
            <AdminButton label="Documents" icon="document" variant="secondary" size="sm" onPress={onViewDocuments} />
          ) : null}
          {showVerify && onApprove && onReject ? (
            <>
              <AdminButton
                label={approving ? '…' : 'Confirmer'}
                icon="checkmark-circle"
                variant="primary"
                size="sm"
                onPress={onApprove}
                loading={approving}
                disabled={approving}
              />
              <AdminButton
                label="Rejeter"
                icon="close"
                variant="outline"
                size="sm"
                onPress={onReject}
                disabled={approving}
              />
            </>
          ) : null}
          {onToggleActive ? (
            <AdminButton
              label={user.is_active === false ? t('admin.user.activate') : t('admin.user.deactivate')}
              icon={user.is_active === false ? 'checkmark-circle' : 'warning'}
              variant="secondary"
              size="sm"
              onPress={onToggleActive}
            />
          ) : null}
          {onDelete ? (
            <AdminButton label="Supprimer" icon="close" variant="danger" size="sm" onPress={onDelete} />
          ) : null}
        </View>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      ...shadows.card,
    },
    cardPending: {
      borderColor: adminChrome.accentMuted,
    },
    accentStripe: { width: 4, backgroundColor: adminChrome.accent },
    accentStripeAlert: { backgroundColor: c.warning },
    body: { flex: 1, padding: spacing.md },
    headRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: adminChrome.accentMuted,
    },
    avatarPh: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: adminChrome.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
    headCopy: { flex: 1, minWidth: 0 },
    name: { fontSize: 16, fontWeight: '800', color: c.text, letterSpacing: -0.2 },
    email: { fontSize: 12, color: c.textMuted, marginTop: 2, fontWeight: '500' },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    roleBadge: {
      backgroundColor: c.brandSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    roleBadgeText: { fontSize: 10, fontWeight: '800', color: c.brand },
    lineBadge: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    lineBadgeText: { fontSize: 10, fontWeight: '800', color: c.textSecondary },
    metaBadge: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    metaBadgeText: { fontSize: 10, fontWeight: '700', color: c.textSecondary },
    sponsorBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
    sponsorOk: { backgroundColor: c.brandSoft },
    sponsorWait: { backgroundColor: c.warningBg },
    sponsorBadgeText: { fontSize: 10, fontWeight: '800', color: c.text },
    city: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
    quickEdit: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    statusOk: { backgroundColor: c.brandSoft },
    statusPending: { backgroundColor: c.warningBg },
    statusBad: { backgroundColor: c.errorBg },
    statusText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    docCount: { fontSize: 11, fontWeight: '700', color: c.brand },
    inactiveBanner: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: c.warningBg,
      borderRadius: radius.md,
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
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    actionPrimary: { backgroundColor: adminChrome.accent, borderColor: adminChrome.accent },
    actionDanger: { backgroundColor: c.error, borderColor: c.error },
    actionDisabled: { opacity: 0.5 },
    actionLabel: { fontSize: 11, fontWeight: '800', color: c.text },
    actionLabelLight: { color: '#FFFFFF' },
  });
}
