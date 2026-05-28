import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import {
  getGoogleAuthRequestConfig,
  getGoogleAuthSetupHint,
  isGoogleAuthConfigured,
  type GoogleAuthRequestConfig,
} from '../../config/oauth';
import {
  authService,
  AuthNeedsProfileError,
} from '../../services/auth.service';
import { colors, spacing, radius } from '../../theme/designTokens';

WebBrowser.maybeCompleteAuthSession();

interface AuthSocialButtonsProps {
  disabled?: boolean;
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
}) => {
  const [googleRequest, , promptGoogle] = Google.useIdTokenAuthRequest(config);

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
        onError(authService.getAuthErrorMessage(e));
      }
    },
    [onSuccess, onNeedsProfile, onError]
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
          if (msg.toLowerCase().includes('redirect') || msg.toLowerCase().includes('uri')) {
            onError(
              'Redirection Google refusée. Vérifiez EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID et relancez Expo (app.config.js).'
            );
          } else if (msg.toLowerCase().includes('access_denied')) {
            onError('Connexion Google refusée.');
          } else {
            onError(msg || 'Connexion Google annulée.');
          }
        }
        return;
      }
      const idToken = result.authentication?.idToken ?? result.params?.id_token;
      if (!idToken || typeof idToken !== 'string') {
        onError(
          'Connexion Google incomplète. Vérifiez que le Web client ID Firebase est dans .env et que Google est activé dans Authentication.'
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
    <TouchableOpacity
      style={[styles.btn, styles.btnGoogle, (disabled || busy) && styles.btnDisabled]}
      onPress={signInWithGoogle}
      disabled={disabled || busy}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Se connecter avec Google"
    >
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.btnText}>Se connecter avec Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export const AuthSocialButtons: React.FC<AuthSocialButtonsProps> = ({
  disabled,
  onSuccess,
  onNeedsProfile,
  onError,
}) => {
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleConfig = getGoogleAuthRequestConfig();

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
        onError(authService.getAuthErrorMessage(e));
      }
    },
    [onSuccess, onNeedsProfile, onError]
  );

  const showGoogleSetupAlert = () => {
    Alert.alert('Google non configuré', getGoogleAuthSetupHint());
  };

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

  return (
    <View style={styles.wrap}>
      {googleConfig ? (
        <GoogleSignInButton
          config={googleConfig}
          disabled={disabled}
          busy={busy === 'google'}
          onBusyChange={(v) => setBusy(v ? 'google' : null)}
          onSuccess={onSuccess}
          onNeedsProfile={onNeedsProfile}
          onError={onError}
        />
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnGoogle, isDisabled && styles.btnDisabled]}
          onPress={showGoogleSetupAlert}
          disabled={isDisabled}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Se connecter avec Google — configuration requise"
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.btnText}>Se connecter avec Google</Text>
        </TouchableOpacity>
      )}

      {Platform.OS === 'ios' && appleAvailable ? (
        <TouchableOpacity
          style={[styles.btn, styles.btnApple, isDisabled && styles.btnDisabled]}
          onPress={signInWithApple}
          disabled={isDisabled}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Se connecter avec Apple"
        >
          {busy === 'apple' ? (
            <ActivityIndicator color={colors.brandInverse} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={22} color={colors.brandInverse} />
              <Text style={[styles.btnText, styles.btnAppleText]}>
                Se connecter avec Apple
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGoogle: {
    backgroundColor: colors.surface,
  },
  btnApple: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  btnAppleText: {
    color: colors.brandInverse,
  },
});
