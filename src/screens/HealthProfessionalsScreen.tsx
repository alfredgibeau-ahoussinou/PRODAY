import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ProductLineContext';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { HealthHomeScreen } from '../components/health/HealthHomeScreen';
import { MedicalBookingScreen } from './medical/MedicalBookingScreen';
import { PushScreenTransition } from '../components/motion';
import { spacing } from '../theme/designTokens';

export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
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
      <HealthHomeScreen onBookPhysio={setBookingPhysio} />

      <PushScreenTransition active={bookingPhysio != null}>
        {bookingPhysio ? (
          <MedicalBookingScreen
            physio={bookingPhysio}
            patient={profile}
            onBack={() => setBookingPhysio(null)}
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
});
