import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { FeedScreen } from './FeedScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

/**
 * Onglet Fil — fil complet si connecté, aperçu invité sinon.
 */
export const FeedTabScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const { setActiveTab, openChat } = useTabNavigation();
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';

  if (loading) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <ActivityIndicator size="large" color={c.brand} />
      </View>
    );
  }

  if (profile) {
    return (
      <FeedScreen
        profile={profile}
        onOpenChat={(threadId) => openChat(threadId)}
        onOpenMessages={() => setActiveTab('messages')}
      />
    );
  }

  return (
    <View style={[styles.guestRoot, rootStyle]}>
      <ScreenHeader
        label="Communauté"
        title="Fil d'actualité"
        subtitle={
          isWoman
            ? 'Actualités et sondages du foot féminin'
            : 'Actualités et sondages de la plateforme'
        }
        showBrandLogo
        centered
      />
      <View style={styles.guestBody}>
        <Text style={styles.guestTitle}>Suivez l’activité ProDay</Text>
        <Text style={styles.guestSub}>
          Connectez-vous pour publier, voter aux sondages agents et commenter l’actualité de
          votre écosystème foot.
        </Text>
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    guestRoot: {
      flex: 1,
    },
    guestBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      justifyContent: 'center',
    },
    guestTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
      marginBottom: spacing.sm,
    },
    guestSub: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
    },
  });
}
