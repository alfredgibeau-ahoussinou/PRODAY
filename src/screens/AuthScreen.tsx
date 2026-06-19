import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type TextInput,
} from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { authService } from '../services/auth.service';
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader';
import { AuthPrimaryButton } from '../components/auth/AuthPrimaryButton';
import { AuthRememberRow } from '../components/auth/AuthRememberRow';
import { AuthBiometricButton } from '../components/auth/AuthBiometricButton';
import { useAuthQuickLogin } from '../hooks/useAuthQuickLogin';
import { Icon } from '../components/ui/Icon';
import { AuthTabRail, type AuthTabId } from '../components/auth/AuthTabRail';
import { useAuthStyles } from '../components/auth/authStyles';
import { useAuthLayout } from '../components/auth/useAuthLayout';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthSocialButtons } from '../components/auth/AuthSocialButtons';
import { AnimatedEntrance, PressableSpring, StaggerReveal } from '../components/motion';
import { ProDayErrorBanner, type ProDayBannerVariant } from '../components/ui/ProDayErrorBanner';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { prodayHaptics } from '../utils/prodayHaptics';
import { motion } from '../theme/motion';
import { SignupFlow } from './signup/SignupFlow';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import type { LegalDocumentId } from '../content/legalDocuments';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation, type AuthIntent } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import { LanguageSettingControl } from '../components/settings/LanguageSettingControl';
import { useTranslation } from '../context/LocaleContext';
import { getLocalizedAuthCopy } from '../i18n/localizedContent';
import { getAuthSignupTeaser } from '../i18n/localizedAuth';
import type { UserRole } from '../models/User';
import { brandForProductLine, type ProductLineId } from '../models/ProductLine';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthScreenProps {
  /** Retour personnalisé (ex. invité → accueil). */
  onDismiss?: () => void;
  initialIntent?: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onDismiss,
  initialIntent = 'login',
  signupProductLine,
  signupInitialRole,
}) => {
  const authStyles = useAuthStyles();
  const { compact, logoWidth, headerTopPad, tabBarScrollInset: tabInset } = useAuthLayout();
  const { loading: authLoading, configured, refreshProfile } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const { productLine, colors } = useAppTheme();
  const activeBrand = brandForProductLine(productLine);
  const { openSpacePicker } = useLaunchIntro();
  const { t } = useTranslation();
  const [tab, setTab] = useState<AuthTabId>(initialIntent === 'signup' ? 'signup' : 'login');
  const screenCopy = getLocalizedAuthCopy(productLine, tab, t);
  const signupTeaser = useMemo(() => getAuthSignupTeaser(productLine, t), [productLine, t]);
  const [signupOpen, setSignupOpen] = useState(initialIntent === 'signup');
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const quickLogin = useAuthQuickLogin();

  useEffect(() => {
    if (!quickLogin.hydrated || !quickLogin.savedEmail) return;
    setEmail((prev) => prev || quickLogin.savedEmail || '');
  }, [quickLogin.hydrated, quickLogin.savedEmail]);

  const clearErrors = () => {
    setBanner(null);
    setFieldErrors({});
  };

  const showError = (message: string, variant: ProDayBannerVariant = 'error') => {
    setBanner({ message, variant });
  };

  const openSignup = useCallback(() => {
    clearErrors();
    setSignupOpen(true);
  }, []);

  const closeSignup = useCallback(() => {
    setSignupOpen(false);
    setSignupPrefill(null);
    setTab('login');
    clearErrors();
  }, []);

  const onSignupComplete = useCallback(async () => {
    setSignupOpen(false);
    await refreshProfile();
    setActiveTab('home');
  }, [refreshProfile, setActiveTab]);

  const goHomeAfterAuth = useCallback(async () => {
    await refreshProfile();
    setActiveTab('home');
  }, [refreshProfile, setActiveTab]);

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

  const handleLogin = async (creds?: { email: string; password: string }) => {
    const loginEmail = creds?.email ?? email;
    const loginPassword = creds?.password ?? password;
    if (!creds && !validateLoginFields()) return;
    setLoading(true);
    clearErrors();
    try {
      await authService.signIn(loginEmail, loginPassword);
      await quickLogin.persistAfterLogin(loginEmail, loginPassword);
      await goHomeAfterAuth();
      prodayHaptics.confirm();
    } catch (e) {
      prodayHaptics.error();
      showError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    clearErrors();
    try {
      const creds = await quickLogin.performBiometricLogin();
      if (!creds) return;
      setEmail(creds.email);
      await handleLogin(creds);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleBack = () => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    setActiveTab('home');
  };

  if (!configured) {
    return (
      <View style={[authStyles.root, authStyles.centered]}>
        <AuthBrandHeader width={140} tone="light" />
        <View style={authStyles.configWrap}>
          <ProDayConfigNotice blockingOnly />
        </View>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={[authStyles.root, authStyles.centered]}>
        <ActivityIndicator size="large" color={colors.ink} />
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

  if (signupOpen) {
    return (
      <View style={authStyles.root}>
        <SignupFlow
          productLine={signupProductLine ?? productLine}
          initialRole={signupInitialRole}
          onClose={closeSignup}
          onComplete={onSignupComplete}
          initialEmail={signupPrefill?.email}
          initialDisplayName={signupPrefill?.displayName}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[authStyles.root, { position: 'relative' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={authStyles.ambient} pointerEvents="none">
        <ProDayGradient kind="ambient" style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        contentContainerStyle={[
          authStyles.scroll,
          { paddingTop: headerTopPad, paddingBottom: tabInset() },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance index={0}>
          <View style={authStyles.toolbar}>
            <PressableSpring
              style={authStyles.backBtn}
              onPress={handleBack}
              hitSlop={8}
              scaleTo={0.92}
              haptic
              accessibilityLabel={t('auth.backHome')}
            >
              <Icon name="arrow-back" size={20} color={colors.ink} />
            </PressableSpring>
            <View style={authStyles.toolbarEnd}>
              <LanguageSettingControl variant="chip" />
              <PressableSpring
                style={authStyles.universeChip}
                onPress={openSpacePicker}
                scaleTo={0.96}
                haptic
                accessibilityLabel={t('auth.changeUniverse')}
              >
                <Icon name="star-four-points" size={14} color={colors.accent} />
                <Text style={authStyles.universeChipText}>{activeBrand.name}</Text>
                <Icon name="chevron-down" size={14} color={colors.textMuted} />
              </PressableSpring>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} kind="fadeUp">
          <View style={authStyles.brandRow}>
            <AuthBrandHeader width={logoWidth} tone="light" />
          </View>
        </AnimatedEntrance>

        <View style={[authStyles.body, compact && authStyles.bodyCompact]}>
          <AnimatedEntrance index={2} kind="fadeUp">
            <View style={authStyles.hero}>
              <Text style={authStyles.eyebrow}>{activeBrand.tagline}</Text>
              <Text style={[authStyles.title, compact && authStyles.titleCompact]}>
                {screenCopy.title}
              </Text>
              <Text style={authStyles.sub}>{screenCopy.sub}</Text>
            </View>
          </AnimatedEntrance>

          <AuthTabRail
            active={tab}
            onSelect={(id) => {
              setTab(id);
              clearErrors();
            }}
            compact={compact}
          />

          {banner ? (
            <ProDayErrorBanner
              message={banner.message}
              variant={banner.variant}
              onDismiss={() => setBanner(null)}
            />
          ) : null}

          <Animated.View
            key={tab}
            entering={FadeIn.duration(motion.duration.fast).easing(Easing.out(Easing.cubic))}
          >
            {tab === 'login' ? (
              <>
                {quickLogin.canQuickLogin && quickLogin.savedEmail ? (
                  <StaggerReveal index={0}>
                    <AuthBiometricButton
                      email={quickLogin.savedEmail}
                      biometricLabel={quickLogin.biometricLabel}
                      onPress={() => void handleBiometricLogin()}
                      loading={biometricLoading || loading}
                    />
                  </StaggerReveal>
                ) : null}

                <AuthFormCard>
                  <StaggerReveal index={quickLogin.canQuickLogin ? 1 : 0}>
                    <AuthTextField
                      label={t('auth.email')}
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
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      error={fieldErrors.email}
                    />
                  </StaggerReveal>
                  <StaggerReveal index={quickLogin.canQuickLogin ? 2 : 1}>
                    <AuthTextField
                      ref={passwordRef}
                      label={t('auth.password')}
                      icon="lock"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: '' }));
                      }}
                      secureToggle
                      autoComplete="password"
                      returnKeyType="go"
                      onSubmitEditing={() => void handleLogin()}
                      error={fieldErrors.password}
                    />
                  </StaggerReveal>

                  <AuthRememberRow
                    rememberMe={quickLogin.rememberMe}
                    onRememberMeChange={quickLogin.setRememberMe}
                    biometricEnabled={quickLogin.biometricEnabled}
                    onBiometricChange={quickLogin.setBiometricEnabled}
                    biometricLabel={quickLogin.biometricLabel}
                    biometricAvailable={quickLogin.biometricAvailable}
                  />

                  <View style={authStyles.forgotRow}>
                    <PressableSpring
                      onPress={() => {
                        clearErrors();
                        setShowForgotPassword(true);
                      }}
                      scaleTo={0.98}
                    >
                      <Text style={authStyles.forgotText}>Mot de passe oublié ?</Text>
                    </PressableSpring>
                  </View>

                  <StaggerReveal index={quickLogin.canQuickLogin ? 3 : 2}>
                    <AuthPrimaryButton
                      label="Se connecter"
                      onPress={() => void handleLogin()}
                      loading={loading}
                    />
                  </StaggerReveal>

                  <View style={authStyles.dividerRow}>
                    <View style={authStyles.dividerLine} />
                    <Text style={authStyles.dividerText}>ou</Text>
                    <View style={authStyles.dividerLine} />
                  </View>

                  <StaggerReveal index={quickLogin.canQuickLogin ? 4 : 3}>
                    <AuthSocialButtons
                      disabled={loading}
                      onSuccess={goHomeAfterAuth}
                      onNeedsProfile={(prefill) => {
                        setSignupPrefill(prefill);
                        openSignup();
                      }}
                      onError={(msg) => showError(msg)}
                    />
                  </StaggerReveal>
                </AuthFormCard>
              </>
            ) : (
              <View style={authStyles.signupTeaser}>
                {signupTeaser.map((line, i) => (
                  <StaggerReveal key={line} index={i}>
                    <View style={authStyles.teaserRow}>
                      <View style={authStyles.teaserNum}>
                        <Text style={authStyles.teaserNumText}>{i + 1}</Text>
                      </View>
                      <Text style={authStyles.teaserText}>{line}</Text>
                    </View>
                  </StaggerReveal>
                ))}
                <StaggerReveal index={signupTeaser.length}>
                  <AuthPrimaryButton
                    label={`Inscription ${activeBrand.name}`}
                    onPress={openSignup}
                  />
                </StaggerReveal>
              </View>
            )}
          </Animated.View>

          <AnimatedEntrance index={3} kind="fade">
            <Text style={authStyles.legal}>
            {t('auth.legalPrefix')}{' '}
            <Text style={authStyles.legalLink} onPress={() => setLegalDocument('terms')}>
              {t('auth.terms')}
            </Text>{' '}
            {t('auth.and')}{' '}
            <Text style={authStyles.legalLink} onPress={() => setLegalDocument('privacy')}>
              {t('auth.privacy')}
            </Text>
            .
            </Text>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

