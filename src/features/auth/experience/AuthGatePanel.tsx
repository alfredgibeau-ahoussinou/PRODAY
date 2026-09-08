import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { AuthButton } from './AuthButton';
import { AUTH_XP } from './tokens';

type AuthGatePanelProps = {
  kicker: string;
  title: string;
  subtitle: string;
  accent: string;
  onAccent: string;
  createLabel: string;
  loginLabel: string;
  onCreate: () => void;
  onLogin: () => void;
};

/**
 * Gate Créer / Se connecter — composition centrée, accent pôle, zero clutter.
 */
export const AuthGatePanel: React.FC<AuthGatePanelProps> = ({
  kicker,
  title,
  subtitle,
  accent,
  onAccent,
  createLabel,
  loginLabel,
  onCreate,
  onLogin,
}) => (
  <View style={styles.root}>
    <View style={styles.kickerRow}>
      <View style={[styles.kickerDot, { backgroundColor: accent }]} />
      <ProDayText variant="eyebrow" style={[styles.kicker, { color: accent }]}>
        {kicker}
      </ProDayText>
    </View>

    <View style={[styles.accentBar, { backgroundColor: accent }]} />

    <ProDayText variant="title" style={styles.title}>
      {title}
    </ProDayText>
    <ProDayText variant="body" style={styles.sub}>
      {subtitle}
    </ProDayText>

    <AuthButton
      label={createLabel}
      onPress={onCreate}
      accent={accent}
      onAccent={onAccent}
    />

    <PressableSpring
      onPress={onLogin}
      style={[styles.loginChoice, { borderColor: accent }]}
      scaleTo={0.98}
      haptic
      accessibilityRole="button"
      accessibilityLabel={loginLabel}
    >
      <Icon name="person" size={18} color="#FFFFFF" />
      <ProDayText variant="section" style={styles.loginChoiceLabel}>
        {loginLabel}
      </ProDayText>
    </PressableSpring>
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: 'stretch',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  kickerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  accentBar: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    color: AUTH_XP.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 36,
  },
  sub: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginChoice: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: AUTH_XP.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 20,
  },
  loginChoiceLabel: {
    color: AUTH_XP.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
