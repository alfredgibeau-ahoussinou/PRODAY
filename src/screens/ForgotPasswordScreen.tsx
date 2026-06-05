import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../services/auth.service';
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader';
import { authStyles } from '../components/auth/authStyles';
import { useAuthLayout } from '../components/auth/useAuthLayout';
import { AuthTextField } from '../components/auth/AuthTextField';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius } from '../theme/designTokens';

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
      setSent(true);
    } catch (e) {
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
      <ScrollView
        contentContainerStyle={[authStyles.scroll, { paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            authStyles.header,
            { paddingTop: headerTopPad },
          ]}
        >
          <View style={authStyles.headerRow}>
            <Pressable
              style={authStyles.backBtn}
              onPress={onBack}
              hitSlop={8}
              accessibilityLabel="Retour"
            >
              <Icon name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
            <View style={authStyles.headerLogo}>
              <AuthBrandHeader width={logoWidth} tone="light" />
            </View>
            <View style={authStyles.headerSpacer} />
          </View>
        </View>

        <View style={[authStyles.body, compact && authStyles.bodyCompact]}>
          {sent ? (
            <View style={local.successBlock}>
              <View style={local.successIcon}>
                <Icon name="mail" size={28} color={colors.ink} />
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
              <Pressable style={authStyles.primaryBtn} onPress={onBack}>
                <Text style={authStyles.primaryBtnText}>Retour à la connexion</Text>
              </Pressable>
              <Pressable
                style={authStyles.linkBtn}
                onPress={() => {
                  setSent(false);
                  setError(null);
                }}
              >
                <Text style={[authStyles.linkText, local.linkUnderline]}>Renvoyer un email</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[authStyles.title, compact && authStyles.titleCompact]}>
                Mot de passe oublié
              </Text>
              <Text style={authStyles.sub}>
                Saisissez l’adresse email de votre compte ProDay. Nous vous enverrons un lien
                pour réinitialiser votre mot de passe.
              </Text>

              {error ? (
                <ProDayErrorBanner message={error} onDismiss={() => setError(null)} />
              ) : null}

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
                error={fieldError}
              />

              <Pressable
                style={[authStyles.primaryBtn, loading && authStyles.primaryDisabled]}
                onPress={() => void handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.brandInverse} />
                ) : (
                  <Text style={authStyles.primaryBtnText}>Envoyer le lien</Text>
                )}
              </Pressable>

              <Pressable style={authStyles.linkBtn} onPress={onBack}>
                <Text style={[authStyles.linkText, local.linkUnderline]}>Retour à la connexion</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const local = StyleSheet.create({
  successBlock: { alignItems: 'stretch' },
  successIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailHighlight: {
    fontWeight: '800',
    color: colors.text,
  },
  linkUnderline: {
    textDecorationLine: 'underline',
  },
});
