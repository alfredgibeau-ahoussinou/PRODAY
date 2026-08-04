import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { Application } from '../../models/Player';
import { Icon } from '../ui/Icon';
import { AnimatedDialogShell } from '../motion/AnimatedDialogShell';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { formatTimeAgo } from '../../services/recruitment.service';
import { applicationPipelineLabel } from '../../utils/clubApplicationPipeline';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { useAppTheme } from '../../context/ProductLineContext';

interface ApplicationReviewCardProps {
  application: Application;
  pulseScore?: number;
  onViewProfile?: () => void;
  onMarkViewed: () => Promise<void>;
  onMarkInProgress?: () => Promise<void>;
  onAccept: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onScheduleTrial?: () => Promise<void>;
  onOpenDocs?: () => void;
  onOpenCarpool?: () => void;
  busy?: boolean;
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    headCopy: { flex: 1 },
    name: { fontSize: 16, fontWeight: '900', color: c.text },
    meta: { fontSize: 12, color: c.textSecondary, marginTop: 2, fontWeight: '600' },
    pill: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillOk: { backgroundColor: c.accentSoft, borderColor: c.brand },
    pillBad: { backgroundColor: c.errorBg, borderColor: c.error },
    pillViewed: { backgroundColor: c.warningBg, borderColor: c.warning },
    pillProgress: { backgroundColor: c.accentSoft, borderColor: c.brand },
    pillText: { fontSize: 10, fontWeight: '800', color: c.text },
    letter: { fontSize: 13, color: c.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
    rejectNote: {
      fontSize: 12,
      color: c.error,
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
      borderColor: c.border,
      backgroundColor: c.background,
    },
    actionPrimary: { backgroundColor: c.brand, borderColor: c.brand },
    actionDanger: { backgroundColor: c.accent, borderColor: c.accent },
    actionDisabled: { opacity: 0.5 },
    actionLabel: { fontSize: 11, fontWeight: '800', color: c.text },
    actionLabelLight: { color: c.brandInverse },
    loader: { marginTop: spacing.sm },
    modalSheet: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: c.text },
    modalSub: { fontSize: 13, color: c.textSecondary, marginTop: 4, marginBottom: spacing.md },
    modalInput: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: c.text,
      textAlignVertical: 'top',
      backgroundColor: c.background,
    },
    modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    modalCancel: {
      flex: 1,
      padding: spacing.md,
      alignItems: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalCancelText: { fontWeight: '800', color: c.text },
    modalConfirm: {
      flex: 1,
      padding: spacing.md,
      alignItems: 'center',
      borderRadius: radius.md,
      backgroundColor: c.brand,
    },
    modalConfirmText: { fontWeight: '800', color: c.brandInverse },
  });
}

