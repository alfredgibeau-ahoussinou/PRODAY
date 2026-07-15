import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import type { User } from '../../models/User';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profile.service';
import {
  getPhysioWeeklyAvailability,
  getPhysioConsultationDuration,
  isPhysioBookingEnabled,
} from '../../services/medicalAppointments.service';
import {
  blocksFromDaySchedule,
  CONSULTATION_DURATION_OPTIONS,
  dayScheduleFromBlocks,
  DEFAULT_CONSULTATION_DURATION_MIN,
  DEFAULT_DAY_SCHEDULE,
  WEEKDAY_LABELS,
  type DayScheduleConfig,
} from '../../utils/medicalSlots';
import {
  normalizeCalComBookingInput,
  openCalComSignup,
  validateCalComBookingInput,
} from '../../utils/calComBooking';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import type { AppColors } from '../../theme/universeTheme';

interface PhysioAvailabilityScreenProps {
  profile: User;
  onBack: () => void;
}

export const PhysioAvailabilityScreen: React.FC<PhysioAvailabilityScreenProps> = ({
  profile,
  onBack,
}) => {
  const { refreshProfile } = useAuth();
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  
  const [bookingEnabled, setBookingEnabled] = useState(isPhysioBookingEnabled(profile));
  const [calComUsername, setCalComUsername] = useState(
    profile.profile.cal_com_username ?? profile.profile.booking_url ?? ''
  );
  const [durationMin, setDurationMin] = useState(
    getPhysioConsultationDuration(profile) || DEFAULT_CONSULTATION_DURATION_MIN
  );
  const [days, setDays] = useState<DayScheduleConfig[]>(() =>
    dayScheduleFromBlocks(getPhysioWeeklyAvailability(profile))
  );
  const [saving, setSaving] = useState(false);

  const activeDays = useMemo(() => days.filter((d) => d.morning || d.afternoon).length, [days]);

  const toggleDayBlock = (weekday: number, block: 'morning' | 'afternoon') => {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday ? { ...d, [block]: !d[block] } : d
      )
    );
  };

  const resetDefaults = () => {
    setDays(DEFAULT_DAY_SCHEDULE.map((d) => ({ ...d })));
    setDurationMin(DEFAULT_CONSULTATION_DURATION_MIN);
    setBookingEnabled(true);
  };

  const handleSave = async () => {
    const calErr = validateCalComBookingInput(calComUsername);
    if (calErr) {
      Alert.alert('Cal.com requis', calErr);
      return;
    }
    const cal = normalizeCalComBookingInput(calComUsername);
    if (!cal) {
      Alert.alert('Cal.com requis', 'Username ou lien Cal.com invalide.');
      return;
    }
    if (bookingEnabled && activeDays === 0) {
      Alert.alert('Horaires requis', 'Activez au moins un créneau pour accepter des RDV en ligne.');
      return;
    }
    setSaving(true);
    try {
      await profileService.updateProfile(profile.uid, {
        profile: {
          booking_enabled: bookingEnabled,
          consultation_duration_min: durationMin,
          weekly_availability: blocksFromDaySchedule(days),
          cal_com_username: cal.username,
          booking_url: cal.bookingUrl,
        },
      });
      await refreshProfile();
      Alert.alert(
        'Enregistré',
        isWoman
          ? 'Cal.com et disponibilités à jour. Les joueuses réservent depuis votre fiche.'
          : 'Cal.com et disponibilités à jour. Les joueurs réservent depuis votre fiche.'
      );
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Mes créneaux" onBack={onBack} centered />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Icon name="calendar" size={24} color={c.accent} />
          <Text style={styles.heroTitle}>Disponibilités en ligne</Text>
          <Text style={styles.heroSub}>
            {isWoman
              ? 'Connectez votre Cal.com (obligatoire) et vos plages ProDay. Les joueuses réservent sans compte Cal.com.'
              : 'Connectez votre Cal.com (obligatoire) et vos plages ProDay. Les joueurs réservent sans compte Cal.com.'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Agenda Cal.com</Text>
        <Text style={styles.fieldHint}>
          Username ou lien public (ex. cabinet-martin-kine). Les sportifs ouvrent ce lien depuis votre fiche.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="ex. cabinet-martin-kine"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={calComUsername}
          onChangeText={setCalComUsername}
        />
        <Pressable
          onPress={() => {
            void openCalComSignup().catch(() => undefined);
          }}
          style={styles.calLink}
        >
          <Text style={styles.calLinkText}>Créer / ouvrir un compte Cal.com →</Text>
        </Pressable>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Prise de RDV activée</Text>
            <Text style={styles.toggleSub}>
              {bookingEnabled
                ? 'Votre profil affiche le bouton « RDV »'
                : 'Seule la messagerie reste disponible'}
            </Text>
          </View>
          <Switch
            value={bookingEnabled}
            onValueChange={setBookingEnabled}
            trackColor={{ false: c.border, true: c.accentSoft }}
            thumbColor={bookingEnabled ? c.accent : c.surfaceMuted}
          />
        </View>

        <Text style={styles.sectionLabel}>Durée d'une consultation</Text>
        <View style={styles.durationRow}>
          {CONSULTATION_DURATION_OPTIONS.map((min) => {
            const active = durationMin === min;
            return (
              <TouchableOpacity
                key={min}
                style={[styles.durationChip, active && styles.durationChipActive]}
                onPress={() => setDurationMin(min)}
              >
                <Text style={[styles.durationText, active && styles.durationTextActive]}>
                  {min} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Planning hebdomadaire</Text>
        {days.map((day) => (
          <View key={day.weekday} style={styles.dayCard}>
            <Text style={styles.dayLabel}>{WEEKDAY_LABELS[day.weekday]}</Text>
            <View style={styles.blockRow}>
              <BlockToggle
                styles={styles}
                label="Matin 9h–12h"
                active={day.morning}
                onPress={() => toggleDayBlock(day.weekday, 'morning')}
              />
              <BlockToggle
                styles={styles}
                label={day.weekday === 5 ? 'Après-midi 14h–17h' : 'Après-midi 14h–18h'}
                active={day.afternoon}
                onPress={() => toggleDayBlock(day.weekday, 'afternoon')}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.resetBtn} onPress={resetDefaults}>
          <Text style={styles.resetText}>Réinitialiser (lun–ven, horaires standards)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <>
              <Icon name="checkmark-circle" size={18} color={c.brandInverse} />
              <Text style={styles.saveBtnText}>Enregistrer mes créneaux</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const BlockToggle: React.FC<{
  styles: ReturnType<typeof createStyles>;
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ styles, label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.blockChip, active && styles.blockChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.blockChipText, active && styles.blockChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  hero: {
    backgroundColor: c.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: c.accent,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroTitle: { fontSize: 18, fontWeight: '900', color: c.text },
  heroSub: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
  fieldHint: {
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    color: c.text,
    backgroundColor: c.surface,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  calLink: { marginBottom: spacing.lg },
  calLinkText: { fontSize: 13, fontWeight: '700', color: c.accent },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: spacing.lg,
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '800', color: c.text },
  toggleSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  durationChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  durationText: { fontSize: 13, fontWeight: '800', color: c.text },
  durationTextActive: { color: c.brandInverse },
  dayCard: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: spacing.sm,
  },
  dayLabel: { fontSize: 14, fontWeight: '900', color: c.text, marginBottom: spacing.sm },
  blockRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  blockChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
  },
  blockChipActive: { backgroundColor: '#CCFBF1', borderColor: '#0F766E' },
  blockChipText: { fontSize: 12, fontWeight: '700', color: c.textMuted },
  blockChipTextActive: { color: '#0F766E' },
  resetBtn: { alignItems: 'center', paddingVertical: spacing.md },
  resetText: { fontSize: 12, fontWeight: '700', color: c.textMuted, textDecorationLine: 'underline' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: c.brandInverse, fontWeight: '900', fontSize: 15 },
  });
}
