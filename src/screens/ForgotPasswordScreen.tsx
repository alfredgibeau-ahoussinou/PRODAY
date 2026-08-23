import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../services/auth.service';
import { Icon } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { prodayHaptics } from '../utils/prodayHaptics';
import {
  AuthExperienceShell,
  AuthInput,
  AuthButton,
  AuthError,
  AuthLink,
  AUTH_XP,
} from '../features/auth/experience';
import { useTranslation } from '../context/LocaleContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_MS = 45_000;

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  initialEmail = '',
  onBack,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const validateEmail = () => {
    const value = email.trim();
    if (!value) {
      setFieldError(t('auth.emailRequired') || 'Email requis');
      return false;
    }
    if (!EMAIL_RE.test(value)) {
      setFieldError(t('auth.emailInvalid') || 'Format email invalide');
      return false;
    }
    setFieldError(undefined);
    return true;
  };

  const startCooldown = () => {
    const until = Date.now() + RESEND_COOLDOWN_MS;
    setCooldownUntil(until);
    setCooldownLeft(Math.ceil(RESEND_COOLDOWN_MS / 1000));
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0 && cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    }, 500);
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;
    if (Date.now() < cooldownUntil) return;
    setLoading(true);
    setError(null);
    try {
      await authService.sendPasswordReset(email);
      prodayHaptics.confirm();
      setSent(true);
      startCooldown();
    } catch (e) {
      prodayHaptics.error();
      setError(authService.getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const toolbar = useMemo(
    () => (
      <PressableSpring
        style={styles.iconBtn}
        onPress={onBack}
        hitSlop={8}
        scaleTo={0.92}
        haptic
        accessibilityLabel={t('auth.backHome')}
      >
        <Icon name="arrow-back" size={20} color={AUTH_XP.white} />
      </PressableSpring>
    ),
    [onBack, t],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuthExperienceShell toolbar={toolbar} brandCopy={false}>
        {sent ? (
          <View>
            <ProDayText variant="title" style={styles.title}>
              {t('auth.forgot.sentTitle')}
            </ProDayText>
            <ProDayText variant="body" style={styles.sub}>
              {t('auth.forgot.sentBody', { email: email.trim() })}
            </ProDayText>
            <AuthButton label={t('auth.forgot.backLogin')} onPress={onBack} />
            <AuthLink
              label={
                cooldownLeft > 0
                  ? t('auth.forgot.resendCooldown', { seconds: cooldownLeft })
                  : t('auth.forgot.resend')
              }
              onPress={() => {
                if (cooldownLeft > 0) return;
                setSent(false);
                setError(null);
              }}
              align="center"
              muted={cooldownLeft > 0}
            />
          </View>
        ) : (
          <View>
            <ProDayText variant="title" style={styles.title}>
              {t('auth.forgot.title')}
            </ProDayText>
            <ProDayText variant="body" style={styles.sub}>
              {t('auth.forgot.sub')}
            </ProDayText>
            {error ? <AuthError message={error} onDismiss={() => setError(null)} /> : null}
            <AuthInput
              label={t('auth.email')}
              icon="mail"
              placeholder="vous@exemple.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (fieldError) setFieldError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={() => void handleSubmit()}
              error={fieldError}
            />
            <AuthButton
              label={t('auth.forgot.cta')}
              onPress={() => void handleSubmit()}
              loading={loading}
              disabled={cooldownLeft > 0}
            />
            <AuthLink
              label={t('auth.forgot.backLogin')}
              onPress={onBack}
              align="center"
              muted
            />
          </View>
        )}
      </AuthExperienceShell>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_XP.black,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
  },
  title: {
    color: AUTH_XP.white,
    fontSize: 28,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sub: {
    color: AUTH_XP.textMuted,
    marginBottom: 22,
    lineHeight: 22,
  },
});
