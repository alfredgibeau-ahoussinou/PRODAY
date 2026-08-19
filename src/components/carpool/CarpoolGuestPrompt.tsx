import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring, AnimatedEntrance } from '../motion';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';
import { CarpoolSpaceBackground } from './CarpoolSpaceBackground';

interface CarpoolGuestPromptProps {
  onLogin: () => void;
  onSignup: () => void;
  joueurShell?: boolean;
}

export const CarpoolGuestPrompt: React.FC<CarpoolGuestPromptProps> = ({
  onLogin,
  onSignup,
  joueurShell = false,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      {joueurShell ? null : <CarpoolSpaceBackground />}
      <AnimatedEntrance kind="fadeUp" style={styles.content}>
        <View style={styles.brandOrb}>
          <Icon name="car" size={28} color={palette.onSignal} variant="filled" />
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

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: palette.bg,
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
      backgroundColor: palette.signal,
      marginBottom: spacing.sm,
    },
    kicker: {
      fontSize: 11,
      letterSpacing: 2.4,
      color: palette.signalDeep,
      fontWeight: '800',
    },
    title: {
      fontSize: 34,
      lineHeight: 38,
      color: palette.ink,
      fontWeight: '800',
      letterSpacing: -0.6,
      maxWidth: 320,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: palette.inkMuted,
      maxWidth: 320,
      marginBottom: spacing.md,
    },
    primary: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: 16,
      backgroundColor: palette.signal,
      borderRadius: 999,
      alignSelf: 'flex-start',
      minWidth: 220,
    },
    primaryText: {
      fontWeight: '800',
      color: palette.onSignal,
      fontSize: 15,
    },
    secondary: {
      paddingHorizontal: spacing.xl,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 999,
      alignSelf: 'flex-start',
      minWidth: 220,
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    secondaryText: {
      fontWeight: '800',
      color: palette.ink,
      fontSize: 14,
    },
  });
}
