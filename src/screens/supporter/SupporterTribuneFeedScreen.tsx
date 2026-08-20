import React from 'react';
import { FeedHomeScreen } from '../../components/feed/FeedHomeScreen';
import { SupporterSpaceBackBar } from '../../components/supporterSpace/SupporterSpaceBackBar';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity } from '../../content/supporterPageIdentity';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { Icon } from '../../components/ui/Icon';

/** Onglet Fil tribune — question hebdo, réponses, actus. */
export const SupporterTribuneFeedScreen: React.FC = () => {
  const { profile, loading } = useAuth();
  const { setActiveTab, openChat, openAuth } = useTabNavigation();
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={SUPPORTER_SITE.accent} />
      </View>
    );
  }

  if (profile) {
    return (
      <SupporterPageFrame
        identity={getSupporterPageIdentity('debats')}
        showHero
        badge="100 % gratuit"
      >
        <SupporterSpaceBackBar />
        <FeedHomeScreen
          profile={profile}
          embedded
          variant="tribune"
          onOpenChat={(threadId) => openChat(threadId)}
          onOpenMessages={() => setActiveTab('messages')}
        />
      </SupporterPageFrame>
    );
  }

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('debats')} badge="Gratuit">
      <SupporterSpaceBackBar />
      <View style={styles.guestBody}>
        <View style={styles.guestIcon}>
          <Icon name="chat" size={28} color={SUPPORTER_SITE.accent} />
        </View>
        <ProDayText variant="title" style={styles.guestTitle}>
          {t('supporter.fil.guestTitle')}
        </ProDayText>
        <ProDayText variant="body" muted style={styles.guestSub}>
          {t('supporter.fil.guestBody')}
        </ProDayText>

        <View style={styles.guestPoints}>
          {[
            t('supporter.fil.guestPoint1'),
            t('supporter.fil.guestPoint2'),
            t('supporter.fil.guestPoint3'),
          ].map((line) => (
            <View key={line} style={styles.guestPoint}>
              <View style={styles.dot} />
              <ProDayText variant="caption" style={styles.guestPointText}>
                {line}
              </ProDayText>
            </View>
          ))}
        </View>

        <PressableSpring
          onPress={() => openAuth('signup')}
          scaleTo={0.98}
          haptic
          style={styles.guestCta}
        >
          <ProDayText variant="caption" style={styles.guestCtaText}>
            {t('supporter.fil.guestSignup')}
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={() => openAuth('login')} style={styles.guestSecondary}>
          <ProDayText variant="caption" style={styles.guestLogin}>
            {t('common.login')}
          </ProDayText>
        </PressableSpring>
      </View>
    </SupporterPageFrame>
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
  guestIcon: {
    width: 56,
    height: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: SUPPORTER_SITE.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    color: SUPPORTER_SITE.foreground,
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  guestSub: {
    lineHeight: 22,
    color: SUPPORTER_SITE.muted,
  },
  guestPoints: { gap: 10, marginTop: spacing.xs },
  guestPoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SUPPORTER_SITE.accent,
  },
  guestPointText: { color: SUPPORTER_SITE.foreground, fontWeight: '600', flex: 1 },
  guestCta: {
    alignSelf: 'flex-start',
    backgroundColor: SUPPORTER_SITE.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  guestCtaText: { color: '#fff', fontWeight: '800' },
  guestSecondary: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  guestLogin: { color: SUPPORTER_SITE.bright, fontWeight: '700' },
});
