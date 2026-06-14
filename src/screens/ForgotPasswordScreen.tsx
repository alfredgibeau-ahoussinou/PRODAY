import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../services/auth.service';
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader';
import { AuthPrimaryButton } from '../components/auth/AuthPrimaryButton';
import { useAuthStyles } from '../components/auth/authStyles';
import { useAuthLayout } from '../components/auth/useAuthLayout';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AnimatedEntrance, PressableSpring, StaggerReveal } from '../components/motion';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { Icon } from '../components/ui/Icon';
import { prodayHaptics } from '../utils/prodayHaptics';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialEmail = '',
  onBack,
}) => {
  const { compact, logoWidth, headerTopPad, scrollBottom } = useAuthLayout();
  const { colors: c } = useAppTheme();
  const authStyles = useAuthStyles();
  const local = useMemo(() => createLocalStyles(c), [c]);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const validateEmail = () => {
    const value = email.trim();
    if (!value) {
      setFieldError('Email requis');
      return false;
    }
    if (!EMAIL_RE.test(value)) {
      setFieldError('Format email invalide');
      return false;
    }
    setFieldError(undefined);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;
    setLoading(true);
    setError(null);
    try {
      await authService.sendPasswordReset(email);
      prodayHaptics.confirm();
      setSent(true);
    } catch (e) {
      prodayHaptics.error();
      setError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={authStyles.ambient} pointerEvents="none">
        <ProDayGradient kind="ambient" style={StyleSheet.absoluteFill} />
      </View>
      <ScrollView
        contentContainerStyle={[
          authStyles.scroll,
          { paddingTop: headerTopPad, paddingBottom: scrollBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={authStyles.toolbar}>
          <PressableSpring
            style={authStyles.backBtn}
            onPress={onBack}
            hitSlop={8}
            scaleTo={0.92}
            haptic
            accessibilityLabel="Retour"
          >
            <Icon name="arrow-back" size={20} color={c.ink} />
          </PressableSpring>
          <View style={{ width: 42 }} />
        </View>

        <View style={authStyles.brandRow}>
          <AuthBrandHeader width={logoWidth} tone="light" />
        </View>

        <View style={[authStyles.body, compact && authStyles.bodyCompact]}>
          {sent ? (
            <AnimatedEntrance>
              <View style={local.successBlock}>
                <View style={local.successIcon}>
                  <Icon name="mail" size={28} color={c.ink} />
                </View>
                <Text style={[authStyles.title, compact && authStyles.titleCompact]}>
                  Email envoyé
                </Text>
                <Text style={authStyles.sub}>
                  Un lien de réinitialisation a été envoyé à{' '}
                  <Text style={local.emailHighlight}>{email.trim()}</Text>.
                  {'\n\n'}
                  Consultez votre boîte mail et le dossier spam, puis suivez les instructions
                  pour choisir un nouveau mot de passe.
                </Text>
                <AuthPrimaryButton label="Retour à la connexion" onPress={onBack} />
                <PressableSpring
                  style={authStyles.linkBtn}
                  onPress={() => {
                    setSent(false);
                    setError(null);
                  }}
                  scaleTo={0.98}
                >
                  <Text style={[authStyles.linkText, local.linkUnderline]}>Renvoyer un email</Text>
                </PressableSpring>
              </View>
            </AnimatedEntrance>
          ) : (
            <>
              <AnimatedEntrance index={0}>
                <View style={authStyles.hero}>
                  <Text style={[authStyles.title, compact && authStyles.titleCompact]}>
                    Mot de passe oublié
                  </Text>
                  <Text style={authStyles.sub}>
                    Saisissez l’adresse email de votre compte ProDay. Nous vous enverrons un lien
                    pour réinitialiser votre mot de passe.
                  </Text>
                </View>
              </AnimatedEntrance>

              {error ? (
                <ProDayErrorBanner message={error} onDismiss={() => setError(null)} />
              ) : null}

              <AuthFormCard>
                  <StaggerReveal index={0}>
                    <AuthTextField
                      label="Email"
                      icon="mail"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (fieldError) setFieldError(undefined);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoFocus={!initialEmail}
                      returnKeyType="go"
                      onSubmitEditing={() => void handleSubmit()}
                      error={fieldError}
                    />
                  </StaggerReveal>

                  <StaggerReveal index={1}>
                    <AuthPrimaryButton
                      label="Envoyer le lien"
                      onPress={() => void handleSubmit()}
                      loading={loading}
                    />
                  </StaggerReveal>
              </AuthFormCard>

              <PressableSpring style={authStyles.linkBtn} onPress={onBack} scaleTo={0.98}>
                <Text style={[authStyles.linkText, local.linkUnderline]}>Retour à la connexion</Text>
              </PressableSpring>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function createLocalStyles(c: AppColors) {
  return StyleSheet.create({
    successBlock: { alignItems: 'stretch' },
    successIcon: {
      alignSelf: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    emailHighlight: {
      fontWeight: '800',
      color: c.text,
    },
    linkUnderline: {
      textDecorationLine: 'underline',
    },
  });
}
