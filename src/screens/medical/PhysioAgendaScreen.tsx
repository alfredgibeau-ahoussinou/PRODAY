import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePhysioAppointments } from '../../hooks/useMedicalAppointments';
import { medicalAppointmentsService } from '../../services/medicalAppointments.service';
import { MedicalAppointmentCard } from '../../components/medical/MedicalAppointmentCard';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { formatAppointmentDay } from '../../utils/medicalSlots';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

type AgendaFilter = 'all' | 'pending' | 'confirmed';

export const PhysioAgendaScreen: React.FC = () => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const profile = useSessionProfile();
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { appointments, loading, refresh } = usePhysioAppointments(profile?.uid);

  const filtered = useMemo(() => {
    const list = appointments
      .filter((a) => a.status !== 'cancelled')
      .sort((a, b) => a.start_at.getTime() - b.start_at.getTime());
    if (filter === 'pending') return list.filter((a) => a.status === 'pending');
    if (filter === 'confirmed') return list.filter((a) => a.status === 'confirmed');
    return list;
  }, [appointments, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const appt of filtered) {
      const key = formatAppointmentDay(appt.start_at);
      const bucket = map.get(key) ?? [];
      bucket.push(appt);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [filtered]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const updateStatus = async (
    id: string,
    status: 'confirmed' | 'cancelled' | 'completed'
  ) => {
    try {
      await medicalAppointmentsService.updateStatus(id, status);
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  if (!profile) {
    return (
      <View style={[styles.root, rootStyle]}>
        <Text style={styles.empty}>Connectez-vous pour voir votre agenda.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, rootStyle]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={MEDICAL_THEME.primary}
        />
      }
    >
      <PhysioScreenHeader
        title="Agenda"
        subtitle="Planning des consultations — confirmez, refusez ou clôturez chaque rendez-vous."
      />

      <View style={styles.filters}>
        {(
          [
            { id: 'all' as const, label: 'Tous' },
            { id: 'pending' as const, label: 'En attente' },
            { id: 'confirmed' as const, label: 'Confirmés' },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipOn]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={MEDICAL_THEME.primary} style={styles.loader} /> : null}

      {!loading && grouped.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
          <Text style={styles.emptySub}>
            Les joueurs réservent depuis l'onglet Santé (Man / Woman). Activez vos créneaux dans Cabinet.
          </Text>
        </View>
      ) : (
        grouped.map(([day, dayAppointments]) => (
          <View key={day} style={styles.dayGroup}>
            <Text style={styles.dayLabel}>{day}</Text>
            {dayAppointments.map((appt) => (
              <MedicalAppointmentCard
                key={appt.id}
                appointment={appt}
                mode="physio"
                onConfirm={
                  appt.status === 'pending'
                    ? () => void updateStatus(appt.id, 'confirmed')
                    : undefined
                }
                onCancel={
                  appt.status === 'pending'
                    ? () => void updateStatus(appt.id, 'cancelled')
                    : undefined
                }
                onComplete={
                  appt.status === 'confirmed'
                    ? () => void updateStatus(appt.id, 'completed')
                    : undefined
                }
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    },
    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    filterChipOn: {
      backgroundColor: MEDICAL_THEME.primary,
      borderColor: MEDICAL_THEME.primary,
    },
    filterText: { fontSize: 12, fontWeight: '700', color: c.textMuted },
    filterTextOn: { color: c.brandInverse },
    loader: { marginVertical: spacing.lg },
    dayGroup: { marginBottom: spacing.lg },
    dayLabel: {
      fontSize: 12,
      fontWeight: '900',
      color: MEDICAL_THEME.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    emptyCard: {
      padding: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: c.text },
    emptySub: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 18,
    },
    empty: {
      textAlign: 'center',
      color: c.textMuted,
      padding: spacing.xl,
    },
  });
}
