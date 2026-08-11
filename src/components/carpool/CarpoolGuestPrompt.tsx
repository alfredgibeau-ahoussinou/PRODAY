import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { CarpoolSpaceBackground } from './CarpoolSpaceBackground';

interface CarpoolGuestPromptProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const CarpoolGuestPrompt: React.FC<CarpoolGuestPromptProps> = ({ onLogin, onSignup }) => {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <CarpoolSpaceBackground />
      <AnimatedEntrance kind="fadeUp" style={styles.content}>
        <View style={styles.brandOrb}>
          <Icon name="car" size={28} color={CARPOOL_SITE.asphalt} variant="filled" />
        </View>
        <Text style={styles.kicker}>{t('carpool.caption').toUpperCase()}</Text>
        <Text style={styles.title}>{t('carpool.guest.title')}</Text>
        <Text style={styles.body}>{t('carpool.guest.body')}</Text>
        <PressableSpring onPress={onLogin} scaleTo={0.96} haptic style={styles.primary}>
          <Text style={styles.primaryText}>{t('common.login')}</Text>
        </PressableSpring>
        <PressableSpring onPress={onSignup} scaleTo={0.97} haptic style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('common.guest.signup')}</Text>
        </PressableSpring>
      </AnimatedEntrance>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: CARPOOL_SITE.sky,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
      zIndex: 1,
    },
    brandOrb: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARPOOL_SITE.signal,
      marginBottom: spacing.sm,
    },
    kicker: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 11,
      letterSpacing: 2.4,
      color: CARPOOL_SITE.signalDeep,
      fontWeight: '800',
    },
    title: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 34,
      lineHeight: 38,
      color: CARPOOL_SITE.ink,
      fontWeight: '800',
      letterSpacing: -0.6,
      maxWidth: 320,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: CARPOOL_SITE.inkMuted,
      maxWidth: 320,
      marginBottom: spacing.md,
    },
    primary: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: 16,
      backgroundColor: CARPOOL_SITE.asphalt,
      borderRadius: 999,
      alignSelf: 'flex-start',
      minWidth: 220,
    },
    primaryText: {
      fontFamily: CARPOOL_SITE.display,
      fontWeight: '800',
      color: '#fff',
      fontSize: 15,
    },
    secondary: {
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: CARPOOL_SITE.fog,
      borderRadius: 999,
      alignSelf: 'flex-start',
      minWidth: 220,
      alignItems: 'center',
      backgroundColor: CARPOOL_SITE.surface,
    },
    secondaryText: {
      fontWeight: '800',
      color: CARPOOL_SITE.ink,
      fontSize: 14,
    },
  });
}
