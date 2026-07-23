import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { PressableSpring } from '../motion';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AccessTokenRequest, type AuthRequest } from 'expo-auth-session';
import type { AuthSessionResult } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import {
  getGoogleAuthRequestConfig,
  getGoogleAuthSetupHint,
  getGoogleIosRedirectUri,
  getGoogleSignInBlockReason,
  type GoogleAuthRequestConfig,
} from '../../config/oauth';
import {
  authService,
  AuthNeedsProfileError,
  AuthLinkPasswordRequiredError,
} from '../../services/auth.service';
import { AuthOAuthLinkModal } from './AuthOAuthLinkModal';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';

WebBrowser.maybeCompleteAuthSession();

/** Récupère l’id_token (échange code OAuth si nécessaire sur iOS/Android). */
async function resolveGoogleIdToken(
  result: AuthSessionResult,
  googleRequest: AuthRequest | null
): Promise<string | null> {
  const direct =
    result.type === 'success'
      ? (result.authentication?.idToken ?? result.params?.id_token)
      : undefined;
  if (direct && typeof direct === 'string') return direct;

  if (result.type !== 'success' || !googleRequest) return null;
  const code = result.params?.code;
  if (!code || typeof code !== 'string') return null;

  const exchangeRequest = new AccessTokenRequest({
    clientId: googleRequest.clientId,
    redirectUri: googleRequest.redirectUri,
    code,
    extraParams: {
      code_verifier: googleRequest.codeVerifier ?? '',
    },
  });
  const tokens = await exchangeRequest.performAsync(Google.discovery);
  return tokens.idToken ?? null;
}

type SocialProvider = 'google' | 'apple';

interface AuthSocialButtonsProps {
  disabled?: boolean;
  /** Par défaut : Google + Apple (iOS). */
  providers?: SocialProvider[];
  onSuccess: () => void | Promise<void>;
  onNeedsProfile: (prefill: { email: string; displayName?: string }) => void;
  onError: (message: string) => void;
}

interface GoogleSignInButtonProps {
  config: GoogleAuthRequestConfig;
  disabled?: boolean;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void | Promise<void>;
  onNeedsProfile: (prefill: { email: string; displayName?: string }) => void;
  onError: (message: string) => void;
  onLinkPasswordRequired: (error: AuthLinkPasswordRequiredError) => void;
}

/** Sous-composant : le hook Google ne s’exécute que si la config plateforme est valide. */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  config,
  disabled,
  busy,
  onBusyChange,
  onSuccess,
  onNeedsProfile,
  onError,
  onLinkPasswordRequired,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createSocialStyles(c), [c]);
  const redirectUri = useMemo(
    () => (config.iosClientId ? getGoogleIosRedirectUri(config.iosClientId) : undefined),
    [config.iosClientId]
  );
  const [googleRequest, , promptGoogle] = Google.useIdTokenAuthRequest(
    {
      ...config,
      ...(redirectUri ? { redirectUri } : {}),
    },
    { path: 'oauthredirect' }
  );

  const handleAuthResult = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn();
        await onSuccess();
      } catch (e) {
        if (e instanceof AuthNeedsProfileError) {
          onNeedsProfile({
            email: e.email,
            displayName: e.displayName,
          });
          return;
        }
        if (e instanceof AuthLinkPasswordRequiredError) {
          onLinkPasswordRequired(e);
          return;
        }
        onError(authService.getAuthErrorMessage(e));
      }
    },
    [onSuccess, onNeedsProfile, onError, onLinkPasswordRequired]
  );

  const signInWithGoogle = async () => {
    if (!googleRequest) {
      onError('Connexion Google en cours de préparation. Réessayez.');
      return;
    }
    onBusyChange(true);
    try {
      const result = await promptGoogle();
      if (result?.type !== 'success') {
        if (result?.type === 'error') {
          const msg = result.error?.message ?? '';
          const lower = msg.toLowerCase();
          if (lower.includes('redirect') || lower.includes('uri')) {
            onError(
              'Redirection Google refusée. Vérifiez EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID et rebuild : npx expo run:ios.'
            );
          } else if (lower.includes('access_denied')) {
            onError('Connexion Google refusée.');
          } else if (lower.includes('unknown reason') || lower.includes('authorization attempt')) {
            onError(
              'Connexion Google interrompue. Vérifiez que le client OAuth est de type iOS (bundle com.proday.app), puis relancez : npx expo run:ios.'
            );
          } else {
            onError(msg || 'Connexion Google annulée.');
          }
        }
        return;
      }
      const idToken = await resolveGoogleIdToken(result, googleRequest);
      if (!idToken) {
        onError(
          'Connexion Google incomplète. Vérifiez la configuration de connexion Google dans les paramètres de l’application.'
        );
        return;
      }
      await handleAuthResult(async () => {
        await authService.signInWithGoogleIdToken(idToken);
      });
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <PressableSpring
      style={[styles.btn, styles.btnGoogle, (disabled || busy) && styles.btnDisabled]}
      onPress={signInWithGoogle}
      disabled={disabled || busy}
      scaleTo={0.97}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Se connecter avec Google"
    >
      {busy ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.btnText}>Se connecter avec Google</Text>
        </>
      )}
    </PressableSpring>
  );
};

