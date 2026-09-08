import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  type TextInput,
} from 'react-native';
import { authService } from '../services/auth.service';
import { AuthBiometricButton } from '../components/auth/AuthBiometricButton';
import { useAuthQuickLogin } from '../hooks/useAuthQuickLogin';
import { Icon } from '../components/ui/Icon';
import { AuthSocialButtons } from '../components/auth/AuthSocialButtons';
import { AuthRememberRow } from '../components/auth/AuthRememberRow';
import { PushScreenTransition, PressableSpring } from '../components/motion';
import { ProDayConfigNotice } from '../components/ui/ProDayConfigNotice';
import { ProDayText } from '../components/ui/ProDayText';
import { prodayHaptics } from '../utils/prodayHaptics';
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
import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';
import { usePlatformFeatureFlags } from '../hooks/usePlatformFeatureFlags';
import { FeatureDisabledPanel } from '../components/platform/FeatureDisabledPanel';
import {
  AuthExperienceShell,
  AuthInput,
  AuthButton,
  AuthError,
  AuthLink,
  AuthModeSwitch,
  AuthPostLoginReveal,
  AUTH_XP,
} from '../features/auth/experience';
import { isGoogleAuthConfigured } from '../config/oauth';
import { isPlatformAdminEmail } from '../config/admin';
import { Platform } from 'react-native';

import type { CarouselPoleId } from '../models/CarouselPole';
import {
  UNIVERSE_ENTRY_ACCENT,
} from '../components/branding/intro/universeEntryAuth';
import { universePoleDisplayName } from '../components/branding/intro/universePoleBrand';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthScreenProps {
  onDismiss?: () => void;
  initialIntent?: AuthIntent;
  signupProductLine?: ProductLineId;
  signupInitialRole?: UserRole;
  initialPole?: CarouselPoleId;
}

