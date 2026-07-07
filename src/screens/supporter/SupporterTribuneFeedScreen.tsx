import React from 'react';
import { FeedHomeScreen } from '../../components/feed/FeedHomeScreen';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDayGradient } from '../../components/ui/ProDayGradient';
import { PressableSpring } from '../../components/motion';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';

/** Onglet Communauté tribune — débats, fil et question hebdo (100 % gratuit). */
export const SupporterTribuneFeedScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const { setActiveTab, openChat, openAuth } = useTabNavigation();
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
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

  return (
    <TabScreenShell
      caption={t('supporter.shell.caption')}
      title={t('supporter.debates.title')}
      subtitle={t('supporter.debates.subtitle')}
      flat
    >
      <View style={styles.guestBody}>
        <ProDayText variant="section">{t('supporter.debates.guestTitle')}</ProDayText>
        <ProDayText variant="body" muted style={styles.guestSub}>
          {t('supporter.debates.guestBody')}
        </ProDayText>
        <PressableSpring onPress={() => openAuth('login')} scaleTo={0.98} haptic>
          <ProDayGradient kind="cta" style={styles.guestCta}>
            <ProDayText variant="caption" inverse style={styles.guestCtaText}>
              {t('common.login')}
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
        <PressableSpring onPress={() => openAuth('signup')} style={styles.guestSecondary}>
          <ProDayText variant="caption" accent>
            {t('supporter.debates.guestSignup')}
          </ProDayText>
        </PressableSpring>
      </View>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
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
  guestSub: {
    lineHeight: 22,
  },
  guestCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  guestCtaText: {
    fontWeight: '700',
  },
  guestSecondary: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
