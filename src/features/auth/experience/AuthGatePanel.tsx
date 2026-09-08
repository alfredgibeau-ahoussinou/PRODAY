import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { AuthButton } from './AuthButton';
import type { SignupVisualChrome } from '../../../screens/signup/signupVisualSystem';

type AuthGatePanelProps = {
  visual: SignupVisualChrome;
  title: string;
  subtitle: string;
  createLabel: string;
  loginLabel: string;
  onCreate: () => void;
  onLogin: () => void;
};

/**
 * Gate Créer / Se connecter — composition shell (wash + badge pôle + CTAs).
 */
export const AuthGatePanel: React.FC<AuthGatePanelProps> = ({
  visual,
  title,
  subtitle,
  createLabel,
  loginLabel,
  onCreate,
  onLogin,
}) => (
  <View style={styles.root}>
    <LinearGradient
      colors={[visual.washTop, visual.washTransparent]}
      style={styles.wash}
      pointerEvents="none"
    />

    <View style={[styles.poleBadge, { borderColor: visual.accentSoft, backgroundColor: visual.surface }]}>
      <View style={[styles.poleDot, { backgroundColor: visual.accent }]} />
      <ProDayText variant="caption" style={[styles.poleLabel, { color: visual.focus }]}>
        {visual.poleLabel}
      </ProDayText>
    </View>

    <ProDayText variant="title" style={[styles.title, { color: visual.text }]}>
      {title}
    </ProDayText>
    <ProDayText variant="body" style={[styles.sub, { color: visual.textMuted }]}>
      {subtitle}
    </ProDayText>

    <AuthButton
      label={createLabel}
      onPress={onCreate}
      accent={visual.accent}
      onAccent={visual.onAccent}
    />

    <PressableSpring
      onPress={onLogin}
      style={[
        styles.loginChoice,
        {
          borderColor: visual.borderStrong,
          backgroundColor: visual.elevated,
        },
      ]}
      scaleTo={0.98}
      haptic
      accessibilityRole="button"
      accessibilityLabel={loginLabel}
    >
      <Icon name="person" size={18} color={visual.text} />
      <ProDayText variant="section" style={[styles.loginChoiceLabel, { color: visual.text }]}>
        {loginLabel}
      </ProDayText>
    </PressableSpring>
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    height: 160,
  },
  poleBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 22,
  },
  poleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 36,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 28,
    textAlign: 'center',
  },
  loginChoice: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  loginChoiceLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
