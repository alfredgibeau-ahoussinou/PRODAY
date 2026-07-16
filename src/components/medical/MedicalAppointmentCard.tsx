import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { MedicalAppointment } from '../../models/MedicalAppointment';
import { MEDICAL_APPOINTMENT_STATUS_LABELS } from '../../models/MedicalAppointment';
import { formatAppointmentDay, formatSlotLabel } from '../../utils/medicalSlots';
import { canJoinVisioSession } from '../../utils/visioMeetingLink';
import { CONSULTATION_TYPE_LABELS } from '../../models/MedicalAppointment';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from './medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

interface MedicalAppointmentCardProps {
  appointment: MedicalAppointment;
  mode: 'physio' | 'patient';
  onConfirm?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  onJoinVisio?: () => void;
  onPress?: () => void;
}

export const MedicalAppointmentCard: React.FC<MedicalAppointmentCardProps> = ({
  appointment,
  mode,
  onConfirm,
  onCancel,
  onComplete,
  onJoinVisio,
  onPress,
}) => {
  const { colors: c } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const statusColor =
    appointment.status === 'confirmed'
      ? '#0F766E'
      : appointment.status === 'pending'
        ? '#B45309'
        : appointment.status === 'completed'
          ? '#1D4ED8'
          : c.textMuted;

  const counterpart =
    mode === 'physio' ? appointment.patient_name : appointment.physio_name;

  const showVisio = canJoinVisioSession(appointment);
  const consultationLabel = appointment.consultation_type
    ? CONSULTATION_TYPE_LABELS[appointment.consultation_type]
    : null;

  const cardContent = (
    <>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatSlotLabel(appointment.start_at)}</Text>
        <Text style={styles.duration}>{appointment.duration_min} min</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{counterpart}</Text>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {MEDICAL_APPOINTMENT_STATUS_LABELS[appointment.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {formatAppointmentDay(appointment.start_at)}
          {consultationLabel ? ` · ${consultationLabel}` : ''}
          {appointment.location_label && appointment.consultation_type !== 'visio'
            ? ` · ${appointment.location_label}`
            : ''}
        </Text>
        {appointment.status === 'confirmed' &&
        appointment.consultation_type !== 'cabinet' &&
        !appointment.meeting_link ? (
          <Text style={styles.visioPending}>
            Le praticien vous enverra le lien de visio.
          </Text>
        ) : null}
        {appointment.motif ? (
          <Text style={styles.motif} numberOfLines={2}>
            {appointment.motif}
          </Text>
        ) : null}
        {mode === 'physio' && appointment.status === 'pending' ? (
          <View style={styles.actions}>
            <PressableSpring
              style={styles.confirmBtn}
              onPress={() => {
                prodayHaptics.confirm();
                onConfirm?.();
              }}
              scaleTo={0.96}
              haptic
            >
              <Icon name="checkmark-circle" size={16} color={c.brandInverse} />
              <Text style={styles.confirmText}>Confirmer</Text>
            </PressableSpring>
            <PressableSpring style={styles.cancelBtn} onPress={onCancel} scaleTo={0.97}>
              <Text style={styles.cancelText}>Refuser</Text>
            </PressableSpring>
          </View>
        ) : null}
        {mode === 'physio' && appointment.status === 'confirmed' ? (
          <View style={styles.actions}>
            {showVisio && onJoinVisio ? (
              <PressableSpring
                style={styles.visioBtn}
                onPress={() => {
                  prodayHaptics.confirm();
                  onJoinVisio();
                }}
                scaleTo={0.96}
                haptic
              >
                <Icon name="videocam" size={16} color={c.brandInverse} />
                <Text style={styles.visioText}>Rejoindre la visio</Text>
              </PressableSpring>
            ) : null}
            <PressableSpring style={styles.completeBtnInline} onPress={onComplete} scaleTo={0.98} haptic>
              <Text style={styles.completeText}>Marquer terminé</Text>
            </PressableSpring>
            {onCancel ? (
              <PressableSpring style={styles.cancelBtn} onPress={onCancel} scaleTo={0.97}>
                <Text style={styles.cancelText}>Annuler</Text>
              </PressableSpring>
            ) : null}
          </View>
        ) : null}
        {mode === 'patient' && showVisio && onJoinVisio ? (
          <View style={styles.actions}>
            <PressableSpring
              style={styles.visioBtn}
              onPress={() => {
                prodayHaptics.confirm();
                onJoinVisio();
              }}
              scaleTo={0.96}
              haptic
            >
              <Icon name="videocam" size={16} color={c.brandInverse} />
              <Text style={styles.visioText}>Rejoindre la visio</Text>
            </PressableSpring>
          </View>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98} haptic>
        {cardContent}
      </PressableSpring>
    );
  }

  return <View style={styles.card}>{cardContent}</View>;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    timeCol: {
      width: 58,
      alignItems: 'center',
      paddingTop: 2,
    },
    time: { fontSize: 15, fontWeight: '900', color: '#0F766E' },
    duration: { fontSize: 10, color: c.textMuted, marginTop: 2, fontWeight: '700' },
    body: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    name: { fontSize: 15, fontWeight: '900', color: c.text, flex: 1 },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    badgeText: { fontSize: 10, fontWeight: '800' },
    meta: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
    visioPending: {
      fontSize: 11,
      color: '#B45309',
      marginTop: spacing.xs,
      fontWeight: '600',
      fontStyle: 'italic',
    },
    motif: { fontSize: 12, color: c.textMuted, marginTop: spacing.xs, lineHeight: 17 },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    confirmBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#0F766E',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    confirmText: { color: c.brandInverse, fontWeight: '800', fontSize: 12 },
    visioBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#0F766E',
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    visioText: { color: c.brandInverse, fontWeight: '800', fontSize: 12 },
    cancelBtn: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    cancelText: { color: c.textSecondary, fontWeight: '700', fontSize: 12 },
    completeBtn: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingVertical: 6,
    },
    completeBtnInline: {
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
    },
    completeText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12 },
  });
}
