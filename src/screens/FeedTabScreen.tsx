import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { FeedHomeScreen } from '../components/feed/FeedHomeScreen';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { AppTabHeader } from '../components/app/AppTabHeader';
import { ProDayText } from '../components/ui/ProDayText';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

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
      <ProDayScreenCanvas flat>
        <FeedHomeScreen
          profile={profile}
          onOpenChat={(threadId) => openChat(threadId)}
          onOpenMessages={() => setActiveTab('messages')}
        />
      </ProDayScreenCanvas>
    );
  }

  return (
    <ProDayScreenCanvas>
      <View style={styles.guestRoot}>
        <AppTabHeader
          safeTop={false}
          title="Fil"
          subtitle={
            isWoman
              ? 'Actualités et sondages du foot féminin'
              : 'Actualités et sondages de la plateforme'
          }
        />
        <View style={styles.guestBody}>
          <ProDayText variant="section">Suivez l&apos;activité ProDay</ProDayText>
          <ProDayText variant="body" muted style={styles.guestSub}>
            Connectez-vous pour publier, voter aux sondages agents et commenter l&apos;actualité
            de votre écosystème foot.
          </ProDayText>
        </View>
      </View>
    </ProDayScreenCanvas>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    guestRoot: { flex: 1 },
    guestBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      justifyContent: 'center',
      gap: spacing.sm,
    },
    guestSub: { lineHeight: 22 },
  });
}
