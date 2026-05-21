import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
const PRESETS = [30, 60, 90, 120, 180] as const;

interface ParentalTimeLimitScreenProps {
  onBack: () => void;
}

export const ParentalTimeLimitScreen: React.FC<ParentalTimeLimitScreenProps> = ({
  onBack,
}) => {
  const [minutes, setMinutes] = useState(90);
  const [activeDays, setActiveDays] = useState<Set<string>>(
    new Set(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'])
  );

  const toggleDay = (day: string) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const label =
    hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${minutes} min`;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Limite de temps" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Temps quotidien</Text>
        <View style={[styles.sliderCard, shadows.card]}>
          <Text style={styles.quotaValue}>{label}</Text>
          <Text style={styles.quotaHint}>par jour, jours actifs uniquement</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.presetBtn, minutes === m && styles.presetActive]}
                onPress={() => setMinutes(m)}
              >
                <Text
                  style={[
                    styles.presetText,
                    minutes === m && styles.presetTextActive,
                  ]}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.mt]}>Jours actifs</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d) => {
            const on = activeDays.has(d);
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayBtn, on && styles.dayActive]}
                onPress={() => toggleDay(d)}
              >
                <Text style={[styles.dayText, on && styles.dayTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={onBack}>
          <Text style={styles.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  mt: { marginTop: spacing.xl },
  sliderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quotaValue: { fontSize: 32, fontWeight: '800', color: colors.brand },
  quotaHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  presetActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  presetText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  presetTextActive: { color: '#FFFFFF' },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dayBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 44,
    alignItems: 'center',
  },
  dayActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  dayText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  dayTextActive: { color: '#FFFFFF' },
  saveBtn: {
    marginTop: spacing.xxl,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
