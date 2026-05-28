import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { Application } from '../../models/Player';
import { Icon } from '../ui/Icon';
import {
  APPLICATION_STATUS_LABEL,
  formatTimeAgo,
} from '../../services/recruitment.service';
import { colors, spacing, radius } from '../../theme/designTokens';

interface ApplicationReviewCardProps {
  application: Application;
  onViewProfile?: () => void;
  onMarkViewed: () => Promise<void>;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  busy?: boolean;
}

export const ApplicationReviewCard: React.FC<ApplicationReviewCardProps> = ({
  application,
  onViewProfile,
  onMarkViewed,
  onAccept,
  onReject,
  busy = false,
}) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [localBusy, setLocalBusy] = useState(false);

  const isPending = application.status === 'PENDING';
  const isFinal = application.status === 'ACCEPTED' || application.status === 'REJECTED';

  const run = async (action: () => Promise<void>) => {
    setLocalBusy(true);
    try {
      await action();
    } finally {
      setLocalBusy(false);
    }
  };

  const loading = busy || localBusy;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={styles.name}>{application.player_name ?? 'Joueur'}</Text>
          <Text style={styles.meta}>
            {APPLICATION_STATUS_LABEL[application.status]} ·{' '}
            {formatTimeAgo(application.created_at)}
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            application.status === 'ACCEPTED' && styles.pillOk,
            application.status === 'REJECTED' && styles.pillBad,
            application.status === 'VIEWED' && styles.pillViewed,
          ]}
        >
          <Text style={styles.pillText}>{APPLICATION_STATUS_LABEL[application.status]}</Text>
        </View>
      </View>

      <Text style={styles.letter}>{application.cover_letter}</Text>

      {application.rejection_reason ? (
        <Text style={styles.rejectNote}>Motif : {application.rejection_reason}</Text>
      ) : null}

      <View style={styles.actions}>
        {onViewProfile ? (
          <ActionBtn icon="eye" label="Profil" onPress={onViewProfile} disabled={loading} />
        ) : null}
        {!isFinal && isPending ? (
          <ActionBtn
            icon="checkmark-circle"
            label="Marquer vue"
            onPress={() => run(onMarkViewed)}
            disabled={loading}
          />
        ) : null}
        {!isFinal ? (
          <>
            <ActionBtn
              icon="checkmark-circle"
              label="Accepter"
              primary
              onPress={() => run(onAccept)}
              disabled={loading}
            />
            <ActionBtn
              icon="close"
              label="Refuser"
              danger
              onPress={() => setRejectOpen(true)}
              disabled={loading}
            />
          </>
        ) : null}
      </View>

      {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}

      <Modal visible={rejectOpen} transparent animationType="fade" onRequestClose={() => setRejectOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Refuser la candidature</Text>
            <Text style={styles.modalSub}>Motif optionnel (visible par le joueur)</Text>
            <TextInput
              style={styles.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Ex. profil ne correspond pas au poste…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectOpen(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => {
                  setRejectOpen(false);
                  void run(() => onReject(rejectReason.trim()));
                }}
              >
                <Text style={styles.modalConfirmText}>Confirmer le refus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ActionBtn: React.FC<{
  icon: 'eye' | 'checkmark-circle' | 'close';
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
    disabled={disabled}
  >
    <Icon name={icon} size={14} color={primary || danger ? colors.brandInverse : colors.text} />
    <Text style={[styles.actionLabel, (primary || danger) && styles.actionLabelLight]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headCopy: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  pill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOk: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillBad: { backgroundColor: colors.errorBg, borderColor: colors.error },
  pillViewed: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.text },
  letter: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  rejectNote: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
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
  loader: { marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  modalInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { fontWeight: '800', color: colors.text },
  modalConfirm: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  modalConfirmText: { fontWeight: '800', color: colors.brandInverse },
});
