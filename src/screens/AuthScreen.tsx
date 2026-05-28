import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/auth.service';
import { Logo } from '../components/Logo';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthSocialButtons } from '../components/auth/AuthSocialButtons';
import { ProDayErrorBanner, type ProDayBannerVariant } from '../components/ui/ProDayErrorBanner';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { SignupFlow } from './signup/SignupFlow';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import { ProfileScreen } from './ProfileScreen';
import type { LegalDocumentId } from '../content/legalDocuments';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadows, BRAND } from '../theme/designTokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = 'signup' | 'login';

export const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, loading: authLoading, configured, refreshProfile, signOut } =
    useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{
    message: string;
    variant: ProDayBannerVariant;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signupPrefill, setSignupPrefill] = useState<{
    email: string;
    displayName?: string;
  } | null>(null);
  /** Garde le wizard d'inscription monté après création du compte (success / document). */
  const [signupWizardActive, setSignupWizardActive] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);

  const clearErrors = () => {
    setBanner(null);
    setFieldErrors({});
  };

  const showError = (message: string, variant: ProDayBannerVariant = 'error') => {
    setBanner({ message, variant });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearErrors();
    if (next === 'signup') {
      setSignupWizardActive(true);
    } else {
      setSignupPrefill(null);
      setSignupWizardActive(false);
    }
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email requis';
    if (!EMAIL_RE.test(value.trim())) return 'Format email invalide';
    return undefined;
  };

  const validateLoginFields = () => {
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!password) errs.password = 'Mot de passe requis';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginFields()) return;
    setLoading(true);
    clearErrors();
    try {
      await authService.signIn(email, password);
      await refreshProfile();
    } catch (e) {
      showError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    switchMode('login');
  };

  if (!configured) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Logo background="light" width={140} />
        <View style={styles.configWrap}>
          <ProDayConfigNotice blockingOnly />
        </View>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        initialEmail={email}
        onBack={() => {
          setShowForgotPassword(false);
          clearErrors();
        }}
      />
    );
  }

  if (legalDocument) {
    return (
      <LegalDocumentScreen
        documentId={legalDocument}
        onBack={() => setLegalDocument(null)}
      />
    );
  }

  if (signupWizardActive) {
    return (
      <SignupFlow
        onClose={() => {
          setSignupWizardActive(false);
          setMode('login');
          setSignupPrefill(null);
          clearErrors();
        }}
        onComplete={() => setSignupWizardActive(false)}
        initialEmail={signupPrefill?.email}
        initialDisplayName={signupPrefill?.displayName}
      />
    );
  }

  if (profile) {
    return (
      <ProfileScreen
        profile={profile}
        onRefresh={refreshProfile}
        onSignOut={handleSignOut}
      />
    );
  }

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
        <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
          <Logo background="dark" width={160} showTagline={false} />
          <Text style={styles.heroTagline}>{BRAND.tagline}</Text>
          <Text style={styles.heroTitle}>Bon retour</Text>
          <Text style={styles.heroSub}>
            Connectez-vous pour accéder à votre espace ProDay
          </Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, styles.modeTabActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.modeTabText, styles.modeTabTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modeTab} onPress={() => switchMode('signup')}>
              <Text style={styles.modeTabText}>Inscription</Text>
            </TouchableOpacity>
          </View>

          <ProDayConfigNotice compact />

          {banner ? (
            <ProDayErrorBanner
              message={banner.message}
              variant={banner.variant}
              onDismiss={() => setBanner(null)}
            />
          ) : null}

          <AuthTextField
            label="Email"
            icon="mail"
            placeholder="vous@exemple.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <AuthTextField
            label="Mot de passe"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: '' }));
            }}
            secureToggle
            autoComplete="password"
            error={fieldErrors.password}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              clearErrors();
              setShowForgotPassword(true);
            }}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={colors.brandInverse} />
            ) : (
              <Text style={styles.primaryBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <AuthSocialButtons
            disabled={loading}
            onSuccess={refreshProfile}
            onNeedsProfile={(prefill) => {
              setSignupPrefill(prefill);
              switchMode('signup');
            }}
            onError={(msg) => showError(msg)}
          />

          <Text style={styles.legal}>
            En continuant, vous acceptez les{' '}
            <Text style={styles.legalLink} onPress={() => setLegalDocument('terms')}>
              CGU
            </Text>{' '}
            et la{' '}
            <Text style={styles.legalLink} onPress={() => setLegalDocument('privacy')}>
              politique de confidentialité
            </Text>
            .
          </Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  heroTagline: {
    marginTop: spacing.md,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.heroMuted,
    textAlign: 'center',
  },
  heroTitle: {
    marginTop: spacing.xl,
    fontSize: 32,
    fontWeight: '800',
    color: colors.brandInverse,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  heroSub: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.heroMuted,
    textAlign: 'center',
    maxWidth: 300,
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
  modeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  modeTabActive: {
    borderBottomColor: colors.accent,
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  configWrap: {
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.lg,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  forgotText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadows.fab,
  },
  primaryDisabled: { opacity: 0.65 },
  primaryBtnText: {
    color: colors.brandInverse,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legal: {
    marginTop: spacing.lg,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  legalLink: {
    color: colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
