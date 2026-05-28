import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/auth.service';
import { Logo } from '../components/Logo';
import { AuthTextField } from '../components/auth/AuthTextField';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows, BRAND } from '../theme/designTokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialEmail = '',
  onBack,
}) => {
  const insets = useSafeAreaInsets();
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={12}
            accessibilityLabel="Retour"
          >
            <Icon name="arrow-back" size={22} color={colors.brandInverse} />
          </TouchableOpacity>
          <Logo background="dark" width={140} showTagline={false} />
          <Text style={styles.heroTagline}>{BRAND.tagline}</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {sent ? (
            <View style={styles.successBlock}>
              <View style={styles.successIcon}>
                <Icon name="mail" size={28} color={colors.accent} />
              </View>
              <Text style={styles.title}>Email envoyé</Text>
              <Text style={styles.sub}>
                Un lien de réinitialisation a été envoyé à{' '}
                <Text style={styles.emailHighlight}>{email.trim()}</Text>.
                {'\n\n'}
                Consultez votre boîte mail et le dossier spam, puis suivez les instructions
                pour choisir un nouveau mot de passe.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onBack} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Retour à la connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => {
                  setSent(false);
                  setError(null);
                }}
              >
                <Text style={styles.linkText}>Renvoyer un email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.sub}>
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

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryDisabled]}
                onPress={() => void handleSubmit()}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={onBack}>
                <Text style={styles.linkText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
  },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  heroTagline: {
    marginTop: spacing.md,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.heroMuted,
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    minHeight: 420,
    ...shadows.interactive,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMedium,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  emailHighlight: {
    fontWeight: '800',
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.fab,
  },
  primaryDisabled: { opacity: 0.65 },
  primaryBtnText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 16,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  linkText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
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
  },
});
