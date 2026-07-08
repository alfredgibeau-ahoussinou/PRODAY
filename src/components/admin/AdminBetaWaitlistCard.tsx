import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BetaWaitlistEntry } from '../../services/admin.service';
import { BETA_WAITLIST_STATUS_LABELS } from '../../utils/betaWaitlistStatus';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminBetaWaitlistCardProps {
  entry: BetaWaitlistEntry;
  meta: string;
  busy?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onResend?: () => void;
  onShareLink?: () => void;
  onDelete?: () => void;
}

export const AdminBetaWaitlistCard: React.FC<AdminBetaWaitlistCardProps> = ({
  entry,
  meta,
  busy = false,
  onApprove,
  onReject,
  onResend,
  onShareLink,
  onDelete,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const statusLabel = BETA_WAITLIST_STATUS_LABELS[entry.status];
  const statusStyle =
    entry.status === 'approved'
      ? styles.badgeApproved
      : entry.status === 'rejected'
        ? styles.badgeRejected
        : styles.badgePending;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="mail" size={18} color={c.brand} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {entry.email}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {entry.role_label ?? entry.role ?? '—'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.badge, statusStyle]}>{statusLabel}</Text>
            <Text style={styles.meta}>{meta}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {onApprove ? (
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={onApprove}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>Approuver</Text>
          </TouchableOpacity>
        ) : null}
        {onReject ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={onReject}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryText}>Rejeter</Text>
          </TouchableOpacity>
        ) : null}
        {onResend ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={onResend}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryText}>Renvoyer</Text>
          </TouchableOpacity>
        ) : null}
        {onShareLink ? (
          <TouchableOpacity
            style={[styles.linkBtn, busy && styles.btnDisabled]}
            onPress={onShareLink}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Icon name="share" size={14} color={c.brand} />
            <Text style={styles.linkText}>Lien</Text>
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity
            style={[styles.deleteBtn, busy && styles.btnDisabled]}
            onPress={onDelete}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteText}>Supprimer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    header: { flexDirection: 'row', gap: spacing.md },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    title: { fontSize: 15, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 6, flexWrap: 'wrap' },
    badge: {
      fontSize: 10,
      fontWeight: '800',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    badgePending: { backgroundColor: c.warningBg ?? c.surfaceMuted, color: c.warning ?? c.text },
    badgeApproved: { backgroundColor: c.successBg ?? c.brandSoft, color: c.success ?? c.brand },
    badgeRejected: { backgroundColor: c.errorBg, color: c.error },
    meta: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.md,
      justifyContent: 'flex-end',
    },
    primaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.sm,
      backgroundColor: c.brand,
    },
    primaryText: { fontSize: 11, fontWeight: '800', color: c.brandInverse },
    secondaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    secondaryText: { fontSize: 11, fontWeight: '700', color: c.text },
    linkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    linkText: { fontSize: 11, fontWeight: '700', color: c.brand },
    deleteBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.sm,
      backgroundColor: c.error,
    },
    deleteText: { fontSize: 11, fontWeight: '800', color: c.brandInverse },
    btnDisabled: { opacity: 0.5 },
  });
}
