import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { AuthSocialButtons } from '../../../components/auth/AuthSocialButtons';
import type { SignupVisualChrome } from '../../../screens/signup/signupVisualSystem';
import { colors, radius, spacing } from '../../../theme/designTokens';

type AuthGatePanelProps = {
  visual: SignupVisualChrome;
  title: string;
  subtitle: string;
  onCreateWithEmail: () => void;
  onPhoneAuth: () => void;
  onLogin: () => void;
  onSocialSuccess: () => void | Promise<void>;
  onNeedsProfile: (prefill: { email: string; displayName?: string }) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
};

/**
 * Gate Créer un compte — Options claires et directes :
 * 1. Continuer avec Google
 * 2. Continuer avec Apple
 * 3. Continuer avec l'email
 * 4. Continuer avec le téléphone
 */
export const AuthGatePanel: React.FC<AuthGatePanelProps> = ({
  visual,
  title,
  subtitle,
  onCreateWithEmail,
  onPhoneAuth,
  onLogin,
  onSocialSuccess,
  onNeedsProfile,
  onError,
  disabled = false,
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

    {/* Primary Auth Choices */}
    <View style={styles.actionsGroup}>
      {/* Social Providers (Google & Apple) */}
      <AuthSocialButtons
        disabled={disabled}
        onSuccess={onSocialSuccess}
        onNeedsProfile={onNeedsProfile}
        onError={onError}
      />

      {/* Email Registration */}
      <PressableSpring
        onPress={onCreateWithEmail}
        style={[styles.actionBtn, styles.btnEmail]}
        disabled={disabled}
        scaleTo={0.97}
        haptic
        accessibilityRole="button"
        accessibilityLabel="Continuer avec l'email"
      >
        <Ionicons name="mail" size={20} color="#000000" />
        <Text style={styles.btnEmailText}>Continuer avec l’email</Text>
      </PressableSpring>

      {/* Phone Registration */}
      <PressableSpring
        onPress={onPhoneAuth}
        style={[styles.actionBtn, styles.btnPhone]}
        disabled={disabled}
        scaleTo={0.97}
        haptic
        accessibilityRole="button"
        accessibilityLabel="Continuer avec le téléphone"
      >
        <Ionicons name="call-outline" size={19} color="#FFFFFF" />
        <Text style={styles.btnPhoneText}>Continuer avec le téléphone</Text>
      </PressableSpring>
    </View>

    {/* Switch to Login */}
    <View style={styles.switchRow}>
      <Text style={styles.switchLeading}>Vous avez déjà un compte ?</Text>
      <PressableSpring onPress={onLogin} scaleTo={0.96} haptic hitSlop={8}>
        <Text style={[styles.switchLink, { color: visual.focus }]}>Se connecter</Text>
      </PressableSpring>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    alignItems: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.xxl,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  poleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 32,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  actionsGroup: {
    gap: 10,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 26,
    paddingVertical: 13,
    minHeight: 50,
  },
  btnEmail: {
    backgroundColor: colors.accent,
  },
  btnEmailText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  btnPhone: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  btnPhoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  switchLeading: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
