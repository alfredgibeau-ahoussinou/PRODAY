import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { HealthHomeScreen } from '../components/health/HealthHomeScreen';
import { MedicalBookingScreen } from './medical/MedicalBookingScreen';
import { PlayerAppointmentsScreen } from './medical/PlayerAppointmentsScreen';
import { PrivacyMedicalSettingsScreen } from './medical/PrivacyMedicalSettingsScreen';
import { PushScreenTransition } from '../components/motion';
import { JOUEUR_SITE } from '../content/joueurPageIdentity';
import { spacing, radius } from '../theme/designTokens';
import { useMedicalConfidentialityGate } from '../components/medical/MedicalConfidentialityNotice';

type HealthTab = 'book' | 'appointments' | 'privacy';

export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const [tab, setTab] = useState<HealthTab>('book');
  const [bookingPhysio, setBookingPhysio] = useState<import('../models/User').User | null>(null);
  const gate = useMedicalConfidentialityGate(profile?.uid);

  const copy = useMemo(() => {
    const g = joueurSession?.ageGroup;
    if (g === 'youth') {
      return {
        caption: 'Forme',
        title: 'Soins & forme',
        subtitle: 'Avec un adulte si besoin — réseau ProDay.',
        book: 'Soins',
        appointments: 'Mes RDV',
        privacy: 'Privé',
      };
    }
    if (g === 'teen') {
      return {
        caption: 'Santé',
        title: 'Forme & RDV',
        subtitle: 'Praticiens, confidentialité, suivi.',
        book: 'Réserver',
        appointments: 'RDV',
        privacy: 'Confidentialité',
      };
    }
    return {
      caption: 'Santé',
      title: 'RDV Santé',
      subtitle: 'Kinés, médecins du sport, confidentialité.',
      book: 'Réserver',
      appointments: 'Mes RDV',
      privacy: 'Confidentialité',
    };
  }, [joueurSession?.ageGroup]);

  if (!profile || profile.role !== 'player') {
    return (
      <ProDayScreenCanvas flat>
        <View style={[styles.blocked, { backgroundColor: colors.background }]}>
          <Icon name="heart" size={40} color={colors.textMuted} />
          <ProDayText variant="section">RDV Santé</ProDayText>
          <ProDayText variant="body" muted style={styles.blockedSub}>
            Réservé aux joueurs et joueuses.
          </ProDayText>
        </View>
      </ProDayScreenCanvas>
    );
  }

  const accent = joueurLive ? joueurSession!.identity.accent : colors.accent;
  const tabs = [
    { id: 'book' as const, label: copy.book },
    { id: 'appointments' as const, label: copy.appointments },
    { id: 'privacy' as const, label: copy.privacy },
  ];

  const body = (
    <>
      {gate.Notice}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: joueurLive ? JOUEUR_SITE.bg : colors.background,
            borderBottomColor: joueurLive ? JOUEUR_SITE.border : colors.border,
          },
        ]}
      >
        {tabs.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.tabChip,
              {
                backgroundColor: joueurLive ? JOUEUR_SITE.elevated : colors.brandSoft,
                borderRadius: joueurLive ? joueurSession!.identity.radius : radius.pill,
                borderWidth: joueurLive ? StyleSheet.hairlineWidth : 0,
                borderColor: tab === item.id ? accent : JOUEUR_SITE.border,
              },
              tab === item.id && { backgroundColor: accent },
            ]}
            onPress={() => setTab(item.id)}
          >
            <ProDayText
              variant="caption"
              style={[
                styles.tabText,
                { color: tab === item.id ? '#fff' : accent },
              ]}
            >
              {item.label}
            </ProDayText>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'book' ? (
        <HealthHomeScreen onBookPhysio={setBookingPhysio} />
      ) : tab === 'appointments' ? (
        gate.gateOpen ? (
          <PlayerAppointmentsScreen patient={profile} embedded />
        ) : (
          <View style={styles.blocked}>
            <ProDayText
              variant="body"
              muted={!joueurLive}
              style={joueurLive ? { color: JOUEUR_SITE.muted } : undefined}
            >
              Acceptez la notice de confidentialité pour voir vos rendez-vous.
            </ProDayText>
          </View>
        )
      ) : (
        <PrivacyMedicalSettingsScreen profile={profile} onBack={() => setTab('book')} />
      )}

      <PushScreenTransition active={bookingPhysio != null}>
        {bookingPhysio ? (
          <MedicalBookingScreen
            physio={bookingPhysio}
            patient={profile}
            onBack={() => setBookingPhysio(null)}
            onBooked={() => setTab('appointments')}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );

  if (joueurLive) {
    return (
      <TabScreenShell
        caption={copy.caption}
        title={copy.title}
        subtitle={copy.subtitle}
        flat
      >
        {body}
      </TabScreenShell>
    );
  }

  return <ProDayScreenCanvas flat>{body}</ProDayScreenCanvas>;
};

const styles = StyleSheet.create({
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  blockedSub: { textAlign: 'center' },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabText: { fontWeight: '700' },
});
