import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { FeedHomeScreen } from '../components/feed/FeedHomeScreen';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { PressableSpring } from '../components/motion';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useTranslation } from '../context/LocaleContext';
import type { AppColors } from '../theme/universeTheme';

export const FeedTabScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const { setActiveTab, openChat, openAuth } = useTabNavigation();
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  

  if (loading) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <ActivityIndicator size="large" color={c.brand} />
      </View>
    );
  }

  if (profile) {
    return (
      <FeedHomeScreen
        profile={profile}
        onOpenChat={(threadId) => openChat(threadId)}
        onOpenMessages={() => setActiveTab('messages')}
      />
    );
  }

  const guestBody = (
    <View style={styles.guestBody}>
      <ProDayText variant="section">{t('feed.guest.title')}</ProDayText>
      <ProDayText variant="body" muted style={styles.guestSub}>
        {t('feed.guest.body')}
      </ProDayText>
      <PressableSpring onPress={() => openAuth('login')} scaleTo={0.98} haptic>
        <ProDayGradient kind="cta" style={styles.guestCta}>
          <ProDayText variant="caption" inverse style={styles.guestCtaText}>
            {t('common.login')}
          </ProDayText>
        </ProDayGradient>
      </PressableSpring>
    </View>
  );

  return (
    <TabScreenShell
      title={t('feed.title')}
      subtitle={isWoman ? t('feed.subtitle.woman') : t('feed.subtitle.default')}
      flat
    >
      {guestBody}
    </TabScreenShell>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    guestBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      justifyContent: 'center',
      gap: spacing.md,
    },
    guestSub: { lineHeight: 22 },
    guestCta: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    guestCtaText: { fontWeight: '800', letterSpacing: 0.3 },
  });
}
