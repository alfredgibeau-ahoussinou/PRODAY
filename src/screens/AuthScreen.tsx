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
import { AuthPhoneModal } from '../components/auth/AuthPhoneModal';
import { AuthPartnerCodeModal } from '../components/auth/AuthPartnerCodeModal';
import {
  AuthCodeIdentityModal,
  type CodeIdentitySubmission,
} from '../components/auth/AuthCodeIdentityModal';
import type { ResolvedClubAffiliation } from '../services/partnerClubs.service';
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
  AuthModeSwitch,
  AuthPostLoginReveal,
  AuthGatePanel,
  AUTH_XP,
} from '../features/auth/experience';
import { AUTH_SHEET } from '../components/auth/authSheetPalette';
import { isGoogleAuthConfigured } from '../config/oauth';
import type { CarouselPoleId } from '../models/CarouselPole';
import { resolveUniverseAuthCopy } from './authUniverseCopy';
import {
  resolveAuthBackAction,
  resolveAuthSurface,
} from '../utils/authBackStack';
import { shouldReopenUniverseAfterAuth } from '../utils/postAuthNavigation';
import { resolveSignupVisual } from './signup/signupVisualSystem';

/** Hôte auth = feuille claire (maquette #F7F7F7 / AUTH_SHEET), pas le pitch sombre. */
const AUTH_HOST_THEME = 'light' as const;

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
  const { loading: authLoading, configured, refreshProfile } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const { productLine, colors: themeColors } = useAppTheme();
  const { openSpacePicker } = useLaunchIntro();
  const { t } = useTranslation();
  const { isEnabled, disabledCopy } = usePlatformFeatureFlags();
  const registrationOpen = isEnabled('registration_open');
  const quickLogin = useAuthQuickLogin();

  /**
   * Entrée admin EXPLICITE (tuile VIP de l'univers) — verrouille la connexion seule.
   * JAMAIS déduite d'un email mémorisé ou d'un claim : un admin déconnecté est un
   * invité comme les autres (sinon « Espace Administrateur » fuit sur tous les
   * pôles et « Créer un compte » devient silencieusement inopérant).
   */
  const isAdminAuth = initialPole === 'admin';

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
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showPartnerCodeModal, setShowPartnerCodeModal] = useState(false);
  const [pendingAffiliation, setPendingAffiliation] = useState<ResolvedClubAffiliation | null>(null);
  const [partnerCodeLoading, setPartnerCodeLoading] = useState(false);
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
    if (isAdminAuth) {
      // Verrou admin : feedback visible, jamais un clic sans effet.
      setBanner('Les comptes administrateur sont réservés — connexion seule.');
      setMode('login');
      return;
    }
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

  const universeAuthCopy = useMemo(
    () =>
      resolveUniverseAuthCopy({
        isAdminAuth,
        productLine,
        signupInitialRole,
        initialPole,
      }),
    [isAdminAuth, productLine, signupInitialRole, initialPole],
  );

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

  const handlePartnerCodeResolved = (affiliation: ResolvedClubAffiliation) => {
    setShowPartnerCodeModal(false);
    setPendingAffiliation(affiliation);
  };

  const handlePartnerCodeIdentitySubmit = async (identity: CodeIdentitySubmission) => {
    if (!pendingAffiliation) return;
    setPartnerCodeLoading(true);
    clearErrors();
    try {
      await authService.loginWithPartnerCode(pendingAffiliation, identity);
      setPendingAffiliation(null);
      await goHomeAfterAuth();
      prodayHaptics.confirm();
    } catch (e) {
      prodayHaptics.error();
      setBanner(authService.getAuthErrorMessage(e));
    } finally {
      setPartnerCodeLoading(false);
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
        <Icon name="arrow-back" size={20} color={AUTH_SHEET.text} />
      </PressableSpring>
      <View style={styles.toolbarEnd}>
        <LanguageSettingControl
          variant="chip"
          theme={AUTH_HOST_THEME}
          colors={{
            ...themeColors,
            surface: 'rgba(255, 255, 255, 0.92)',
            border: 'rgba(0, 0, 0, 0.08)',
            text: AUTH_SHEET.text,
            textMuted: AUTH_SHEET.textMuted,
            accent: signupVisual.focus,
          }}
        />
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
        theme={AUTH_HOST_THEME}
        toolbar={toolbar}
        footer={legalFooter}
        brandCopy={mode === 'signupTeaser'}
        washTop={signupVisual.washTop}
        washMid={signupVisual.washMid}
      >
        <AuthModeSwitch modeKey={mode}>
          {mode === 'login' ? (
            <View>
              {isAdminAuth ? (
                <>
                  <View style={styles.kickerBadge}>
                    <View style={[styles.kickerDot, { backgroundColor: signupVisual.accent }]} />
                    <ProDayText variant="eyebrow" style={[styles.kickerText, { color: signupVisual.focus }]}>
                      ACCÈS FONDATION VIP
                    </ProDayText>
                  </View>
                  <ProDayText variant="title" style={styles.title}>
                    Connexion Admin
                  </ProDayText>
                  <ProDayText variant="body" style={styles.sub}>
                    Réservé aux fondateurs et administrateurs autorisés.
                  </ProDayText>
                </>
              ) : (
                <>
                  <ProDayText variant="title" style={styles.title}>
                    PRODAY
                  </ProDayText>
                  <ProDayText variant="body" style={styles.sub}>
                    {t('auth.loginSub') || 'Connectez-vous pour accéder à votre espace.'}
                  </ProDayText>
                </>
              )}

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
                    theme={AUTH_HOST_THEME}
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
                theme={AUTH_HOST_THEME}
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
                theme={AUTH_HOST_THEME}
              />

              <AuthRememberRow
                rememberMe={quickLogin.rememberMe}
                onRememberMeChange={quickLogin.setRememberMe}
                biometricEnabled={quickLogin.biometricEnabled}
                onBiometricChange={quickLogin.setBiometricEnabled}
                biometricLabel={quickLogin.biometricLabel}
                biometricAvailable={quickLogin.biometricAvailable}
                theme={AUTH_HOST_THEME}
              />

              <PressableSpring
                onPress={() => {
                  clearErrors();
                  setShowForgotPassword(true);
                }}
                scaleTo={0.98}
                style={styles.forgotRow}
                accessibilityRole="link"
                accessibilityLabel={t('auth.forgotPassword')}
              >
                <ProDayText variant="body" style={styles.forgotLink}>
                  {t('auth.forgotPassword')}
                </ProDayText>
              </PressableSpring>

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
                    theme={AUTH_HOST_THEME}
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
                <>
                  <PressableSpring
                    style={styles.phoneAuthBtn}
                    onPress={() => {
                      clearErrors();
                      setShowPhoneAuth(true);
                    }}
                    scaleTo={0.98}
                    haptic
                  >
                    <Icon name="call" size={16} color={AUTH_SHEET.text} />
                    <ProDayText variant="caption" style={styles.phoneAuthText}>
                      Connexion par Numéro de Téléphone
                    </ProDayText>
                  </PressableSpring>

                  <PressableSpring
                    style={styles.partnerCodeAuthBtn}
                    onPress={() => {
                      clearErrors();
                      setShowPartnerCodeModal(true);
                    }}
                    scaleTo={0.98}
                    haptic
                  >
                    <Icon name="shield-checkmark" size={16} color="#E8B923" />
                    <ProDayText variant="caption" style={styles.partnerCodeAuthText}>
                      Connexion avec un Code Club Bêta
                    </ProDayText>
                  </PressableSpring>
                </>
              ) : null}

              {!isAdminAuth ? (
                <View style={styles.switchRow}>
                  <ProDayText variant="body" style={styles.switchLeading}>
                    {t('auth.newOnProday')}{' '}
                  </ProDayText>
                  <PressableSpring
                    onPress={openSignup}
                    scaleTo={0.98}
                    accessibilityRole="link"
                    accessibilityLabel={t('auth.createAccount')}
                  >
                    <ProDayText variant="body" style={[styles.switchLink, { color: signupVisual.focus }]}>
                      {t('auth.createAccount')}
                    </ProDayText>
                  </PressableSpring>
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
              onCreateWithEmail={openSignup}
              onPhoneAuth={() => {
                clearErrors();
                setShowPhoneAuth(true);
              }}
              onPartnerCode={() => {
                clearErrors();
                setShowPartnerCodeModal(true);
              }}
              onLogin={() => setMode('login')}
              onSocialSuccess={() => void goHomeAfterAuth()}
              onNeedsProfile={(prefill) => {
                setSignupPrefill(prefill);
                openSignup();
              }}
              onError={(msg) => setBanner(msg)}
              disabled={loading}
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
      >
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

      <AuthPhoneModal
        visible={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={() => void goHomeAfterAuth()}
        onError={(msg) => setBanner(msg)}
        accent={signupVisual.accent}
      />

      <AuthPartnerCodeModal
        visible={showPartnerCodeModal}
        onClose={() => setShowPartnerCodeModal(false)}
        onCodeResolved={handlePartnerCodeResolved}
      />

      {pendingAffiliation ? (
        <AuthCodeIdentityModal
          visible={Boolean(pendingAffiliation)}
          affiliation={pendingAffiliation}
          onDismiss={() => setPendingAffiliation(null)}
          onSubmit={handlePartnerCodeIdentitySubmit}
          loading={partnerCodeLoading}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  phoneAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AUTH_SHEET.backgroundMuted,
    borderWidth: 1,
    borderColor: AUTH_SHEET.border,
  },
  phoneAuthText: {
    color: AUTH_SHEET.text,
    fontWeight: '600',
    fontSize: 13,
  },
  partnerCodeAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 185, 35, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 185, 35, 0.35)',
  },
  partnerCodeAuthText: {
    color: '#E8B923',
    fontWeight: '700',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    backgroundColor: AUTH_SHEET.background,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    color: AUTH_SHEET.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 36,
  },
  sub: {
    color: AUTH_SHEET.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 28,
    textAlign: 'center',
  },
  biometricWrap: {
    marginBottom: 12,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotLink: {
    color: AUTH_SHEET.textSecondary,
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: AUTH_SHEET.border,
  },
  dividerText: {
    color: AUTH_SHEET.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  switchRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  switchLeading: {
    color: AUTH_SHEET.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  gateAccentBar: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 18,
  },
  legal: {
    color: AUTH_SHEET.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: AUTH_SHEET.text,
    fontWeight: '700',
  },
});
