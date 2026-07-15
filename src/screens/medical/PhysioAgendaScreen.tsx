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
import { CalComBookingEmbed } from '../../components/medical/CalComBookingEmbed';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { PressableSpring } from '../../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { formatAppointmentDay } from '../../utils/medicalSlots';
import {
  getPhysioCalComBookingUrl,
  getPhysioCalComEmbedUrl,
  openCalComSignup,
} from '../../utils/calComBooking';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

type AgendaFilter = 'all' | 'pending' | 'confirmed';
type AgendaMode = 'calcom' | 'proday';

export const PhysioAgendaScreen: React.FC = () => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const profile = useSessionProfile();
  const calBookingUrl = profile ? getPhysioCalComBookingUrl(profile) : null;
  const calEmbedUrl = profile ? getPhysioCalComEmbedUrl(profile) : null;
  const [mode, setMode] = useState<AgendaMode>(calBookingUrl ? 'calcom' : 'proday');
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
        subtitle="Cal.com pour les téléconsultations — les sportifs réservent directement sur votre calendrier."
      />

      {calEmbedUrl && calBookingUrl ? (
        <View style={styles.modeRow}>
          {(
            [
              { id: 'calcom' as const, label: 'Cal.com' },
              { id: 'proday' as const, label: 'Demandes ProDay' },
            ] as const
          ).map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeChip, mode === m.id && styles.modeChipOn]}
              onPress={() => setMode(m.id)}
            >
              <Text style={[styles.modeText, mode === m.id && styles.modeTextOn]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Connectez Cal.com</Text>
          <Text style={styles.setupBody}>
            Indiquez votre username dans Cabinet → Créneaux pour afficher votre calendrier ici et
            permettre aux joueurs de réserver.
          </Text>
          <PressableSpring
            style={styles.setupBtn}
            onPress={() => {
              void openCalComSignup().catch(() => undefined);
            }}
            scaleTo={0.97}
            haptic
          >
            <Text style={styles.setupBtnText}>Créer un compte Cal.com</Text>
          </PressableSpring>
        </View>
      )}

      {mode === 'calcom' && calEmbedUrl && calBookingUrl ? (
        <View style={styles.calBlock}>
          <Text style={styles.calHint}>
            Votre agenda public. Les sportifs y réservent sans créer de compte Cal.com.
          </Text>
          <CalComBookingEmbed
            embedUrl={calEmbedUrl}
            bookingUrl={calBookingUrl}
            height={560}
            openLabel="Ouvrir mon Cal.com"
          />
        </View>
      ) : (
        <>
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
              <Text style={styles.emptyTitle}>Aucune demande ProDay</Text>
              <Text style={styles.emptySub}>
                Les réservations Cal.com apparaissent sur votre compte Cal.com. Les demandes envoyées
                via l’ancien parcours ProDay restent listées ici.
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
        </>
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
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    modeChip: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    modeChipOn: {
      backgroundColor: MEDICAL_THEME.primary,
      borderColor: MEDICAL_THEME.primary,
    },
    modeText: { fontSize: 13, fontWeight: '800', color: c.textMuted },
    modeTextOn: { color: c.brandInverse },
    calBlock: { gap: spacing.sm, marginBottom: spacing.lg },
    calHint: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
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
