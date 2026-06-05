import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PhysioCarePanel } from '../components/feed/PhysioCarePanel';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing } from '../theme/designTokens';

/**
 * Annuaire pôle santé — joueurs Man / Woman.
 */
export const HealthProfessionalsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { openChat, setActiveTab } = useTabNavigation();
  const { colors, productLine } = useAppTheme();

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
    productLine === 'woman'
      ? 'Kinés, coach mental, nutrition et médecins du sport — contact direct sécurisé.'
      : 'Kinés, coach mental, nutrition et médecins du sport — contact direct sécurisé.';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
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
        expanded
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
});
