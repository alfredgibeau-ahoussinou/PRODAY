import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { MedicalAppointment } from '../../models/MedicalAppointment';
import { MEDICAL_APPOINTMENT_STATUS_LABELS } from '../../models/MedicalAppointment';
import { formatAppointmentDay, formatSlotLabel } from '../../utils/medicalSlots';
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
  onPress?: () => void;
}

export const MedicalAppointmentCard: React.FC<MedicalAppointmentCardProps> = ({
  appointment,
  mode,
  onConfirm,
  onCancel,
  onComplete,
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
          {appointment.location_label ? ` · ${appointment.location_label}` : ''}
        </Text>
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
          <PressableSpring style={styles.completeBtn} onPress={onComplete} scaleTo={0.98} haptic>
            <Text style={styles.completeText}>Marquer terminé</Text>
          </PressableSpring>
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
    completeText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12 },
  });
}
