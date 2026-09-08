import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  Platform,
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
  AuthGatePanel,
  AUTH_XP,
} from '../features/auth/experience';
import { isGoogleAuthConfigured } from '../config/oauth';
import { isPlatformAdminEmail } from '../config/admin';
import type { CarouselPoleId } from '../models/CarouselPole';
import { universePoleDisplayName } from '../components/branding/intro/universePoleBrand';
import {
  resolveAuthBackAction,
  resolveAuthSurface,
} from '../utils/authBackStack';
import { shouldReopenUniverseAfterAuth } from '../utils/postAuthNavigation';
import { resolveSignupVisual } from './signup/signupVisualSystem';

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

  /** Entrée via univers → choix Créer / Se connecter (pas login direct). */
  const enteredViaGate =
    !isAdminAuth && initialIntent === 'signup' && registrationOpen;

  const [mode, setMode] = useState<'login' | 'signupTeaser'>(
    enteredViaGate ? 'signupTeaser' : 'login',
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
  const signupVisual = useMemo(
    () =>
      resolveSignupVisual({
        pole: initialPole,
        productLine: signupProductLine ?? productLine,
        role: signupInitialRole,
      }),
    [initialPole, signupProductLine, productLine, signupInitialRole],
  );

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
    // Depuis le gate : retour au choix Créer / Se connecter (pas login forcé).
    setMode(enteredViaGate ? 'signupTeaser' : 'login');
    clearErrors();
  }, [enteredViaGate]);

  const dismissAuth = useCallback(() => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    setActiveTab('home');
  }, [onDismiss, setActiveTab]);

  const handleBack = useCallback(() => {
    const surface = resolveAuthSurface({
      signupOpen,
      showForgotPassword,
      legalDocument: legalDocument != null,
      mode,
    });
    const action = resolveAuthBackAction({ surface, enteredViaGate });
    switch (action) {
      case 'close-legal':
        setLegalDocument(null);
        return;
      case 'close-forgot':
        setShowForgotPassword(false);
        clearErrors();
        return;
      case 'close-signup-to-gate':
        setSignupOpen(false);
        setSignupPrefill(null);
        setMode('signupTeaser');
        clearErrors();
        return;
      case 'close-signup-to-login':
        setSignupOpen(false);
        setSignupPrefill(null);
        setMode('login');
        clearErrors();
        return;
      case 'to-gate':
        setMode('signupTeaser');
        clearErrors();
        return;
      case 'dismiss':
      default:
        dismissAuth();
    }
  }, [
    signupOpen,
    showForgotPassword,
    legalDocument,
    mode,
    enteredViaGate,
    dismissAuth,
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const finishAuthNavigation = useCallback(async () => {
    await refreshProfile();
    setActiveTab('home');
    // Pôle déjà choisi à l’univers → ne pas réouvrir le carousel (double entrée).
    if (shouldReopenUniverseAfterAuth({ hasChosenPole: Boolean(initialPole) })) {
      openSpacePicker();
    }
  }, [refreshProfile, openSpacePicker, setActiveTab, initialPole]);

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

  const universeAuthCopy = useMemo(() => {
    const poleLabel = initialPole ? universePoleDisplayName(initialPole) : null;
    if (isAdminAuth) {
      return {
        kicker: 'ACCÈS FONDATION VIP',
        title: 'Connexion Admin',
        sub: 'Réservé aux fondateurs et administrateurs autorisés.',
        cta: 'Se connecter',
        gateTitle: 'Espace Administrateur',
        gateSub: 'Accès réservé à l’équipe fondatrice.',
      };
    }
    if (productLine === 'pro_staff' || signupInitialRole === 'coach' || initialPole === 'coach') {
      return {
        kicker: 'PÔLE COACH',
        title: 'Connexion Coach',
        sub: 'Séances, tactiques et convocations — en un accès.',
        cta: 'Se connecter',
        gateTitle: poleLabel ? `Pôle ${poleLabel}` : 'Pôle Coach',
        gateSub: 'Créez votre espace staff, ou connectez-vous.',
      };
    }
    if (
      productLine === 'pro_club' ||
      signupInitialRole === 'club' ||
      initialPole === 'pro_club' ||
      initialPole === 'president'
    ) {
      return {
        kicker: 'PÔLE CLUB',
        title: 'Connexion Club',
        sub: 'Effectifs, matchs et adhésions — votre structure.',
        cta: 'Se connecter',
        gateTitle: poleLabel ? `Pôle ${poleLabel}` : 'Pôle Club',
        gateSub: 'Retrouvez votre club FFF à l’inscription, ou connectez-vous.',
      };
    }
    if (productLine === 'parent' || signupInitialRole === 'parent' || initialPole === 'parent') {
      return {
        kicker: 'ESPACE FAMILLE',
        title: 'Connexion Famille',
        sub: 'Suivi enfant et covoiturage club.',
        cta: 'Se connecter',
        gateTitle: 'Espace Famille',
        gateSub: 'Créez un compte parent, ou reconnectez-vous.',
      };
    }
    if (productLine === 'sponsor' || signupInitialRole === 'sponsor' || initialPole === 'sponsor') {
      return {
        kicker: 'PARTENAIRES',
        title: 'Connexion Partenaire',
        sub: 'Campagnes et visibilité locale.',
        cta: 'Se connecter',
        gateTitle: 'Espace Partenaire',
        gateSub: 'Créez votre espace marque, ou reconnectez-vous.',
      };
    }
    if (
      productLine === 'supporter' ||
      signupInitialRole === 'supporter' ||
      initialPole === 'supporter'
    ) {
      return {
        kicker: 'TRIBUNE',
        title: 'Connexion Supporter',
        sub: 'Matchs en direct et votes MVP.',
        cta: 'Se connecter',
        gateTitle: 'Tribune Supporters',
        gateSub: 'Créez un compte, ou reconnectez-vous.',
      };
    }
    return {
      kicker: 'PÔLE JOUEUR',
      title: 'Connexion Joueur',
      sub: 'Stats, matchs et CV sportif — votre cockpit.',
      cta: 'Se connecter',
      gateTitle: poleLabel ? `Pôle ${poleLabel}` : 'Pôle Joueur',
      gateSub: 'Créez votre compte, ou reconnectez-vous à ProDay.',
    };
  }, [isAdminAuth, productLine, signupInitialRole, initialPole]);

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
        <ActivityIndicator size="large" color={signupVisual.focus} />
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
        style={[styles.legalLink, { color: signupVisual.focus }]}
        onPress={() => setLegalDocument('terms')}
      >
        {t('auth.terms')}
      </ProDayText>{' '}
      {t('auth.and')}{' '}
      <ProDayText
        variant="caption"
        style={[styles.legalLink, { color: signupVisual.focus }]}
        onPress={() => setLegalDocument('privacy')}
      >
        {t('auth.privacy')}
      </ProDayText>
      .
    </ProDayText>
  );

  return (
    <>
      <AuthExperienceShell
        toolbar={toolbar}
        footer={legalFooter}
        brandCopy={mode === 'signupTeaser'}
        washTop={signupVisual.washTop}
        washMid={signupVisual.washMid}
      >        <AuthModeSwitch modeKey={mode}>
          {mode === 'login' ? (
            <View>
              <View style={styles.kickerBadge}>
                <View style={[styles.kickerDot, { backgroundColor: signupVisual.accent }]} />
                <ProDayText variant="eyebrow" style={[styles.kickerText, { color: signupVisual.focus }]}>
                  {universeAuthCopy.kicker}
                </ProDayText>
              </View>
              <View style={[styles.gateAccentBar, { backgroundColor: signupVisual.accent }]} />
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
                accent={signupVisual.focus}
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
                accent={signupVisual.focus}
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
                accent={signupVisual.accent}
                onAccent={signupVisual.onAccent}
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
            <AuthGatePanel
              visual={signupVisual}
              title={universeAuthCopy.gateTitle}
              subtitle={universeAuthCopy.gateSub}
              createLabel={t('auth.createAccount') || 'Créer un compte'}
              loginLabel={t('auth.login') || 'Se connecter'}
              onCreate={openSignup}
              onLogin={() => setMode('login')}
            />
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

      <PushScreenTransition active={signupOpen} variant="fade">
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
      <PushScreenTransition
        active={showForgotPassword || legalDocument != null}
        variant="fade"
      >        {showForgotPassword ? (
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
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  kickerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 36,
  },
  sub: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 28,
    textAlign: 'center',
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
  gateAccentBar: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 18,
  },
  legal: {
    color: AUTH_XP.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: AUTH_XP.goldBright,
  },
});