export const AuthSocialButtons: React.FC<AuthSocialButtonsProps> = ({
  disabled,
  providers = ['google', 'apple'],
  onSuccess,
  onNeedsProfile,
  onError,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createSocialStyles(c), [c]);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [linkRequest, setLinkRequest] = useState<AuthLinkPasswordRequiredError | null>(null);
  const googleBlockReason = getGoogleSignInBlockReason();
  const googleConfig = googleBlockReason ? null : getGoogleAuthRequestConfig();

  const showGoogleSetupAlert = () => {
    Alert.alert(
      googleBlockReason ? 'Google — Expo Go' : 'Google non configuré',
      googleBlockReason ?? getGoogleAuthSetupHint()
    );
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAuthResult = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn();
        await onSuccess();
      } catch (e) {
        if (e instanceof AuthNeedsProfileError) {
          onNeedsProfile({
            email: e.email,
            displayName: e.displayName,
          });
          return;
        }
        if (e instanceof AuthLinkPasswordRequiredError) {
          setLinkRequest(e);
          return;
        }
        onError(authService.getAuthErrorMessage(e));
      }
    },
    [onSuccess, onNeedsProfile, onError]
  );

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios' || !appleAvailable) {
      Alert.alert(
        'Apple Sign In',
        'Disponible sur l’application iOS avec un compte Apple configuré.'
      );
      return;
    }
    setBusy('apple');
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const appleCred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleCred.identityToken) {
        onError('Jeton Apple manquant. Réessayez.');
        return;
      }
      await handleAuthResult(async () => {
        await authService.signInWithApple(appleCred.identityToken!, rawNonce);
      });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      onError(authService.getAuthErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const isDisabled = disabled || busy !== null;
  const showGoogle = providers.includes('google');
  const showApple = providers.includes('apple');

  return (
    <>
    <View style={styles.wrap}>
      {showGoogle && googleConfig ? (
        <GoogleSignInButton
          config={googleConfig}
          disabled={disabled}
          busy={busy === 'google'}
          onBusyChange={(v) => setBusy(v ? 'google' : null)}
          onSuccess={onSuccess}
          onNeedsProfile={onNeedsProfile}
          onError={onError}
          onLinkPasswordRequired={setLinkRequest}
        />
      ) : showGoogle ? (
        <PressableSpring
          style={[styles.btn, styles.btnGoogle, isDisabled && styles.btnDisabled]}
          onPress={showGoogleSetupAlert}
          disabled={isDisabled}
          scaleTo={0.97}
          accessibilityRole="button"
          accessibilityLabel="Se connecter avec Google — configuration requise"
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.btnText}>Se connecter avec Google</Text>
        </PressableSpring>
      ) : null}

      {showApple && Platform.OS === 'ios' && appleAvailable ? (
        <PressableSpring
          style={[styles.btn, styles.btnApple, isDisabled && styles.btnDisabled]}
          onPress={signInWithApple}
          disabled={isDisabled}
          scaleTo={0.97}
          haptic
          accessibilityRole="button"
          accessibilityLabel="Se connecter avec Apple"
        >
          {busy === 'apple' ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={22} color={c.brandInverse} />
              <Text style={[styles.btnText, styles.btnAppleText]}>
                Se connecter avec Apple
              </Text>
            </>
          )}
        </PressableSpring>
      ) : null}
    </View>
    <AuthOAuthLinkModal
      request={linkRequest}
      onClose={() => setLinkRequest(null)}
      onSuccess={async () => {
        setLinkRequest(null);
        await onSuccess();
      }}
      onError={onError}
    />
    </>
  );
};

function createSocialStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      minHeight: 50,
      borderWidth: 1.5,
      borderColor: c.borderStrong,
    },
    btnGoogle: {
      backgroundColor: c.surfaceMuted,
    },
    btnApple: {
      backgroundColor: '#FAFAFA',
      borderColor: '#FAFAFA',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    btnAppleText: {
      color: '#000000',
    },
  });
}
