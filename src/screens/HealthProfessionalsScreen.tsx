import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { User } from '../models/User';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import { MedicalBookingScreen } from './medical/MedicalBookingScreen';
import { PushScreenTransition } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing } from '../theme/designTokens';

/**
 * Annuaire pôle santé — joueurs Man / Woman.
 */
export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { openChat, setActiveTab } = useTabNavigation();
  const { colors } = useAppTheme();
  const [bookingPhysio, setBookingPhysio] = useState<User | null>(null);

  if (!profile || profile.role !== 'player') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Pôle santé"
          subtitle="Réservé aux joueurs et joueuses"
          centered
        />
      </View>
    );
  }

  const subtitle =
    'Kinés, coach mental, nutrition — prise de rendez-vous en ligne ou messagerie sécurisée.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          label="Bien-être"
          title="Pôle santé ProDay"
          subtitle={subtitle}
          showBrandLogo
        />
        <PhysioCarePanel
          profile={profile}
          onOpenChat={(threadId) => openChat(threadId)}
          onOpenMessages={() => setActiveTab('messages')}
          onBookPhysio={setBookingPhysio}
          expanded
        />
      </ScrollView>

      <PushScreenTransition active={bookingPhysio != null}>
        {bookingPhysio ? (
          <MedicalBookingScreen
            physio={bookingPhysio}
            patient={profile}
            onBack={() => setBookingPhysio(null)}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
});
