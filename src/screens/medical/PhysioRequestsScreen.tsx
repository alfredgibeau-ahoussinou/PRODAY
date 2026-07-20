import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { usePhysioAppointments } from '../../hooks/useMedicalAppointments';
import { medicalAppointmentsService } from '../../services/medicalAppointments.service';
import { MedicalAppointmentCard } from '../../components/medical/MedicalAppointmentCard';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { StaggerReveal } from '../../components/motion';
import type { MedicalAppointment } from '../../models/MedicalAppointment';
import type { AppColors } from '../../theme/universeTheme';
import { requiresPhysioConfirmation } from '../../utils/visioMeetingLink';

/** Onglet Demandes — RDV en attente et demandes joueurs. */
export const PhysioRequestsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const profile = useSessionProfile();
  const [refreshing, setRefreshing] = useState(false);
  const { appointments, pendingCount, loading, refresh } = usePhysioAppointments(
    profile?.uid,
    30,
  );

  const pending = useMemo(
    () =>
      appointments
        .filter((a) => requiresPhysioConfirmation(a))
        .sort((a, b) => a.start_at.getTime() - b.start_at.getTime()),
    [appointments],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const updateStatus = async (appt: MedicalAppointment, status: 'confirmed' | 'cancelled') => {
    if (!profile) return;
    try {
      await medicalAppointmentsService.updateStatus(appt.id, status, {
        physio: profile,
        appointment: appt,
      });
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <PhysioScreenHeader
        title={t('medical.shell.requests')}
        subtitle={t('medical.requests.subtitle', { n: String(pendingCount) })}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {loading ? (
          <Text style={styles.empty}>{t('medical.requests.loading')}</Text>
        ) : pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('medical.requests.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('medical.requests.emptySub')}</Text>
          </View>
        ) : (
          pending.map((appt, index) => (
            <StaggerReveal key={appt.id} index={index}>
              <MedicalAppointmentCard
                appointment={appt}
                mode="physio"
                onConfirm={() => void updateStatus(appt, 'confirmed')}
                onCancel={() => void updateStatus(appt, 'cancelled')}
              />
            </StaggerReveal>
          ))
        )}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      gap: spacing.sm,
    },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl },
    emptyCard: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      gap: spacing.xs,
    },
    emptyTitle: { color: c.text, fontWeight: '800', fontSize: 16 },
    emptySub: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
  });
}
