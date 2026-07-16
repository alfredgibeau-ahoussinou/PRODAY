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
import { hasPhysioCalComBooking, getPhysioCalComEmbedUrl, getPhysioCalComBookingUrl } from '../../utils/calComBooking';
import { CalComBookingEmbed } from '../../components/medical/CalComBookingEmbed';
import { recordV3UserAction } from '../../utils/recordV3Action';
import type { ConsultationType } from '../../models/MedicalAppointment';
import { CONSULTATION_TYPE_LABELS } from '../../models/MedicalAppointment';
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
        'Demande envoyée',
        `${physio.display_name} confirmera votre rendez-vous du ${formatAppointmentDay(selectedSlot)} à ${formatSlotLabel(selectedSlot)}.`
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
  const calEmbedUrl = getPhysioCalComEmbedUrl(physio);
  const calBookingUrl = getPhysioCalComBookingUrl(physio);
  const showCalEmbed = hasPhysioCalComBooking(physio) && calEmbedUrl && calBookingUrl;

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title={physio.display_name} subtitle={meta} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.typeSection}>
          <Text style={styles.typeLabel}>Type de consultation</Text>
          <View style={styles.typeRow}>
            {(['visio', 'cabinet', 'both'] as const).map((type) => {
              const active = consultationType === type;
              return (
                <PressableSpring
                  key={type}
                  style={[styles.typePill, active && styles.typePillActive]}
                  onPress={() => setConsultationType(type)}
                  scaleTo={0.96}
                >
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>
                    {CONSULTATION_TYPE_LABELS[type]}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        </View>

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
              {selectedSlot ? 'Confirmer' : 'Choisir un créneau'}
            </Text>
          )}
        </PressableSpring>

        {showCalEmbed ? (
          <View style={styles.calSection}>
            <Text style={styles.calLabel}>Ou réserver via Cal.com</Text>
            <CalComBookingEmbed
              embedUrl={calEmbedUrl}
              bookingUrl={calBookingUrl}
              openLabel="Ouvrir Cal.com"
              height={420}
            />
          </View>
        ) : null}
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
    typeSection: { gap: spacing.sm },
    typeLabel: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: c.textSecondary,
    },
    typeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    typePill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    typePillActive: {
      backgroundColor: '#CCFBF1',
      borderColor: '#0F766E',
    },
    typeText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    typeTextActive: { color: '#0F766E' },
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
    calSection: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    calLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
}
