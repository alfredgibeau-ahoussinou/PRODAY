import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { User } from '../../models/User';
import type { MedicalAppointment } from '../../models/MedicalAppointment';
import { MedicalAppointmentCard } from '../../components/medical/MedicalAppointmentCard';
import { VisioSessionScreen } from './VisioSessionScreen';
import { usePatientAppointments } from '../../hooks/usePatientAppointments';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ProDayText } from '../../components/ui/ProDayText';
import { PushScreenTransition } from '../../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { formatAppointmentDay } from '../../utils/medicalSlots';
import { canJoinVisioSession } from '../../utils/visioMeetingLink';
import type { AppColors } from '../../theme/universeTheme';

type PlayerAppointmentsScreenProps = {
  patient: User;
  onBack?: () => void;
  embedded?: boolean;
};

/** Liste des rendez-vous santé du joueur — téléconsultation incluse. */
export const PlayerAppointmentsScreen: React.FC<PlayerAppointmentsScreenProps> = ({
  patient,
  onBack,
  embedded = false,
}) => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { upcoming, loading, refresh } = usePatientAppointments(patient.uid);
  const [refreshing, setRefreshing] = useState(false);
  const [visioAppointment, setVisioAppointment] = useState<MedicalAppointment | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, MedicalAppointment[]>();
    for (const appt of upcoming) {
      const key = formatAppointmentDay(appt.start_at);
      const bucket = map.get(key) ?? [];
      bucket.push(appt);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [upcoming]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const body = (
    <ScrollView
      style={embedded ? undefined : [styles.root, rootStyle]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={MEDICAL_THEME.primary}
        />
      }
    >
      {!embedded ? (
        <ScreenHeader
          title="Mes rendez-vous"
          subtitle="Téléconsultations confirmées · visio disponible immédiatement"
          onBack={onBack}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={MEDICAL_THEME.primary} style={styles.loader} />
      ) : grouped.length === 0 ? (
        <View style={styles.emptyCard}>
          <ProDayText variant="section">Aucun rendez-vous</ProDayText>
          <ProDayText variant="body" muted style={styles.emptySub}>
            Réservez un créneau avec un praticien du pôle Santé. Les téléconsultations sont
            confirmées automatiquement — le bouton « Rejoindre la visio » apparaît dès la
            réservation.
          </ProDayText>
        </View>
      ) : (
        grouped.map(([day, dayAppointments]) => (
          <View key={day} style={styles.dayGroup}>
            <ProDayText variant="eyebrow" accent style={styles.dayLabel}>
              {day}
            </ProDayText>
            {dayAppointments.map((appt) => (
              <MedicalAppointmentCard
                key={appt.id}
                appointment={appt}
                mode="patient"
                onJoinVisio={
                  canJoinVisioSession(appt)
                    ? () => setVisioAppointment(appt)
                    : undefined
                }
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );

  if (embedded) {
    return (
      <>
        {body}
        <PushScreenTransition active={visioAppointment != null}>
          {visioAppointment ? (
            <VisioSessionScreen
              appointment={visioAppointment}
              onBack={() => setVisioAppointment(null)}
            />
          ) : null}
        </PushScreenTransition>
      </>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      {body}
      <PushScreenTransition active={visioAppointment != null}>
        {visioAppointment ? (
          <VisioSessionScreen
            appointment={visioAppointment}
            onBack={() => setVisioAppointment(null)}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    },
    loader: { marginVertical: spacing.lg },
    dayGroup: { marginBottom: spacing.lg },
    dayLabel: {
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    emptyCard: {
      padding: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptySub: { textAlign: 'center', lineHeight: 20 },
  });
}
