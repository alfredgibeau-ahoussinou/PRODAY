import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import type { User } from '../../models/User';
import { Icon, type IconName } from '../../components/ui/Icon';
import { PhysioHomeTopBar } from '../../components/medical/PhysioHomeTopBar';
import { MedicalAppointmentCard } from '../../components/medical/MedicalAppointmentCard';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { usePhysioAppointments } from '../../hooks/useMedicalAppointments';
import { medicalAppointmentsService } from '../../services/medicalAppointments.service';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { PressableSpring, PushScreenTransition, SkeletonList, StaggerReveal } from '../../components/motion';
import { PhysioAvailabilityScreen } from './PhysioAvailabilityScreen';
import { PhysioPatientsScreen } from './PhysioPatientsScreen';
import { VisioSessionScreen } from './VisioSessionScreen';
import { isPhysioBookingEnabled } from '../../services/medicalAppointments.service';
import { canJoinVisioSession, requiresPhysioConfirmation } from '../../utils/visioMeetingLink';
import type { MedicalAppointment } from '../../models/MedicalAppointment';
import type { AppColors } from '../../theme/universeTheme';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { useSanteVisioEnabled } from '../../hooks/useSanteVisioEnabled';
import { SanteVisioBetaBanner } from '../../components/medical/SanteVisioBetaBanner';
import { useTranslation } from '../../context/LocaleContext';

interface PhysioDashboardScreenProps {
  profile: User;
}

