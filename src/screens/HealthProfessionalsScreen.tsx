import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useProDayBrain } from '../hooks/useProDayBrain';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { HealthHomeScreen } from '../components/health/HealthHomeScreen';
import { MedicalBookingScreen } from './medical/MedicalBookingScreen';
import { PushScreenTransition } from '../components/motion';
import { spacing } from '../theme/designTokens';

export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { productLine, colors } = useAppTheme();
  const [bookingPhysio, setBookingPhysio] = useState<User | null>(null);
  const { openChat, setActiveTab } = useTabNavigation();
  const brain = useProDayBrain(profile, productLine);
  const intelligence = useSectionIntelligence('sante', profile, productLine);

  if (!profile || profile.role !== 'player') {
    return (
      <ProDayScreenCanvas flat>
        <View style={[styles.blocked, { backgroundColor: colors.background }]}>
          <Icon name="heart" size={40} color={colors.textMuted} />
          <ProDayText variant="section">Pôle santé</ProDayText>
          <ProDayText variant="body" muted style={styles.blockedSub}>
            Réservé aux joueurs et joueuses.
          </ProDayText>
        </View>
      </ProDayScreenCanvas>
    );
  }

  return (
    <ProDayScreenCanvas flat>
      <HealthHomeScreen
        profile={profile}
        onOpenChat={(threadId) => openChat(threadId)}
        onOpenMessages={() => setActiveTab('messages')}
        onBookPhysio={setBookingPhysio}
        intelligence={intelligence}
        healthSnapshot={brain.ai.health}
      />

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
