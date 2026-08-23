import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDaySymbol } from '../../../components/branding/ProDaySymbol';
import { ProDayText } from '../../../components/ui/ProDayText';
import { AuthButton } from './AuthButton';
import { AUTH_XP } from './tokens';

type AuthSuccessMomentProps = {
  title?: string;
  subtitle?: string;
  ctaLabel: string;
  onCta: () => void;
  displayName?: string;
};

/** Moment ProDay post-inscription — logo + bienvenue, zéro confetti. */
export const AuthSuccessMoment: React.FC<AuthSuccessMomentProps> = ({
  title = 'Bienvenue sur ProDay.',
  subtitle,
  ctaLabel,
  onCta,
  displayName,
}) => (
  <View style={styles.root}>
    <ProDaySymbol size={64} variant="master" tone="white" />
    <ProDayText variant="title" style={styles.title}>
      {title}
    </ProDayText>
    {displayName ? (
      <ProDayText variant="body" style={styles.name}>
        {displayName}
      </ProDayText>
    ) : null}
    {subtitle ? (
      <ProDayText variant="body" style={styles.sub}>
        {subtitle}
      </ProDayText>
    ) : null}
    <View style={styles.cta}>
      <AuthButton label={ctaLabel} onPress={onCta} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
    backgroundColor: AUTH_XP.black,
  },
  title: {
    color: AUTH_XP.white,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 28,
    letterSpacing: -0.3,
  },
  name: {
    color: AUTH_XP.goldBright,
    textAlign: 'center',
    fontSize: 16,
  },
  sub: {
    color: AUTH_XP.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },
  cta: {
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
  },
});
