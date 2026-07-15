import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { usePhysioAppointments } from '../../hooks/useMedicalAppointments';
import { medicalAppointmentsService } from '../../services/medicalAppointments.service';
import { MedicalAppointmentCard } from '../../components/medical/MedicalAppointmentCard';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { PhysioAvailabilityScreen } from './PhysioAvailabilityScreen';
import { PressableSpring } from '../../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { formatAppointmentDay } from '../../utils/medicalSlots';
import { getPhysioCalComBookingUrl, openCalComSignup } from '../../utils/calComBooking';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

type AgendaFilter = 'all' | 'pending' | 'confirmed';

export const PhysioAgendaScreen: React.FC = () => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { refreshProfile } = useAuth();
  const profile = useSessionProfile();
  const hasCalCom = Boolean(profile && getPhysioCalComBookingUrl(profile));
  const [showAvailability, setShowAvailability] = useState(false);
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { appointments, loading, refresh } = usePhysioAppointments(profile?.uid);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const filtered = useMemo(() => {
    const list = appointments
      .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
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
    await Promise.all([refresh(), refreshProfile()]);
    setRefreshing(false);
  }, [refresh, refreshProfile]);

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

  if (showAvailability) {
    return (
      <PhysioAvailabilityScreen profile={profile} onBack={() => setShowAvailability(false)} />
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
        subtitle="Vos rendez-vous : confirmez, refusez ou annulez les demandes des sportifs."
      />

      {!hasCalCom ? (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Lien Cal.com manquant</Text>
          <Text style={styles.setupBody}>
            Indiquez votre username Cal.com pour être réservable depuis votre fiche ProDay.
          </Text>
          <PressableSpring
            style={styles.setupBtn}
            onPress={() => setShowAvailability(true)}
            scaleTo={0.97}
            haptic
          >
            <Text style={styles.setupBtnText}>Renseigner mon username Cal.com</Text>
          </PressableSpring>
          <PressableSpring
            style={styles.setupBtnSecondary}
            onPress={() => {
              void openCalComSignup().catch(() => undefined);
            }}
            scaleTo={0.97}
          >
            <Text style={styles.setupBtnSecondaryText}>Créer un compte sur Cal.com</Text>
          </PressableSpring>
        </View>
      ) : null}

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

      {loading ? (
        <ActivityIndicator color={MEDICAL_THEME.primary} style={styles.loader} />
      ) : null}

      {!loading && grouped.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
          <Text style={styles.emptySub}>
            Quand un sportif réserve depuis votre fiche, la demande apparaît ici pour confirmation
            ou refus.
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
                  appt.status === 'pending' || appt.status === 'confirmed'
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
    setupCard: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: MEDICAL_THEME.primaryBorder,
      backgroundColor: MEDICAL_THEME.primaryBg,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    setupTitle: { fontSize: 16, fontWeight: '900', color: c.text },
    setupBody: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
    setupBtn: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      backgroundColor: MEDICAL_THEME.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    setupBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    setupBtnSecondary: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    setupBtnSecondaryText: {
      color: MEDICAL_THEME.primary,
      fontWeight: '700',
      fontSize: 13,
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