const ActionBtn: React.FC<{
  icon: 'eye' | 'checkmark-circle' | 'close' | 'time' | 'calendar' | 'document' | 'car';
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}> = ({ icon, label, onPress, primary, danger, disabled, styles, colors }) => (
  <PressableSpring
    style={[
      styles.actionBtn,
      primary && styles.actionPrimary,
      danger && styles.actionDanger,
      disabled && styles.actionDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    scaleTo={0.96}
    haptic={!disabled}
  >
    <Icon
      name={icon}
      size={14}
      color={primary || danger ? colors.brandInverse : colors.text}
    />
    <Text style={[styles.actionLabel, (primary || danger) && styles.actionLabelLight]}>
      {label}
    </Text>
  </PressableSpring>
);

export const ApplicationReviewCard: React.FC<ApplicationReviewCardProps> = ({
  application,
  pulseScore,
  onViewProfile,
  onMarkViewed,
  onMarkInProgress,
  onAccept,
  onReject,
  onScheduleTrial,
  onOpenDocs,
  onOpenCarpool,
  busy = false,
}) => {
  const { colors, isWoman } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const playerFallback = isWoman ? 'Joueuse' : 'Joueur';

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
      <PressableSpring
        onPress={onViewProfile}
        disabled={!onViewProfile || loading}
        scaleTo={0.98}
        haptic={Boolean(onViewProfile) && !loading}
      >
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text style={styles.name}>
              {application.player_name ?? playerFallback}
            </Text>
            <Text style={styles.meta}>
              {applicationPipelineLabel(application)} ·{' '}
              {formatTimeAgo(application.created_at)}
              {pulseScore != null ? ` · Visibilité ${pulseScore}` : ''}
            </Text>
          </View>
          <View
            style={[
              styles.pill,
              application.status === 'ACCEPTED' && styles.pillOk,
              application.status === 'REJECTED' && styles.pillBad,
              application.status === 'VIEWED' && styles.pillViewed,
              application.status === 'IN_PROGRESS' && styles.pillProgress,
            ]}
          >
            <Text style={styles.pillText}>{applicationPipelineLabel(application)}</Text>
          </View>
        </View>
      </PressableSpring>

      <Text style={styles.letter}>{application.cover_letter}</Text>

      {application.trial_date ? (
        <Text style={[styles.meta, { marginTop: spacing.sm }]}>
          Essai prévu · {application.trial_date.toLocaleDateString('fr-FR')}
        </Text>
      ) : null}
      {(application.shared_documents?.length ?? 0) > 0 ? (
        <Text style={[styles.meta, { marginTop: 4 }]}>
          {application.shared_documents!.length} document
          {application.shared_documents!.length > 1 ? 's' : ''} partagé
          {application.shared_documents!.length > 1 ? 's' : ''}
        </Text>
      ) : null}

      {application.rejection_reason ? (
        <Text style={styles.rejectNote}>Motif : {application.rejection_reason}</Text>
      ) : null}

      <View style={styles.actions}>
        {onViewProfile ? (
          <ActionBtn
            icon="eye"
            label="Profil"
            onPress={onViewProfile}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {onOpenDocs ? (
          <ActionBtn
            icon="document"
            label="Docs"
            onPress={onOpenDocs}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {onScheduleTrial && !isFinal ? (
          <ActionBtn
            icon="calendar"
            label="Essai"
            onPress={() => run(onScheduleTrial)}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {onOpenCarpool && application.trial_date ? (
          <ActionBtn
            icon="car"
            label="Covoit"
            onPress={onOpenCarpool}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {!isFinal && isPending ? (
          <ActionBtn
            icon="checkmark-circle"
            label="En revue"
            onPress={() => run(onMarkViewed)}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {!isFinal && application.status === 'VIEWED' && onMarkInProgress ? (
          <ActionBtn
            icon="time"
            label="Shortlist"
            onPress={() => run(onMarkInProgress)}
            disabled={loading}
            styles={styles}
            colors={colors}
          />
        ) : null}
        {!isFinal ? (
          <>
            <ActionBtn
              icon="checkmark-circle"
              label="Recruter"
              primary
              onPress={() => {
                prodayHaptics.confirm();
                void run(onAccept);
              }}
              disabled={loading}
              styles={styles}
              colors={colors}
            />
            <ActionBtn
              icon="close"
              label="Refuser"
              danger
              onPress={() => setRejectOpen(true)}
              disabled={loading}
              styles={styles}
              colors={colors}
            />
          </>
        ) : null}
      </View>

      {loading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : null}

      <AnimatedDialogShell
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Refuser la candidature</Text>
          <Text style={styles.modalSub}>
            Motif optionnel (visible par la {playerFallback.toLowerCase()})
          </Text>
          <TextInput
            style={styles.modalInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Ex. profil ne correspond pas au poste…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={styles.modalActions}>
            <PressableSpring
              style={styles.modalCancel}
              scaleTo={0.97}
              onPress={() => setRejectOpen(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </PressableSpring>
            <PressableSpring
              style={styles.modalConfirm}
              scaleTo={0.97}
              haptic
              onPress={() => {
                prodayHaptics.confirm();
                setRejectOpen(false);
                void run(() => onReject(rejectReason.trim()));
              }}
            >
              <Text style={styles.modalConfirmText}>Confirmer le refus</Text>
            </PressableSpring>
          </View>
        </View>
      </AnimatedDialogShell>
    </View>
  );
};
