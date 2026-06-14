import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  clearAllSavedAuth,
  clearVaultCredentials,
  isBiometricLoginEnabled,
  loadRememberedEmail,
  loadVaultCredentials,
  saveRememberedEmail,
  saveVaultCredentials,
  setBiometricLoginEnabled,
  type SavedCredentials,
} from '../services/authCredentialVault.service';
import {
  getBiometricCapability,
  promptBiometricAuth,
} from '../services/biometricAuth.service';

export function useAuthQuickLogin() {
  const [rememberMe, setRememberMe] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biométrie');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [canQuickLogin, setCanQuickLogin] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  const refreshQuickLoginState = useCallback(async () => {
    const [email, bioFlag, capability, vault] = await Promise.all([
      loadRememberedEmail(),
      isBiometricLoginEnabled(),
      getBiometricCapability(),
      isBiometricLoginEnabled().then((on) => (on ? loadVaultCredentials() : null)),
    ]);

    setSavedEmail(email);
    setRememberMe(Boolean(email));
    setBiometricEnabled(bioFlag);
    setBiometricLabel(capability.label);
    setBiometricAvailable(capability.available && capability.enrolled);
    setCanQuickLogin(Boolean(bioFlag && vault && capability.enrolled));
  }, []);

  useEffect(() => {
    void refreshQuickLoginState().finally(() => setHydrated(true));
  }, [refreshQuickLoginState]);

  const onRememberMeChange = useCallback(async (next: boolean) => {
    setRememberMe(next);
    if (!next) {
      setBiometricEnabled(false);
      await clearAllSavedAuth();
      setSavedEmail(null);
      setCanQuickLogin(false);
      return;
    }
  }, []);

  const onBiometricEnabledChange = useCallback(async (next: boolean) => {
    if (next) setRememberMe(true);
    setBiometricEnabled(next);
    if (!next) {
      await setBiometricLoginEnabled(false);
      setCanQuickLogin(false);
    }
  }, []);

  const persistAfterLogin = useCallback(
    async (email: string, password: string) => {
      if (!rememberMe) {
        await clearAllSavedAuth();
        setSavedEmail(null);
        setCanQuickLogin(false);
        return;
      }

      await saveRememberedEmail(email);
      setSavedEmail(email);

      if (biometricEnabled && Platform.OS !== 'web') {
        await saveVaultCredentials({ email, password });
        await setBiometricLoginEnabled(true);
        setCanQuickLogin(true);
      } else {
        await clearVaultCredentials();
        await setBiometricLoginEnabled(false);
        setCanQuickLogin(false);
      }
    },
    [rememberMe, biometricEnabled]
  );

  const performBiometricLogin = useCallback(async (): Promise<SavedCredentials | null> => {
    const ok = await promptBiometricAuth(`Connexion avec ${biometricLabel}`);
    if (!ok) return null;
    return loadVaultCredentials();
  }, [biometricLabel]);

  return {
    rememberMe,
    biometricEnabled,
    biometricLabel,
    biometricAvailable,
    canQuickLogin,
    hydrated,
    savedEmail,
    setRememberMe: onRememberMeChange,
    setBiometricEnabled: onBiometricEnabledChange,
    persistAfterLogin,
    performBiometricLogin,
    refreshQuickLoginState,
  };
}
