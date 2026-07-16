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
import { Icon } from '../../components/ui/Icon';
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

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Prendre rendez-vous" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroName}>{physio.display_name}</Text>
          <Text style={styles.heroMeta}>
            {specialty}
            {physio.city ? ` · ${physio.city}` : ''}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Choisir un jour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
          {days.map((day) => {
            const active = day.toDateString() === selectedDay.toDateString();
            return (
              <PressableSpring
                key={day.toISOString()}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {formatAppointmentDay(day)}
                </Text>
              </PressableSpring>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Créneaux disponibles</Text>
        {loadingSlots ? (
          <ActivityIndicator color="#0F766E" style={styles.loader} />
        ) : slots.length === 0 ? (
          <Text style={styles.empty}>Aucun créneau ce jour-là. Essayez une autre date.</Text>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const active = selectedSlot?.getTime() === slot.getTime();
              return (
                <PressableSpring
                  key={slot.toISOString()}
                  style={[styles.slotChip, active && styles.slotChipActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>
                    {formatSlotLabel(slot)}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>Motif (optionnel)</Text>
        <TextInput
          style={styles.motifInput}
          placeholder="Ex. genou, bilan, mental…"
          placeholderTextColor={c.textMuted}
          value={motif}
          onChangeText={setMotif}
          multiline
        />

        <PressableSpring
          style={[styles.bookBtn, (!selectedSlot || booking) && styles.bookBtnDisabled]}
          onPress={() => void handleBook()}
          disabled={!selectedSlot || booking}
        >
          {booking ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <>
              <Icon name="calendar" size={18} color={c.brandInverse} />
              <Text style={styles.bookBtnText}>
                {selectedSlot
                  ? `Demander — ${formatSlotLabel(selectedSlot)}`
                  : 'Sélectionnez un créneau'}
              </Text>
            </>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    hero: {
      marginBottom: spacing.lg,
      gap: 4,
    },
    heroName: { fontSize: 20, fontWeight: '900', color: c.text },
    heroMeta: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    dayRow: { marginBottom: spacing.lg },
    dayChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: spacing.sm,
      backgroundColor: c.surface,
    },
    dayChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
    dayChipText: { fontSize: 12, fontWeight: '700', color: c.text },
    dayChipTextActive: { color: c.brandInverse },
    loader: { marginVertical: spacing.lg },
    empty: { fontSize: 13, color: c.textMuted, fontStyle: 'italic', marginBottom: spacing.lg },
    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    slotChip: {
      minWidth: '30%',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    slotChipActive: { backgroundColor: c.accent, borderColor: c.accent },
    slotText: { fontSize: 13, fontWeight: '800', color: c.text },
    slotTextActive: { color: c.brandInverse },
    motifInput: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.text,
      backgroundColor: c.surface,
      textAlignVertical: 'top',
      marginBottom: spacing.lg,
    },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
    },
    bookBtnDisabled: { opacity: 0.5 },
    bookBtnText: { color: c.brandInverse, fontWeight: '900', fontSize: 15 },
  });
}