export const PhysioDashboardScreen: React.FC<PhysioDashboardScreenProps> = ({ profile }) => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const { count: unreadCount } = useUnreadMessageCount();
  const { appointments, todayAppointments, pendingCount, loading, refresh } =
    usePhysioAppointments(profile.uid);
  const { enabled: visioEnabled } = useSanteVisioEnabled();
  const [refreshing, setRefreshing] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const [visioAppointment, setVisioAppointment] = useState<MedicalAppointment | null>(null);
  const bookingOnline = isPhysioBookingEnabled(profile);

  const specialty =
    profile.profile.medical_specialty ?? profile.profile.job_title ?? 'Praticien';

  const uniquePatients = useMemo(() => {
    const map = new Map<string, string>();
    for (const appt of appointments) {
      if (appt.status === 'cancelled') continue;
      map.set(appt.patient_uid, appt.patient_name);
    }
    return [...map.entries()].map(([uid, name]) => ({ uid, name }));
  }, [appointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const updateStatus = async (
    appt: MedicalAppointment,
    status: 'confirmed' | 'cancelled' | 'completed'
  ) => {
    try {
      await medicalAppointmentsService.updateStatus(appt.id, status, {
        physio: profile,
        appointment: appt,
      });
      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('physio.dashboard.errorFallback'));
    }
  };

  const goMessages = () => nav.setActiveTab('messages');
  const goAgenda = () => nav.setActiveTab('matchs'); // PhysioAgendaScreen via resolveMainTabScreen
  const goRequests = () => nav.setActiveTab('feed'); // PhysioRequestsScreen
  const goProfile = () => nav.openProfile();

  const StatCard: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
  }> = ({ label, value, highlight }) => (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const QuickAction: React.FC<{
    icon: IconName;
    label: string;
    onPress: () => void;
  }> = ({ icon, label, onPress }) => (
    <PressableSpring style={styles.quickAction} onPress={onPress} scaleTo={0.96} haptic>
      <Icon name={icon} size={18} color={MEDICAL_THEME.primary} />
      <Text style={styles.quickLabel}>{label}</Text>
    </PressableSpring>
  );

  const dashboardScroll = (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={MEDICAL_THEME.primary}
        />
      }
    >
      <PhysioHomeTopBar
        profile={profile}
        unreadMessages={unreadCount}
        onMessagesPress={goMessages}
        onCabinetPress={goProfile}
      />

      <View style={styles.bookingBanner}>
        <Icon name="calendar" size={18} color={bookingOnline ? MEDICAL_THEME.primary : c.textMuted} />
        <Text style={styles.bookingBannerText}>
          {bookingOnline
            ? t('physio.dashboard.bookingOnline')
            : t('physio.dashboard.bookingOffline')}
        </Text>
        <PressableSpring
          style={styles.bookingBannerBtn}
          onPress={() => setShowAvailability(true)}
          scaleTo={0.96}
          haptic
        >
          <Text style={styles.bookingBannerBtnText}>{t('physio.dashboard.slots')}</Text>
        </PressableSpring>
      </View>

      <View style={styles.quickRow}>
        <QuickAction icon="people" label={t('physio.dashboard.patients')} onPress={() => setShowPatients(true)} />
        <QuickAction icon="calendar" label={t('physio.dashboard.agenda')} onPress={goAgenda} />
        <QuickAction icon="notifications" label={t('physio.dashboard.requests')} onPress={goRequests} />
      </View>

      {loading ? <SkeletonList count={2} variant="card" /> : null}

      <Text style={styles.sectionTitle}>{t('physio.dashboard.todayTitle')}</Text>
      {!visioEnabled ? <SanteVisioBetaBanner compact /> : null}
      {todayAppointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="calendar" size={28} color={c.textMuted} />
          <Text style={styles.emptyTitle}>{t('physio.dashboard.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('physio.dashboard.emptySub')}</Text>
          <PressableSpring style={styles.agendaLink} onPress={goAgenda} scaleTo={0.97} haptic>
            <Text style={styles.agendaLinkText}>{t('physio.dashboard.viewAgenda')}</Text>
          </PressableSpring>
        </View>
      ) : (
        todayAppointments.map((appt, index) => (
          <StaggerReveal key={appt.id} index={index}>
            <MedicalAppointmentCard
              appointment={appt}
              mode="physio"
              visioPlatformEnabled={visioEnabled}
              onConfirm={() => void updateStatus(appt, 'confirmed')}
              onCancel={() => void updateStatus(appt, 'cancelled')}
              onComplete={() => void updateStatus(appt, 'completed')}
              onJoinVisio={
                canJoinVisioSession(appt, { platformEnabled: visioEnabled })
                  ? () => setVisioAppointment(appt)
                  : undefined
              }
            />
          </StaggerReveal>
        ))
      )}

      {pendingCount > 0 ? (
        <>
          <Text style={[styles.sectionTitle, styles.sectionGap]}>{t('physio.dashboard.pendingTitle')}</Text>
          {appointments
            .filter((a) => requiresPhysioConfirmation(a))
            .map((appt, index) => (
              <StaggerReveal key={`pending-${appt.id}`} index={index}>
                <MedicalAppointmentCard
                  appointment={appt}
                  mode="physio"
                  onConfirm={() => void updateStatus(appt, 'confirmed')}
                  onCancel={() => void updateStatus(appt, 'cancelled')}
                />
              </StaggerReveal>
            ))}
        </>
      ) : null}

      {uniquePatients.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, styles.sectionGap]}>{t('physio.dashboard.followedTitle')}</Text>
          {uniquePatients.map((p, index) => (
            <StaggerReveal key={p.uid} index={index}>
              <PressableSpring style={styles.patientRow} onPress={() => setShowPatients(true)} scaleTo={0.98} haptic>
                <View style={styles.patientAvatar}>
                  <Icon name="person" size={18} color={MEDICAL_THEME.primary} />
                </View>
                <View style={styles.patientCopy}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientSub}>{t('physio.dashboard.patientSub')}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={c.textMuted} />
              </PressableSpring>
            </StaggerReveal>
          ))}
        </>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={[styles.root, rootStyle]}>
      <TabScreenShell
        caption={t('physio.dashboard.caption')}
        title={t('physio.dashboard.greeting', { name: profile.display_name })}
        subtitle={`${specialty}${profile.city ? ` · ${profile.city}` : ''}. ${t('physio.dashboard.subtitleDay')}`}
        flat
      >
        {dashboardScroll}
      </TabScreenShell>

      <PushScreenTransition active={showAvailability}>
        <PhysioAvailabilityScreen
          profile={profile}
          onBack={() => setShowAvailability(false)}
        />
      </PushScreenTransition>

      <PushScreenTransition active={showPatients}>
        {showPatients ? (
          <PhysioPatientsScreen profile={profile} onBack={() => setShowPatients(false)} />
        ) : null}
      </PushScreenTransition>

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
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    },
    agendaLink: {
      marginTop: spacing.md,
      backgroundColor: MEDICAL_THEME.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    agendaLinkText: { color: c.brandInverse, fontWeight: '800', fontSize: 13 },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    statCardHighlight: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
    statValue: { fontSize: 22, fontWeight: '900', color: MEDICAL_THEME.primary },
    statValueHighlight: { color: '#B45309' },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textMuted,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    bookingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    bookingBannerText: { flex: 1, fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    bookingBannerBtn: {
      backgroundColor: MEDICAL_THEME.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    bookingBannerBtnText: { color: c.brandInverse, fontWeight: '800', fontSize: 11 },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    quickAction: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    quickLabel: { fontSize: 11, fontWeight: '800', color: c.text },
    loader: { marginVertical: spacing.lg },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: c.text,
      marginBottom: spacing.sm,
    },
    sectionGap: { marginTop: spacing.lg },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: c.text, marginTop: spacing.sm },
    emptySub: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    patientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.sm,
    },
    patientAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#CCFBF1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    patientCopy: { flex: 1 },
    patientName: { fontSize: 14, fontWeight: '800', color: c.text },
    patientSub: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
}
