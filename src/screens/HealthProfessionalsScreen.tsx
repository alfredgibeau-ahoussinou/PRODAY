import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ProductLineContext';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { HealthHomeScreen } from '../components/health/HealthHomeScreen';
import { MedicalBookingScreen } from './medical/MedicalBookingScreen';
import { PlayerAppointmentsScreen } from './medical/PlayerAppointmentsScreen';
import { PushScreenTransition } from '../components/motion';
import { spacing, radius } from '../theme/designTokens';

type HealthTab = 'book' | 'appointments';

export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<HealthTab>('book');
  const [bookingPhysio, setBookingPhysio] = useState<import('../models/User').User | null>(null);

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

  return (
    <ProDayScreenCanvas flat>
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(
          [
            { id: 'book' as const, label: 'Réserver' },
            { id: 'appointments' as const, label: 'Mes RDV' },
          ] as const
        ).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.tabChip,
              tab === item.id && { backgroundColor: '#0F766E' },
            ]}
            onPress={() => setTab(item.id)}
          >
            <ProDayText
              variant="caption"
              style={[
                styles.tabText,
                tab === item.id && styles.tabTextActive,
              ]}
            >
              {item.label}
            </ProDayText>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'book' ? (
        <HealthHomeScreen onBookPhysio={setBookingPhysio} />
      ) : (
        <PlayerAppointmentsScreen patient={profile} embedded />
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
    </ProDayScreenCanvas>
  );
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
    borderRadius: radius.pill,
    backgroundColor: '#CCFBF1',
  },
  tabText: { fontWeight: '700', color: '#0F766E' },
  tabTextActive: { color: '#FFFFFF' },
});
