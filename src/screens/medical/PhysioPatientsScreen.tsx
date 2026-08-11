import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { Icon } from '../../components/ui/Icon';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { usePhysioAppointments } from '../../hooks/useMedicalAppointments';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { PressableSpring, StaggerReveal } from '../../components/motion';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import type { AppColors } from '../../theme/universeTheme';
import { useMedicalConfidentialityGate } from '../../components/medical/MedicalConfidentialityNotice';
import { privacyAuditService } from '../../services/privacyGrants.service';

interface PhysioPatientsScreenProps {
  profile: User;
  onBack: () => void;
}

/** Liste des sportifs suivis (depuis les RDV). */
export const PhysioPatientsScreen: React.FC<PhysioPatientsScreenProps> = ({ profile, onBack }) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useTabNavigationActions();
  const { appointments, loading } = usePhysioAppointments(profile.uid, 90);
  const gate = useMedicalConfidentialityGate(profile.uid);

  const patients = useMemo(() => {
    const map = new Map<string, { name: string; lastVisit: Date }>();
    for (const appt of appointments) {
      if (appt.status === 'cancelled') continue;
      const prev = map.get(appt.patient_uid);
      if (!prev || appt.start_at > prev.lastVisit) {
        map.set(appt.patient_uid, { name: appt.patient_name, lastVisit: appt.start_at });
      }
    }
    return [...map.entries()]
      .map(([uid, data]) => ({ uid, ...data }))
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
  }, [appointments]);

  return (
    <View style={[styles.root, rootStyle]}>
      {gate.Notice}
      <ScreenHeader
        title={t('medical.patients.title')}
        subtitle={t('medical.patients.subtitle')}
        onBack={onBack}
        centered
      />
      {!gate.gateOpen ? (
        <Text style={styles.empty}>
          Acceptez la notice de confidentialité médicale pour consulter la liste des patients.
        </Text>
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.empty}>{t('medical.patients.loading')}</Text>
        ) : patients.length === 0 ? (
          <Text style={styles.empty}>{t('medical.patients.empty')}</Text>
        ) : (
          patients.map((patient, index) => (
            <StaggerReveal key={patient.uid} index={index}>
              <PressableSpring
                style={styles.row}
                onPress={() => {
                  void privacyAuditService.log({
                    actor_uid: profile.uid,
                    action: 'view',
                    resource_type: 'medical_appointment',
                    resource_id: patient.uid,
                    owner_uid: patient.uid,
                    context: 'physio_patients_list',
                  });
                  nav.setActiveTab('messages');
                }}
                scaleTo={0.98}
                haptic
              >
                <View style={styles.avatar}>
                  <Icon name="person" size={18} color={MEDICAL_THEME.primary} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{patient.name}</Text>
                  <Text style={styles.sub}>
                    {t('medical.patients.lastVisit', {
                      date: patient.lastVisit.toLocaleDateString('fr-FR'),
                    })}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={16} color={c.textMuted} />
              </PressableSpring>
            </StaggerReveal>
          ))
        )}
      </ScrollView>
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      gap: spacing.sm,
    },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: MEDICAL_THEME.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: 2 },
    name: { color: c.text, fontWeight: '700', fontSize: 15 },
    sub: { color: c.textMuted, fontSize: 12 },
  });
}
