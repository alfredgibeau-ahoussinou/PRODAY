import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import Animated, { FadeInUp } from 'react-native-reanimated';
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
import { brandForProductLine, type ProductLineId } from '../models/ProductLine';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGNUP_TEASER_HOMME = [
  'Inscription joueur uniquement',
  'Espace M, fiche sportive et stats',
  'Email confirmé puis accès au Mercato M',
];

const SIGNUP_TEASER_WOMAN = [
  'Inscription joueuse uniquement',
  'Catégorie F, fiche et stats',
  'Email confirmé puis accès au Mercato F',
];

const SIGNUP_TEASER_PRO = [
  'Coach, club, agent, orga ou partenaire',
  'Parcours métier dédié à votre rôle',
  'Validation pro puis accès à l’écosystème',
];

const SIGNUP_TEASER_SANTE = [
  'Kinés, médecins et praticiens du sport',
  'Agenda, messagerie et visibilité patients',
  'Validation pro puis accès au pôle Santé',
];

function authScreenCopy(line: ProductLineId, tab: AuthTabId): { title: string; sub: string } {
  const brand = brandForProductLine(line);
  if (tab === 'login') {
    if (line === 'woman') {
      return {
        title: 'Bon retour',
        sub: 'Connectez-vous à votre espace foot féminin.',
      };
    }
    if (line === 'pro') {
      return {
        title: 'Bon retour',
        sub: 'Connectez-vous à Pro Day Pro — staff, structures et partenaires.',
      };
    }
    return {
      title: 'Bon retour',
      sub: 'Connectez-vous à votre espace Pro Day Man.',
    };
  }
  if (line === 'woman') {
    return {
      title: `Rejoignez ${brand.name}`,
      sub: 'Créez votre compte joueuse — Mercato F, stats et visibilité clubs.',
    };
  }
  if (line === 'pro') {
    return {
      title: `Rejoignez ${brand.name}`,
      sub: 'Créez votre compte pro — coach, club, agent, orga ou partenaire.',
    };
  }
  if (line === 'sante') {
    return {
      title: `Rejoignez ${brand.name}`,
      sub: 'Créez votre compte praticien — agenda, messagerie et visibilité.',
    };
  }
  return {
    title: `Rejoignez ${brand.name}`,
    sub: 'Créez votre compte joueur — CV en ligne, Mercato M et matchs.',
  };
}

interface AuthScreenProps {
  /** Retour personnalisé (ex. invité → accueil). */
  onDismiss?: () => void;
  initialIntent?: AuthIntent;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onDismiss,
  initialIntent = 'login',
}) => {
  const authStyles = useAuthStyles();
  const { compact, logoWidth, headerTopPad, tabBarScrollInset: tabInset } = useAuthLayout();
  const { loading: authLoading, configured, refreshProfile } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const { productLine, colors } = useAppTheme();
  const activeBrand = brandForProductLine(productLine);
  const { openSpacePicker } = useLaunchIntro();
  const [tab, setTab] = useState<AuthTabId>(initialIntent === 'signup' ? 'signup' : 'login');
  const screenCopy = authScreenCopy(productLine, tab);
  const signupTeaser =
    productLine === 'woman'
      ? SIGNUP_TEASER_WOMAN
      : productLine === 'pro'
        ? SIGNUP_TEASER_PRO
        : productLine === 'sante'
          ? SIGNUP_TEASER_SANTE
          : SIGNUP_TEASER_HOMME;
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

  const onSignupComplete = useCallback(() => {
    setSignupOpen(false);
  }, []);

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
      await refreshProfile();
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
          productLine={productLine}
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
          { paddingTop: headerTopPad, paddingBottom: tabInset({ guestMode: true }) },
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
              accessibilityLabel="Retour à l'accueil"
            >
              <Icon name="arrow-back" size={20} color={colors.ink} />
            </PressableSpring>
            <PressableSpring
              style={authStyles.universeChip}
              onPress={openSpacePicker}
              scaleTo={0.96}
              haptic
              accessibilityLabel="Changer d’univers"
            >
              <Icon name="star-four-points" size={14} color={colors.accent} />
              <Text style={authStyles.universeChipText}>{activeBrand.name}</Text>
              <Icon name="chevron-down" size={14} color={colors.textMuted} />
            </PressableSpring>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1}>
          <View style={authStyles.brandRow}>
            <AuthBrandHeader width={logoWidth} tone="light" />
          </View>
        </AnimatedEntrance>

        <View style={[authStyles.body, compact && authStyles.bodyCompact]}>
          <AnimatedEntrance index={2}>
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

          <ProDayConfigNotice compact />

          {banner ? (
            <ProDayErrorBanner
              message={banner.message}
              variant={banner.variant}
              onDismiss={() => setBanner(null)}
            />
          ) : null}

          <Animated.View
            key={tab}
            entering={FadeInUp.springify()
              .damping(17)
              .stiffness(150)
              .duration(motion.duration.normal)}
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
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      error={fieldErrors.email}
                    />
                  </StaggerReveal>
                  <StaggerReveal index={quickLogin.canQuickLogin ? 2 : 1}>
                    <AuthTextField
                      ref={passwordRef}
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
                      onSuccess={refreshProfile}
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
            En continuant, vous acceptez les{' '}
            <Text style={authStyles.legalLink} onPress={() => setLegalDocument('terms')}>
              CGU
            </Text>{' '}
            et la{' '}
            <Text style={authStyles.legalLink} onPress={() => setLegalDocument('privacy')}>
              politique de confidentialité
            </Text>
            .
            </Text>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