/**
 * ProDay Auth Experience — login signature (pas de restyle de l’ancienne carte).
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({
  onDismiss,
  initialIntent = 'login',
  signupProductLine,
  signupInitialRole,
  initialPole,
}) => {
  const { loading: authLoading, configured, refreshProfile, isAdmin } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const { productLine } = useAppTheme();
  const { openSpacePicker } = useLaunchIntro();
  const { t } = useTranslation();
  const { isEnabled, disabledCopy } = usePlatformFeatureFlags();
  const registrationOpen = isEnabled('registration_open');
  const quickLogin = useAuthQuickLogin();

  const isAdminAuth =
    initialPole === 'admin' ||
    isAdmin ||
    Boolean(quickLogin.savedEmail && isPlatformAdminEmail(quickLogin.savedEmail)) ||
    signupInitialRole === ('admin' as any);

  const [mode, setMode] = useState<'login' | 'signupTeaser'>(
    !isAdminAuth && initialIntent === 'signup' && registrationOpen ? 'signupTeaser' : 'login',
  );
  // Ne jamais ouvrir SignupFlow d’emblée : le teaser propose d’abord créer / se connecter.
  const [signupOpen, setSignupOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signupPrefill, setSignupPrefill] = useState<{
    email: string;
    displayName?: string;
  } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [postLoginReveal, setPostLoginReveal] = useState(false);
  const pendingAfterReveal = useRef<(() => void) | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const showOAuth =
    isGoogleAuthConfigured() || Platform.OS === 'ios';

  useEffect(() => {
    if (!quickLogin.hydrated || !quickLogin.savedEmail) return;
    setEmail((prev) => prev || quickLogin.savedEmail || '');
  }, [quickLogin.hydrated, quickLogin.savedEmail]);

  useEffect(() => {
    if (registrationOpen) return;
    setSignupOpen(false);
    setMode('login');
  }, [registrationOpen]);

  const clearErrors = () => {
    setBanner(null);
    setFieldErrors({});
  };

  const openSignup = useCallback(() => {
    if (isAdminAuth) return;
    if (!registrationOpen) {
      setBanner(disabledCopy('registration_open').message);
      setMode('signupTeaser');
      return;
    }
    clearErrors();
    setSignupOpen(true);
  }, [isAdminAuth, registrationOpen, disabledCopy]);

  const closeSignup = useCallback(() => {
    setSignupOpen(false);
    setSignupPrefill(null);
    setMode('login');
    clearErrors();
  }, []);

  const finishAuthNavigation = useCallback(async () => {
    await refreshProfile();
    openSpacePicker();
    setActiveTab('home');
  }, [refreshProfile, openSpacePicker, setActiveTab]);

  const goHomeAfterAuth = useCallback(async () => {
    pendingAfterReveal.current = () => {
      void finishAuthNavigation();
    };
    setPostLoginReveal(true);
  }, [finishAuthNavigation]);

  const onSignupComplete = useCallback(async () => {
    setSignupOpen(false);
    pendingAfterReveal.current = () => {
      void finishAuthNavigation();
    };
    setPostLoginReveal(true);
  }, [finishAuthNavigation]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return t('auth.emailRequired') || 'Email requis';
    if (!EMAIL_RE.test(value.trim())) return t('auth.emailInvalid') || 'Format email invalide';
    return undefined;
  };

  const validateLoginFields = () => {
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    if (!password) errs.password = t('auth.passwordRequired') || 'Mot de passe requis';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (creds?: { email: string; password: string }) => {
    const loginEmail = creds?.email ?? email;
    const loginPassword = creds?.password ?? password;
    if (!creds && !validateLoginFields()) return;
    if (loading) return;
    setLoading(true);
    clearErrors();
    try {
      await authService.signIn(loginEmail, loginPassword);
      await quickLogin.persistAfterLogin(loginEmail, loginPassword);
      await goHomeAfterAuth();
      prodayHaptics.confirm();
    } catch (e) {
      prodayHaptics.error();
      setBanner(authService.getAuthErrorMessage(e));
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
    // Overlay : onDismiss unmount immédiat. Fallback onglet : home.
    if (onDismiss) {
      onDismiss();
      return;
    }
    setActiveTab('home');
  };

  if (!configured) {
    return (
      <View style={styles.centered}>
        <ProDayConfigNotice blockingOnly />
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={UNIVERSE_ENTRY_ACCENT} />
      </View>
    );
  }

  const toolbar = (
    <View style={styles.toolbar}>
      <PressableSpring
        style={styles.iconBtn}
        onPress={handleBack}
        hitSlop={16}
        scaleTo={0.92}
        haptic
        accessibilityLabel={t('auth.backHome')}
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={20} color={AUTH_XP.white} />
      </PressableSpring>
      <View style={styles.toolbarEnd}>
        <LanguageSettingControl variant="chip" />
      </View>
    </View>
  );

  const legalFooter = (
    <ProDayText variant="caption" style={styles.legal}>
      {t('auth.legalPrefix')}{' '}
      <ProDayText
        variant="caption"
        style={styles.legalLink}
        onPress={() => setLegalDocument('terms')}
      >
        {t('auth.terms')}
      </ProDayText>{' '}
      {t('auth.and')}{' '}
      <ProDayText
        variant="caption"
        style={styles.legalLink}
        onPress={() => setLegalDocument('privacy')}
      >
        {t('auth.privacy')}
      </ProDayText>
      .
    </ProDayText>
  );

  const universeAuthCopy = useMemo(() => {
    const poleLabel = initialPole ? universePoleDisplayName(initialPole) : null;
    if (isAdminAuth) {
      return {
        kicker: 'ACCÈS FONDATION VIP',
        title: 'Espace Administrateur',
        sub: 'Connexion réservée aux fondateurs et administrateurs autorisés.',
        cta: 'Connexion Admin',
        gateTitle: 'Espace Administrateur',
        gateSub: 'Accès réservé.',
      };
    }
    if (productLine === 'pro_staff' || signupInitialRole === 'coach' || initialPole === 'coach') {
      return {
        kicker: 'PÔLE COACH & STAFF',
        title: 'Espace Coach',
        sub: 'Connectez-vous pour piloter vos séances IA, tactiques et convocations.',
        cta: 'Connexion Coach',
        gateTitle: 'Bienvenue dans le pôle Coach',
        gateSub: 'Créez le compte de votre staff, ou connectez-vous si vous êtes déjà inscrit.',
      };
    }
    if (
      productLine === 'pro_club' ||
      signupInitialRole === 'club' ||
      initialPole === 'pro_club' ||
      initialPole === 'president'
    ) {
      return {
        kicker: 'PÔLE CLUB & DIRIGEANTS',
        title: 'Espace Club',
        sub: 'Connectez-vous pour administrer vos effectifs, tournois et adhésions.',
        cta: 'Connexion Club',
        gateTitle: 'Bienvenue dans le pôle Club',
        gateSub: 'Retrouvez votre club FFF à l’inscription, ou connectez-vous à votre espace.',
      };
    }
    if (productLine === 'parent' || signupInitialRole === 'parent' || initialPole === 'parent') {
      return {
        kicker: 'PORTAIL PARENT & FAMILLE',
        title: 'Espace Famille',
        sub: 'Connectez-vous pour suivre votre enfant et le covoiturage club.',
        cta: 'Connexion Famille',
        gateTitle: 'Bienvenue dans l’espace Famille',
        gateSub: 'Créez un compte parent, ou connectez-vous si vous avez déjà un accès.',
      };
    }
    if (productLine === 'sponsor' || signupInitialRole === 'sponsor' || initialPole === 'sponsor') {
      return {
        kicker: 'ESPACE SPONSOR & PARTENAIRES',
        title: 'Espace Partenaire',
        sub: 'Connectez-vous pour gérer vos campagnes et votre visibilité locale.',
        cta: 'Connexion Partenaire',
        gateTitle: 'Bienvenue chez les partenaires',
        gateSub: 'Créez votre espace marque, ou connectez-vous pour reprendre vos campagnes.',
      };
    }
    if (
      productLine === 'supporter' ||
      signupInitialRole === 'supporter' ||
      initialPole === 'supporter'
    ) {
      return {
        kicker: 'TRIBUNE SUPPORTERS',
        title: 'Espace Supporter',
        sub: 'Connectez-vous pour suivre les matchs en direct et voter MVP.',
        cta: 'Connexion Supporter',
        gateTitle: 'Bienvenue en tribune',
        gateSub: 'Créez un compte supporter, ou connectez-vous pour retrouver vos clubs.',
      };
    }
    return {
      kicker: 'PÔLE JOUEUR',
      title: 'Espace Joueur',
      sub: 'Connectez-vous pour accéder à vos statistiques, matchs et CV sportif.',
      cta: 'Connexion Joueur',
      gateTitle: poleLabel ? `Bienvenue dans le pôle ${poleLabel}` : 'Bienvenue dans le pôle Joueur',
      gateSub: 'Créez votre compte joueur, ou connectez-vous si vous êtes déjà sur ProDay.',
    };
  }, [isAdminAuth, productLine, signupInitialRole, initialPole]);

  return (
    <>
      <AuthExperienceShell toolbar={toolbar} footer={legalFooter}>
        <AuthModeSwitch modeKey={mode}>
          {mode === 'login' ? (
            <View>
              <View style={styles.kickerBadge}>
                <View style={styles.kickerDot} />
                <ProDayText variant="eyebrow" style={styles.kickerText}>
                  {universeAuthCopy.kicker}
                </ProDayText>
              </View>
              <ProDayText variant="title" style={styles.title}>
                {universeAuthCopy.title}
              </ProDayText>
              <ProDayText variant="body" style={styles.sub}>
                {universeAuthCopy.sub}
              </ProDayText>

              {banner ? (
                <AuthError message={banner} onDismiss={() => setBanner(null)} />
              ) : null}

              {quickLogin.canQuickLogin && quickLogin.savedEmail ? (
                <View style={styles.biometricWrap}>
                  <AuthBiometricButton
                    email={quickLogin.savedEmail}
                    biometricLabel={quickLogin.biometricLabel}
                    onPress={() => void handleBiometricLogin()}
                    loading={biometricLoading || loading}
                  />
                </View>
              ) : null}

              <AuthInput
                label={t('auth.email')}
                icon="mail"
                placeholder="vous@exemple.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={fieldErrors.email}
              />
              <AuthInput
                ref={passwordRef}
                label={t('auth.password')}
                icon="lock"
                placeholder="••••••••"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: '' }));
                }}
                secureToggle
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                error={fieldErrors.password}
              />

              <AuthRememberRow
                rememberMe={quickLogin.rememberMe}
                onRememberMeChange={quickLogin.setRememberMe}
                biometricEnabled={quickLogin.biometricEnabled}
                onBiometricChange={quickLogin.setBiometricEnabled}
                biometricLabel={quickLogin.biometricLabel}
                biometricAvailable={quickLogin.biometricAvailable}
              />

              <AuthLink
                label={t('auth.forgotPassword')}
                onPress={() => {
                  clearErrors();
                  setShowForgotPassword(true);
                }}
                align="right"
                muted
              />

              <AuthButton
                label={universeAuthCopy.cta}
                onPress={() => void handleLogin()}
                loading={loading}
              />

              {showOAuth ? (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <ProDayText variant="caption" style={styles.dividerText}>
                      {t('auth.or')}
                    </ProDayText>
                    <View style={styles.dividerLine} />
                  </View>
                  <AuthSocialButtons
                    disabled={loading}
                    onSuccess={() => void goHomeAfterAuth()}
                    onNeedsProfile={
                      !isAdminAuth
                        ? (prefill) => {
                            if (!registrationOpen) {
                              setBanner(disabledCopy('registration_open').message);
                              return;
                            }
                            setSignupPrefill(prefill);
                            openSignup();
                          }
                        : () => {
                            setBanner('Accès administrateur non autorisé pour ce compte.');
                          }
                    }
                    onError={(msg) => setBanner(msg)}
                  />
                </>
              ) : null}

              {!isAdminAuth ? (
                <View style={styles.switchRow}>
                  <AuthLink
                    leading={t('auth.newOnProday')}
                    label={t('auth.createAccount')}
                    onPress={openSignup}
                    align="center"
                  />
                </View>
              ) : null}
            </View>
          ) : !registrationOpen ? (
            <FeatureDisabledPanel flag="registration_open" />
          ) : (
            <View>
              <View style={styles.kickerBadge}>
                <View style={styles.kickerDot} />
                <ProDayText variant="eyebrow" style={styles.kickerText}>
                  {universeAuthCopy.kicker}
                </ProDayText>
              </View>
              <ProDayText variant="title" style={styles.title}>
                {universeAuthCopy.gateTitle}
              </ProDayText>
              <ProDayText variant="body" style={styles.sub}>
                {universeAuthCopy.gateSub}
              </ProDayText>
              <AuthButton
                label={t('auth.createAccount') || 'Créer un compte'}
                onPress={openSignup}
              />
              <View style={styles.gateLoginWrap}>
                <AuthButton
                  label={t('auth.login') || 'Se connecter'}
                  onPress={() => setMode('login')}
                  variant="secondary"
                />
              </View>
            </View>
          )}
        </AuthModeSwitch>
      </AuthExperienceShell>

      <AuthPostLoginReveal
        active={postLoginReveal}
        onDone={() => {
          setPostLoginReveal(false);
          const fn = pendingAfterReveal.current;
          pendingAfterReveal.current = null;
          fn?.();
        }}
      />

      <PushScreenTransition active={signupOpen}>
        {signupOpen ? (
          <View style={styles.overlayRoot}>
            <SignupFlow
              productLine={signupProductLine ?? productLine}
              initialRole={signupInitialRole}
              onClose={closeSignup}
              onComplete={onSignupComplete}
              initialEmail={signupPrefill?.email}
              initialDisplayName={signupPrefill?.displayName}
            />
          </View>
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={showForgotPassword || legalDocument != null}>
        {showForgotPassword ? (
          <ForgotPasswordScreen
            initialEmail={email}
            onBack={() => {
              setShowForgotPassword(false);
              clearErrors();
            }}
          />
        ) : legalDocument ? (
          <LegalDocumentScreen
            documentId={legalDocument}
            onBack={() => setLegalDocument(null)}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: AUTH_XP.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayRoot: {
    flex: 1,
    backgroundColor: AUTH_XP.black,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: UNIVERSE_ENTRY_ACCENT,
  },
  kickerText: {
    color: UNIVERSE_ENTRY_ACCENT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 20,
  },
  biometricWrap: {
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: AUTH_XP.border,
  },
  dividerText: {
    color: AUTH_XP.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  switchRow: {
    marginTop: 20,
  },
  gateLoginWrap: {
    marginTop: 12,
  },
  legal: {
    color: AUTH_XP.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: UNIVERSE_ENTRY_ACCENT,
  },
});
