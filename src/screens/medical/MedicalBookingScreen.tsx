import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import type { User } from '../../models/User';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { medicalAppointmentsService } from '../../services/medicalAppointments.service';
import {
  formatAppointmentDay,
  formatSlotLabel,
  nextBookingDays,
} from '../../utils/medicalSlots';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import type { AppColors } from '../../theme/universeTheme';
import { recordV3UserAction } from '../../utils/recordV3Action';
import type { ConsultationType } from '../../models/MedicalAppointment';
import { fontFamily } from '../../theme/typography';

interface MedicalBookingScreenProps {
  physio: User;
  patient: User;
  onBack: () => void;
  onBooked?: () => void;
}

export const MedicalBookingScreen: React.FC<MedicalBookingScreenProps> = ({
  physio,
  patient,
  onBack,
  onBooked,
}) => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const days = useMemo(() => nextBookingDays(14), []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [slots, setSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [motif, setMotif] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('visio');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const available = await medicalAppointmentsService.getAvailableSlots(physio, selectedDay);
      setSlots(available);
    } finally {
      setLoadingSlots(false);
    }
  }, [physio, selectedDay]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await medicalAppointmentsService.bookAppointment({
        physio,
        patient,
        startAt: selectedSlot,
        motif,
        consultationType,
      });
      Alert.alert(
        isCabinet ? 'Demande envoyée' : 'Rendez-vous confirmé',
        isCabinet
          ? `${physio.display_name} confirmera votre rendez-vous du ${formatAppointmentDay(selectedSlot)} à ${formatSlotLabel(selectedSlot)}.`
          : `Votre téléconsultation avec ${physio.display_name} est confirmée pour le ${formatAppointmentDay(selectedSlot)} à ${formatSlotLabel(selectedSlot)}. Le lien visio est disponible dans Mes RDV.`
      );
      recordV3UserAction(patient, 'book_health');
      onBooked?.();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Réservation impossible.');
    } finally {
      setBooking(false);
    }
  };

  const specialty =
    physio.profile.medical_specialty ?? physio.profile.job_title ?? 'Pôle médical';
  const meta = [specialty, physio.city].filter(Boolean).join(' · ');
  const isCabinet = consultationType === 'cabinet';

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title={physio.display_name} subtitle={meta} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.visioHint}>
          Téléconsultation par défaut. Vos informations de compte ProDay seront utilisées
          automatiquement.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
        >
          {days.map((day) => {
            const active = day.toDateString() === selectedDay.toDateString();
            return (
              <PressableSpring
                key={day.toISOString()}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedDay(day)}
                scaleTo={0.96}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {formatAppointmentDay(day)}
                </Text>
              </PressableSpring>
            );
          })}
        </ScrollView>

        {loadingSlots ? (
          <ActivityIndicator color={c.accent} style={styles.loader} />
        ) : slots.length === 0 ? (
          <Text style={styles.empty}>Aucun créneau ce jour-là.</Text>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const active = selectedSlot?.getTime() === slot.getTime();
              return (
                <PressableSpring
                  key={slot.toISOString()}
                  style={[styles.slotPill, active && styles.slotPillActive]}
                  onPress={() => setSelectedSlot(slot)}
                  scaleTo={0.96}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>
                    {formatSlotLabel(slot)}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        )}

        <PressableSpring
          style={styles.cabinetToggle}
          onPress={() => setConsultationType(isCabinet ? 'visio' : 'cabinet')}
          scaleTo={0.98}
        >
          <Text style={styles.cabinetToggleText}>
            {isCabinet ? '← Revenir à la téléconsultation' : 'Consultation au cabinet ?'}
          </Text>
        </PressableSpring>

        <TextInput
          style={styles.noteInput}
          placeholder="Note (optionnel)"
          placeholderTextColor={c.textMuted}
          value={motif}
          onChangeText={setMotif}
          multiline
        />

        <PressableSpring
          style={[styles.confirmBtn, (!selectedSlot || booking) && styles.confirmBtnDisabled]}
          onPress={() => void handleBook()}
          disabled={!selectedSlot || booking}
          scaleTo={0.98}
        >
          {booking ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selectedSlot
                ? isCabinet
                  ? 'Demander ce créneau (cabinet)'
                  : 'Réserver ce créneau (visio)'
                : 'Choisir un créneau'}
            </Text>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    visioHint: {
      fontSize: 13,
      color: c.accent,
      lineHeight: 18,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
    },
    dayRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
    },
    pillActive: { backgroundColor: c.accent },
    pillText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    pillTextActive: { color: c.brandInverse },
    loader: { marginVertical: spacing.md },
    empty: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    slotPill: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md + 4,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      minWidth: 72,
      alignItems: 'center',
    },
    slotPillActive: { backgroundColor: c.accent },
    slotText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    slotTextActive: { color: c.brandInverse },
    cabinetToggle: {
      alignSelf: 'flex-start',
    },
    cabinetToggleText: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: c.textSecondary,
      textDecorationLine: 'underline',
    },
    noteInput: {
      minHeight: 72,
      borderRadius: radius.lg,
      padding: spacing.md,
      color: c.text,
      backgroundColor: c.surface,
      textAlignVertical: 'top',
      fontSize: 16,
    },
    confirmBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.accent,
      borderRadius: radius.xl,
      paddingVertical: spacing.md + 2,
      marginTop: spacing.sm,
    },
    confirmBtnDisabled: { opacity: 0.45 },
    confirmBtnText: {
      color: c.brandInverse,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      fontSize: 17,
    },
  });
}
