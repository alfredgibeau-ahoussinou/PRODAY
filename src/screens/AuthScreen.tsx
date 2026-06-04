import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../services/auth.service';
import { Logo } from '../components/Logo';
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader';
import { AuthTabRail, type AuthTabId } from '../components/auth/AuthTabRail';
import { authStyles } from '../components/auth/authStyles';
import { useAuthLayout } from '../components/auth/useAuthLayout';
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
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useLaunchIntro } from '../context/LaunchIntroContext';
import { BRAND, colors, spacing } from '../theme/designTokens';
import { PRODAY_WOMAN_BRAND } from '../models/ProductLine';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGNUP_TEASER = [
  'Choisissez votre rôle (joueur, coach, agent…)',
  'Complétez votre profil en quelques étapes',
  'Vérifiez votre identité puis confirmez votre email',
];

export const AuthScreen: React.FC = () => {
  const { compact, logoWidth, insets, scrollBottom } = useAuthLayout();
  const { profile, loading: authLoading, configured, refreshProfile, signOut } =
    useAuth();
  const { setActiveTab } = useTabNavigation();
  const { isWoman, productLine } = useAppTheme();
  const { openSpacePicker } = useLaunchIntro();
  const [tab, setTab] = useState<AuthTabId>('login');
  const [signupOpen, setSignupOpen] = useState(false);
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
    setSignupOpen(false);
    clearErrors();
  };

  if (!configured) {
    return (
      <View style={[authStyles.root, authStyles.centered]}>
        <Logo background="light" width={140} />
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

  if (profile) {
    return (
      <ProfileScreen
        profile={profile}
        onRefresh={refreshProfile}
        onSignOut={handleSignOut}
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
      style={authStyles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[authStyles.scroll, { paddingBottom: scrollBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[authStyles.header, { paddingTop: insets.top + (compact ? spacing.sm : spacing.md) }]}>
          <AuthBrandHeader width={logoWidth} tone="light" />
          <Text style={authStyles.tagline}>
            {isWoman ? PRODAY_WOMAN_BRAND.tagline : BRAND.tagline}
          </Text>
          <Pressable style={authStyles.spacePickerLink} onPress={openSpacePicker}>
            <Text style={authStyles.spacePickerText}>
              {isWoman ? 'ProDay for Women' : 'ProDay Classic'} — changer d’univers
            </Text>
          </Pressable>
        </View>

        <View style={[authStyles.body, compact && authStyles.bodyCompact]}>
          <AuthTabRail
            active={tab}
            onSelect={(id) => {
              setTab(id);
              clearErrors();
            }}
            compact={compact}
          />

          <Text style={[authStyles.title, compact && authStyles.titleCompact]}>
            {tab === 'login' ? 'Bon retour' : isWoman ? 'Rejoignez ProDay Woman' : 'Rejoignez ProDay'}
          </Text>
          <Text style={authStyles.sub}>
            {tab === 'login'
              ? isWoman
                ? 'Connectez-vous à votre espace foot féminin.'
                : 'Connectez-vous pour accéder à votre espace.'
              : isWoman
                ? 'Créez votre compte Woman — réservé à l’univers foot féminin.'
                : 'Créez votre compte en quelques minutes — joueurs, coachs, clubs et partenaires.'}
          </Text>

          <ProDayConfigNotice compact />

          {banner ? (
            <ProDayErrorBanner
              message={banner.message}
              variant={banner.variant}
              onDismiss={() => setBanner(null)}
            />
          ) : null}

          {tab === 'login' ? (
            <View>
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

              <Pressable
                style={authStyles.forgotBtn}
                onPress={() => {
                  clearErrors();
                  setShowForgotPassword(true);
                }}
              >
                <Text style={authStyles.forgotText}>Mot de passe oublié ?</Text>
              </Pressable>

              <Pressable
                style={[authStyles.primaryBtn, loading && authStyles.primaryDisabled]}
                onPress={() => void handleLogin()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.brandInverse} />
                ) : (
                  <Text style={authStyles.primaryBtnText}>Se connecter</Text>
                )}
              </Pressable>

              <View style={authStyles.dividerRow}>
                <View style={authStyles.dividerLine} />
                <Text style={authStyles.dividerText}>ou</Text>
                <View style={authStyles.dividerLine} />
              </View>

              <AuthSocialButtons
                disabled={loading}
                onSuccess={refreshProfile}
                onNeedsProfile={(prefill) => {
                  setSignupPrefill(prefill);
                  openSignup();
                }}
                onError={(msg) => showError(msg)}
              />
            </View>
          ) : (
            <View style={authStyles.signupTeaser}>
              {SIGNUP_TEASER.map((line, i) => (
                <View key={line} style={authStyles.teaserRow}>
                  <View style={authStyles.teaserNum}>
                    <Text style={authStyles.teaserNumText}>{i + 1}</Text>
                  </View>
                  <Text style={authStyles.teaserText}>{line}</Text>
                </View>
              ))}
              <Pressable style={authStyles.primaryBtn} onPress={openSignup}>
                <Text style={authStyles.primaryBtnText}>Inscription ProDay</Text>
              </Pressable>
            </View>
          )}

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

